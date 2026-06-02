import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────
export type UTMField = 'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content' | 'utm_term';
export type UTMOp    = 'eq' | 'contains' | 'starts_with';

export interface UTMFilter {
  field: UTMField;
  op:    UTMOp;
  value: string;
}

export interface UTMSegment {
  id:          string;
  site_id:     string;
  name:        string;
  template_id: string | null;
  filters:     UTMFilter[];
  color:       string;
  is_pinned:   boolean;
  created_at:  string;
  updated_at:  string;
}

export type UTMSegmentInput = Omit<UTMSegment, 'id' | 'site_id' | 'created_at' | 'updated_at'>;

// ── Token resolution ───────────────────────────────────────────────────────
const MONTH_SV = ['januari','februari','mars','april','maj','juni',
                  'juli','augusti','september','oktober','november','december'];
const MONTH_EN = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
}

export function resolveTokens(value: string, date: Date = new Date()): string {
  const m = date.getMonth();
  const q = Math.ceil((m + 1) / 3);
  return value
    .replace(/\[year\]/g,     String(date.getFullYear()))
    .replace(/\[month\]/g,    MONTH_SV[m])
    .replace(/\[month_en\]/g, MONTH_EN[m])
    .replace(/\[quarter\]/g,  `Q${q}`)
    .replace(/\[week\]/g,     `v${getISOWeek(date)}`);
}

// ── Supabase PostgREST filter string ──────────────────────────────────────
/**
 * Builds a PostgREST or-string for supabase.from(...).or(clause).
 * Multiple segments → OR; multiple filters within a segment → AND.
 * Returns null when no active segments have filters.
 */
export function buildSegmentOrClause(segments: UTMSegment[]): string | null {
  const segClauses = segments
    .map(seg => {
      const fc = seg.filters
        .filter(f => f.value.trim())
        .map(f => {
          const val = resolveTokens(f.value);
          // Escape special chars in value for PostgREST ilike
          const safe = val.replace(/,/g, '%2C').replace(/\(/g, '%28').replace(/\)/g, '%29');
          if (f.op === 'eq')          return `${f.field}.eq.${safe}`;
          if (f.op === 'contains')    return `${f.field}.ilike.*${safe}*`;
          if (f.op === 'starts_with') return `${f.field}.ilike.${safe}*`;
          return '';
        })
        .filter(Boolean);

      if (fc.length === 0) return null;
      if (fc.length === 1) return fc[0];
      return `and(${fc.join(',')})`;
    })
    .filter(Boolean) as string[];

  if (segClauses.length === 0) return null;
  return segClauses.join(',');
}

// ── Predefined colours (v1 — 8 options) ───────────────────────────────────
export const SEGMENT_COLORS = [
  '#0D9488', // teal
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#6366f1', // indigo
];

// ── Templates (mallbibliotek) ──────────────────────────────────────────────
export interface SegmentTemplate {
  id:       string;
  label:    string;
  icon:     string;
  nameTpl:  string;
  filters:  UTMFilter[];
  color:    string;
}

export const SEGMENT_TEMPLATES: SegmentTemplate[] = [
  {
    id: 'google_shopping',
    label: 'Google Shopping',
    icon: '🛒',
    nameTpl: 'Google Shopping [year]',
    color: '#3b82f6',
    filters: [
      { field: 'utm_source', op: 'eq',      value: 'google' },
      { field: 'utm_medium', op: 'eq',      value: 'cpc' },
    ],
  },
  {
    id: 'meta_ads',
    label: 'Meta Ads',
    icon: '📘',
    nameTpl: 'Meta Ads [month] [year]',
    color: '#1877F2',
    filters: [
      { field: 'utm_source', op: 'contains', value: 'facebook' },
    ],
  },
  {
    id: 'newsletter',
    label: 'Nyhetsbrev [month]',
    icon: '📧',
    nameTpl: 'Nyhetsbrev [month] [year]',
    color: '#0D9488',
    filters: [
      { field: 'utm_medium',   op: 'eq',       value: 'email' },
      { field: 'utm_campaign', op: 'contains',  value: 'newsletter' },
    ],
  },
  {
    id: 'google_brand',
    label: 'Google Ads Brand',
    icon: '🔍',
    nameTpl: 'Google Brand [year]',
    color: '#ef4444',
    filters: [
      { field: 'utm_source',   op: 'eq',       value: 'google' },
      { field: 'utm_campaign', op: 'contains',  value: 'brand' },
    ],
  },
  {
    id: 'tiktok_ads',
    label: 'TikTok Ads',
    icon: '🎵',
    nameTpl: 'TikTok Ads [month]',
    color: '#FE2C55',
    filters: [
      { field: 'utm_source', op: 'eq', value: 'tiktok' },
    ],
  },
  {
    id: 'influencer',
    label: 'Influencer-kampanj',
    icon: '⭐',
    nameTpl: 'Influencer [month] [year]',
    color: '#8b5cf6',
    filters: [
      { field: 'utm_medium', op: 'eq', value: 'influencer' },
    ],
  },
  {
    id: 'scratch',
    label: 'Från scratch',
    icon: '✏️',
    nameTpl: '',
    color: '#6366f1',
    filters: [],
  },
];

