import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Platform definitions ───────────────────────────────────────────────────
export interface SocialPlatformDef {
  key: string;
  label: string;
  color: string;
  domains: string[];
  utmSources: string[];
}

export const SOCIAL_PLATFORMS: SocialPlatformDef[] = [
  { key: 'facebook',  label: 'Facebook',   color: '#1877F2', domains: ['facebook.com','fb.com','l.facebook.com','m.facebook.com'], utmSources: ['facebook','fb'] },
  { key: 'instagram', label: 'Instagram',  color: '#E4405F', domains: ['instagram.com','l.instagram.com'],                         utmSources: ['instagram','ig'] },
  { key: 'linkedin',  label: 'LinkedIn',   color: '#0A66C2', domains: ['linkedin.com','lnkd.in'],                                   utmSources: ['linkedin','li'] },
  { key: 'twitter',   label: 'X / Twitter',color: '#14171A', domains: ['twitter.com','x.com','t.co'],                              utmSources: ['twitter','x','tweet','x.com'] },
  { key: 'tiktok',    label: 'TikTok',     color: '#FE2C55', domains: ['tiktok.com'],                                               utmSources: ['tiktok','tt'] },
  { key: 'youtube',   label: 'YouTube',    color: '#FF0000', domains: ['youtube.com','youtu.be'],                                   utmSources: ['youtube','yt'] },
  { key: 'pinterest', label: 'Pinterest',  color: '#E60023', domains: ['pinterest.com','pin.it'],                                   utmSources: ['pinterest','pin'] },
  { key: 'reddit',    label: 'Reddit',     color: '#FF4500', domains: ['reddit.com','redd.it'],                                     utmSources: ['reddit'] },
];

function detectPlatform(referrer: string | null, utmSource: string | null): string | null {
  const src = (utmSource ?? '').toLowerCase().trim();
  const ref = (referrer  ?? '').toLowerCase().trim();

  for (const p of SOCIAL_PLATFORMS) {
    if (p.utmSources.some(u => src === u || src.startsWith(u + '.'))) return p.key;
    if (p.domains.some(d => ref.includes(d))) return p.key;
    // Loose utm_source match (e.g. utm_source=Facebook matches facebook)
    if (src && p.key.startsWith(src.slice(0, 4))) return p.key;
  }
  return null;
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface PlatformStats {
  platformKey: string;
  label: string;
  color: string;
  sessions: number;
  uniqueUsers: number;
  pageViews: number;
  avgDuration: number;   // seconds
  bounceRate: number;    // percent
  // UTM campaigns from this platform
  campaigns: Array<{ name: string; sessions: number }>;
  // Monthly trend — 12 values (Jan–Dec of selected year)
  monthlyTrend: number[];
}

export interface SocialSummary {
  totalSessions: number;
  totalUniqueUsers: number;
  topPlatform: string | null;
  hasDarkSocial: boolean; // if many sessions have no referrer at all
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useSocialMedia(siteId: string, year: number) {
  const [platforms, setPlatforms] = useState<PlatformStats[]>([]);
  const [summary, setSummary] = useState<SocialSummary>({ totalSessions: 0, totalUniqueUsers: 0, topPlatform: null, hasDarkSocial: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    setError(null);

    try {
      const { data: rows, error: rpcErr } = await supabase
        .rpc('get_social_monthly', { p_site_id: siteId, p_year: year });

      if (rpcErr) throw rpcErr;

      // Per-platform accumulators
      type Acc = {
        sessions: number;
        users: number;
        pageViews: number;
        totalDuration: number;
        bounces: number;
        campaigns: Record<string, number>;
        monthly: number[];
      };
      const acc: Record<string, Acc> = {};
      for (const p of SOCIAL_PLATFORMS) {
        acc[p.key] = { sessions: 0, users: 0, pageViews: 0, totalDuration: 0, bounces: 0, campaigns: {}, monthly: Array(12).fill(0) };
      }

      let directCount = 0;

      (rows ?? []).forEach((row: any) => {
        const key = detectPlatform(row.referrer || null, row.utm_source || null);
        if (!key) {
          if (!row.referrer && !row.utm_source) directCount += Number(row.sessions);
          return;
        }
        const a = acc[key];
        if (!a) return;

        const monthIdx = parseInt(row.month, 10) - 1;
        const s = Number(row.sessions);
        a.sessions    += s;
        a.users       += Number(row.unique_users);
        a.pageViews   += Number(row.page_views);
        a.totalDuration += Number(row.avg_duration) * s;
        a.bounces     += Number(row.bounces);
        if (monthIdx >= 0 && monthIdx < 12) a.monthly[monthIdx] += s;

        const campaign = (row.utm_campaign as string) || '(ingen kampanj)';
        a.campaigns[campaign] = (a.campaigns[campaign] ?? 0) + s;
      });

      const result: PlatformStats[] = SOCIAL_PLATFORMS
        .map(p => {
          const a = acc[p.key];
          return {
            platformKey: p.key,
            label: p.label,
            color: p.color,
            sessions: a.sessions,
            uniqueUsers: a.users,
            pageViews: a.pageViews,
            avgDuration: a.sessions > 0 ? a.totalDuration / a.sessions : 0,
            bounceRate: a.sessions > 0 ? (a.bounces / a.sessions) * 100 : 0,
            campaigns: Object.entries(a.campaigns)
              .sort((x, y) => y[1] - x[1])
              .slice(0, 5)
              .map(([name, sessions]) => ({ name, sessions })),
            monthlyTrend: a.monthly,
          };
        })
        .filter(p => p.sessions > 0)
        .sort((a, b) => b.sessions - a.sessions);

      const totalSessions = result.reduce((s, p) => s + p.sessions, 0);
      const totalUsers    = result.reduce((s, p) => s + p.uniqueUsers, 0);

      setPlatforms(result);
      setSummary({
        totalSessions,
        totalUniqueUsers: totalUsers,
        topPlatform: result[0]?.platformKey ?? null,
        hasDarkSocial: directCount > totalSessions * 0.3,
      });
    } catch (err: any) {
      setError(err?.message ?? err?.error_description ?? 'Kunde inte hämta social media-data');
    } finally {
      setLoading(false);
    }
  }, [siteId, year]);

  useEffect(() => { fetch(); }, [fetch]);

  return { platforms, summary, loading, error, refetch: fetch };
}
