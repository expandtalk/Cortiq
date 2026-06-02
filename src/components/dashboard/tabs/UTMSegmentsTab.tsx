import React, { useState } from 'react';
import { Pin, Pencil, Trash2, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useUTMSegments, resolveTokens,
  type UTMSegment, type UTMSegmentInput,
} from '@/contexts/UTMSegmentContext';
import { UTMSegmentBuilder } from '@/components/dashboard/UTMSegmentBuilder';

const OP_SYMBOL: Record<string, string> = { eq: '=', contains: '~', starts_with: '^' };

function FilterSummary({ seg }: { seg: UTMSegment }) {
  const resolved = seg.filters.map(f =>
    `${f.field} ${OP_SYMBOL[f.op] ?? f.op} ${resolveTokens(f.value) || '…'}`
  );
  if (resolved.length === 0) return <span className="text-muted-foreground text-xs italic">No filters</span>;
  return (
    <span className="text-xs text-muted-foreground">
      {resolved.join('  ·  ')}
    </span>
  );
}

export function UTMSegmentsTab({ selectedSite }: { selectedSite: { id: string } }) {
  const { segments, activeIds, toggleSegment, createSegment, updateSegment, deleteSegment, togglePin, loading } = useUTMSegments();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editTarget,  setEditTarget]  = useState<UTMSegment | null>(null);

  const openCreate = () => { setEditTarget(null); setBuilderOpen(true); };
  const openEdit   = (seg: UTMSegment) => { setEditTarget(seg); setBuilderOpen(true); };

  const handleSave = async (input: UTMSegmentInput) => {
    if (editTarget) {
      await updateSegment(editTarget.id, input);
    } else {
      await createSegment(input);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">UTM Segments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Named filters applied globally across the dashboard. Active segments appear in the chip row above all views.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />New segment
        </Button>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground py-6 text-center">Loading segments…</div>
      )}

      {!loading && segments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Filter className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No segments created yet.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Create your first segment
            </Button>
          </CardContent>
        </Card>
      )}

      {segments.length > 0 && (
        <div className="space-y-2">
          {segments.map(seg => {
            const isActive = activeIds.includes(seg.id);
            const name = resolveTokens(seg.name);

            return (
              <Card key={seg.id} className={`transition-colors ${isActive ? 'border-primary/40' : ''}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">{name}</span>
                        {seg.is_pinned && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            <Pin className="h-2.5 w-2.5 mr-1" />Pinned
                          </Badge>
                        )}
                        {isActive && (
                          <Badge className="text-[10px] px-1.5 py-0 h-4" style={{ backgroundColor: seg.color }}>
                            Active
                          </Badge>
                        )}
                      </div>
                      <FilterSummary seg={seg} />
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={() => toggleSegment(seg.id)}
                        title={isActive ? 'Deactivate' : 'Activate'}
                      >
                        {isActive ? 'Active' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => togglePin(seg.id)}
                        title={seg.is_pinned ? 'Unpin' : 'Pin to chip row'}
                      >
                        <Pin className={`h-3.5 w-3.5 ${seg.is_pinned ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(seg)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Delete segment "${resolveTokens(seg.name)}"?`)) {
                            deleteSegment(seg.id);
                          }
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-muted/30">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">How segments work</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1.5 text-xs text-muted-foreground">
          <p>• Active segments filter <strong>all</strong> views in the dashboard at once.</p>
          <p>• Multiple active segments are combined with <strong>OR logic</strong> — a session counts if it matches <em>at least one</em> segment.</p>
          <p>• Conditions within a segment use <strong>AND logic</strong> — all conditions must match.</p>
          <p>• Tokens like <code className="bg-muted px-1 rounded">[year]</code>, <code className="bg-muted px-1 rounded">[month]</code> and <code className="bg-muted px-1 rounded">[quarter]</code> are resolved dynamically at runtime.</p>
          <p>• Pinned segments always appear in the chip row, even when inactive.</p>
          <p>• Active segments persist in the URL for shareability (<code className="bg-muted px-1 rounded">?segments=id1,id2</code>).</p>
        </CardContent>
      </Card>

      <UTMSegmentBuilder
        open={builderOpen}
        initial={editTarget ?? undefined}
        onClose={() => { setBuilderOpen(false); setEditTarget(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
