import React, { useState } from 'react';
import { Plus, X, Pin, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useUTMSegments, resolveTokens,
  type UTMSegment, type UTMSegmentInput,
} from '@/contexts/UTMSegmentContext';
import { UTMSegmentBuilder } from './UTMSegmentBuilder';

interface Props {
  /** siteId not used directly here; provider above handles it */
  className?: string;
}

export function UTMSegmentBar({ className = '' }: Props) {
  const { segments, activeIds, toggleSegment, setActiveIds, createSegment, updateSegment, deleteSegment, togglePin } = useUTMSegments();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editTarget,  setEditTarget]  = useState<UTMSegment | null>(null);

  const openCreate = () => { setEditTarget(null); setBuilderOpen(true); };
  const openEdit   = (seg: UTMSegment) => { setEditTarget(seg); setBuilderOpen(true); };

  const handleSave = async (input: UTMSegmentInput) => {
    if (editTarget) {
      await updateSegment(editTarget.id, input);
    } else {
      const created = await createSegment(input);
      if (created) setActiveIds([...activeIds, created.id]);
    }
  };

  // Show: all pinned segments + all active segments (deduped)
  const shown = segments.filter(s => s.is_pinned || activeIds.includes(s.id));

  return (
    <>
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>

        {/* ── "Alla sessioner" reset chip ── */}
        <button
          onClick={() => setActiveIds([])}
          className={[
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            activeIds.length === 0
              ? 'bg-foreground text-background border-foreground'
              : 'bg-muted text-muted-foreground border-border hover:border-foreground/50',
          ].join(' ')}
        >
          All sessions
        </button>

        {/* ── Segment chips ── */}
        {shown.map(seg => {
          const isActive = activeIds.includes(seg.id);
          const name = resolveTokens(seg.name);

          return (
            <div
              key={seg.id}
              className="group inline-flex items-center rounded-full overflow-hidden ring-offset-background transition-shadow"
              style={{
                backgroundColor: seg.color,
                opacity: isActive ? 1 : 0.45,
                boxShadow: isActive ? `0 0 0 2px ${seg.color}40` : undefined,
              }}
            >
              {/* Main label — click toggles active */}
              <button
                onClick={() => toggleSegment(seg.id)}
                className="inline-flex items-center gap-1 pl-3 pr-2 py-1 text-xs font-medium text-white"
                title={isActive ? 'Deactivate segment' : 'Activate segment'}
              >
                {seg.is_pinned && <Pin className="h-2.5 w-2.5 opacity-70 flex-shrink-0" />}
                <span className="max-w-[140px] truncate">{name || 'Unnamed'}</span>
              </button>

              {/* × deactivate (visible when active) */}
              {isActive && (
                <button
                  onClick={() => toggleSegment(seg.id)}
                  className="flex items-center justify-center w-5 h-full text-white hover:bg-white/20 transition-colors"
                  title="Deactivate"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* ⋮ actions menu (visible on hover) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center justify-center w-5 h-full text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
                    title="Options"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 z-[200]">
                  <DropdownMenuItem onClick={() => openEdit(seg)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => togglePin(seg.id)}>
                    <Pin className="h-3.5 w-3.5 mr-2" />
                    {seg.is_pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      if (window.confirm(`Delete segment "${resolveTokens(seg.name)}"?`)) {
                        deleteSegment(seg.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}

        {/* ── + Nytt segment ── */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs rounded-full border-dashed"
          onClick={openCreate}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />New segment
        </Button>
      </div>

      <UTMSegmentBuilder
        open={builderOpen}
        initial={editTarget ?? undefined}
        onClose={() => { setBuilderOpen(false); setEditTarget(null); }}
        onSave={handleSave}
      />
    </>
  );
}
