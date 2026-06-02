import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  type UTMFilter, type UTMSegmentInput, type UTMField, type UTMOp,
  type SegmentTemplate,
  SEGMENT_TEMPLATES, SEGMENT_COLORS, resolveTokens,
} from '@/contexts/UTMSegmentContext';

const FIELD_LABELS: Record<UTMField, string> = {
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  utm_content: 'utm_content',
  utm_term: 'utm_term',
};

const OP_LABELS: Record<UTMOp, string> = {
  eq:          'equals (=)',
  contains:    'contains (~)',
  starts_with: 'starts with (^)',
};

const TOKEN_HINTS = '[year]  [month]  [month_en]  [quarter]  [week]';

function emptyFilter(): UTMFilter {
  return { field: 'utm_source', op: 'eq', value: '' };
}

function StepTemplate({ onSelect }: { onSelect: (tpl: SegmentTemplate) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Choose a template to start from, or build from scratch.</p>
      <div className="grid grid-cols-2 gap-2">
        {SEGMENT_TEMPLATES.map(tpl => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className="flex items-center gap-2 p-3 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <span className="text-xl">{tpl.icon}</span>
            <div>
              <p className="text-sm font-medium">{tpl.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {tpl.filters.length > 0
                  ? tpl.filters.map(f => `${f.field} ${f.op === 'eq' ? '=' : f.op === 'contains' ? '~' : '^'} ${f.value || '…'}`).join(' · ')
                  : 'No preset filters'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFilters({
  filters,
  onChange,
}: { filters: UTMFilter[]; onChange: (f: UTMFilter[]) => void }) {
  const update = (i: number, patch: Partial<UTMFilter>) => {
    const next = filters.map((f, idx) => idx === i ? { ...f, ...patch } : f);
    onChange(next);
  };
  const remove = (i: number) => onChange(filters.filter((_, idx) => idx !== i));
  const add    = () => onChange([...filters, emptyFilter()]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        All conditions are matched with AND logic. Leave a value empty to ignore that field.
      </p>
      {filters.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No filters yet — matches all sessions.</p>
      )}
      <div className="space-y-2">
        {filters.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <Select value={f.field} onValueChange={v => update(i, { field: v as UTMField })}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(FIELD_LABELS) as UTMField[]).map(k => (
                  <SelectItem key={k} value={k} className="text-xs">{FIELD_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={f.op} onValueChange={v => update(i, { op: v as UTMOp })}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(OP_LABELS) as UTMOp[]).map(k => (
                  <SelectItem key={k} value={k} className="text-xs">{OP_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 min-w-0">
              <Input
                value={f.value}
                onChange={e => update(i, { value: e.target.value })}
                className="h-8 text-xs"
                placeholder="value  ·  e.g. facebook  or  newsletter-[year]"
              />
            </div>
            <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1.5" />Add filter
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Dynamic tokens in values: <code className="bg-muted px-1 rounded">{TOKEN_HINTS}</code>
      </p>
    </div>
  );
}

function StepNameColor({
  name, color,
  onNameChange, onColorChange,
}: {
  name: string; color: string;
  onNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
}) {
  const resolved = resolveTokens(name);
  const hasTokens = resolved !== name;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="seg-name">Name</Label>
        <Input
          id="seg-name"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder='e.g. Newsletter [month] [year]'
          className="text-sm"
        />
        {hasTokens && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span>Preview:</span>
            <Badge variant="outline" className="text-xs font-medium" style={{ borderColor: color, color }}>
              {resolved}
            </Badge>
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Tokens: <code className="bg-muted px-1 rounded">{TOKEN_HINTS}</code>
        </p>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {SEGMENT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      <div className="pt-1">
        <p className="text-xs text-muted-foreground mb-1.5">Preview in chip row:</p>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {resolved || 'Segment'}
        </span>
      </div>
    </div>
  );
}

interface UTMSegmentBuilderProps {
  open:        boolean;
  initial?:    Partial<UTMSegmentInput>;
  onClose:     () => void;
  onSave:      (input: UTMSegmentInput) => Promise<void>;
}

export function UTMSegmentBuilder({ open, initial, onClose, onSave }: UTMSegmentBuilderProps) {
  const [step,    setStep]    = useState<1 | 2 | 3>(initial ? 2 : 1);
  const [filters, setFilters] = useState<UTMFilter[]>(initial?.filters ?? []);
  const [name,    setName]    = useState(initial?.name ?? '');
  const [color,   setColor]   = useState(initial?.color ?? SEGMENT_COLORS[0]);
  const [saving,  setSaving]  = useState(false);

  const handleTemplate = (tpl: SegmentTemplate) => {
    setFilters(tpl.filters.map(f => ({ ...f })));
    if (!name && tpl.nameTpl) setName(tpl.nameTpl);
    if (tpl.color) setColor(tpl.color);
    setStep(2);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), filters, color, is_pinned: initial?.is_pinned ?? false, template_id: initial?.template_id ?? null });
    setSaving(false);
    onClose();
  };

  const reset = () => {
    setStep(initial ? 2 : 1);
    setFilters(initial?.filters ?? []);
    setName(initial?.name ?? '');
    setColor(initial?.color ?? SEGMENT_COLORS[0]);
  };

  const STEP_LABELS = ['Choose template', 'Configure filters', 'Name & color'];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? 'Edit segment' : 'New UTM segment'}
          </DialogTitle>
          <div className="flex items-center gap-1.5 pt-1">
            {([1, 2, 3] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1 text-xs ${step === s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? 'bg-primary text-primary-foreground' : step > s ? 'bg-primary/30 text-primary' : 'bg-muted'}`}>
                    {s}
                  </span>
                  <span className="hidden sm:inline">{STEP_LABELS[i]}</span>
                </div>
                {s < 3 && <div className="flex-1 h-px bg-border max-w-[40px]" />}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        <div className="py-2 min-h-[260px]">
          {step === 1 && <StepTemplate onSelect={handleTemplate} />}
          {step === 2 && <StepFilters filters={filters} onChange={setFilters} />}
          {step === 3 && (
            <StepNameColor
              name={name} color={color}
              onNameChange={setName} onColorChange={setColor}
            />
          )}
        </div>

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" size="sm" onClick={() => setStep(s => Math.max(1, s - 1) as 1|2|3)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Back
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button size="sm" onClick={() => setStep(s => Math.min(3, s + 1) as 1|2|3)}>
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save segment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