// ── Context ────────────────────────────────────────────────────────────────
interface UTMSegmentContextValue {
  segments:       UTMSegment[];
  activeIds:      string[];
  activeSegments: UTMSegment[];
  orClause:       string | null;           // ready for .or(clause) on Supabase
  loading:        boolean;
  setActiveIds:   (ids: string[]) => void;
  toggleSegment:  (id: string) => void;
  createSegment:  (input: UTMSegmentInput) => Promise<UTMSegment | null>;
  updateSegment:  (id: string, input: Partial<UTMSegmentInput>) => Promise<void>;
  deleteSegment:  (id: string) => Promise<void>;
  togglePin:      (id: string) => Promise<void>;
  reload:         () => Promise<void>;
}

const UTMSegmentContext = createContext<UTMSegmentContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────
export function UTMSegmentProvider({ siteId, children }: { siteId: string; children: React.ReactNode }) {
  const [segments, setSegments] = useState<UTMSegment[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Active IDs persisted in URL (?segments=id1,id2)
  const activeIds = useMemo<string[]>(() => {
    const raw = searchParams.get('segments') ?? '';
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const setActiveIds = useCallback((ids: string[]) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (ids.length === 0) next.delete('segments');
      else next.set('segments', ids.join(','));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const toggleSegment = useCallback((id: string) => {
    setActiveIds(
      activeIds.includes(id) ? activeIds.filter(x => x !== id) : [...activeIds, id]
    );
  }, [activeIds, setActiveIds]);

  const reload = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    const { data } = await supabase
      .from('utm_segments')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true });
    setSegments((data ?? []) as UTMSegment[]);
    setLoading(false);
  }, [siteId]);

  useEffect(() => { reload(); }, [reload]);

  const activeSegments = useMemo(
    () => segments.filter(s => activeIds.includes(s.id)),
    [segments, activeIds]
  );

  const orClause = useMemo(
    () => buildSegmentOrClause(activeSegments),
    [activeSegments]
  );

  const createSegment = useCallback(async (input: UTMSegmentInput): Promise<UTMSegment | null> => {
    const { data, error } = await supabase
      .from('utm_segments')
      .insert({ ...input, site_id: siteId })
      .select()
      .single();
    if (error || !data) return null;
    await reload();
    return data as UTMSegment;
  }, [siteId, reload]);

  const updateSegment = useCallback(async (id: string, input: Partial<UTMSegmentInput>) => {
    await supabase.from('utm_segments').update(input).eq('id', id);
    await reload();
  }, [reload]);

  const deleteSegment = useCallback(async (id: string) => {
    await supabase.from('utm_segments').delete().eq('id', id);
    setActiveIds(activeIds.filter(x => x !== id));
    await reload();
  }, [reload, activeIds, setActiveIds]);

  const togglePin = useCallback(async (id: string) => {
    const seg = segments.find(s => s.id === id);
    if (!seg) return;
    await supabase.from('utm_segments').update({ is_pinned: !seg.is_pinned }).eq('id', id);
    await reload();
  }, [segments, reload]);

  const value: UTMSegmentContextValue = {
    segments, activeIds, activeSegments, orClause,
    loading, setActiveIds, toggleSegment,
    createSegment, updateSegment, deleteSegment, togglePin, reload,
  };

  return (
    <UTMSegmentContext.Provider value={value}>
      {children}
    </UTMSegmentContext.Provider>
  );
}

export function useUTMSegments() {
  const ctx = useContext(UTMSegmentContext);
  if (!ctx) throw new Error('useUTMSegments must be used inside UTMSegmentProvider');
  return ctx;
}
