import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, RotateCcw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface CredentialRecord {
  key_name:     string;
  rotated_at:   string;
  max_age_days: number;
  notes:        string | null;
}

function ageDays(rotatedAt: string): number {
  return Math.floor((Date.now() - new Date(rotatedAt).getTime()) / 86_400_000);
}

function statusFor(age: number, maxAge: number): 'ok' | 'warn' | 'critical' {
  if (age > maxAge)          return 'critical';
  if (age > maxAge * 0.75)   return 'warn';
  return 'ok';
}

const STATUS_META = {
  ok:       { label: 'OK',         color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', icon: ShieldCheck },
  warn:     { label: 'Snart dags', color: 'bg-amber-500/10 text-amber-600 border-amber-200',       icon: AlertTriangle },
  critical: { label: 'Rotera nu',  color: 'bg-destructive/10 text-destructive border-destructive/30', icon: ShieldAlert },
};

export function CredentialHealthCard() {
  const [rows, setRows]     = useState<CredentialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('credential_audit')
      .select('key_name, rotated_at, max_age_days, notes')
      .order('key_name')
      .then(({ data }) => {
        setRows((data ?? []) as CredentialRecord[]);
        setLoading(false);
      });
  }, []);

  const anyIssue = rows.some(r => statusFor(ageDays(r.rotated_at), r.max_age_days) !== 'ok');

  return (
    <Card className={anyIssue ? 'border-destructive/40' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {anyIssue
            ? <ShieldAlert className="h-4 w-4 text-destructive" />
            : <ShieldCheck className="h-4 w-4 text-emerald-500" />}
          API-nyckelrotation (AITLP T10)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-xs text-muted-foreground">Laddar…</p>}
        {!loading && rows.map(r => {
          const age    = ageDays(r.rotated_at);
          const status = statusFor(age, r.max_age_days);
          const meta   = STATUS_META[status];
          const Icon   = meta.icon;
          return (
            <div key={r.key_name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="text-xs font-mono truncate">{r.key_name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{age}d sedan</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${meta.color}`}>
                  {meta.label}
                </Badge>
              </div>
            </div>
          );
        })}
        {!loading && rows.length === 0 && (
          <p className="text-xs text-muted-foreground">Inga credential-poster hittades.</p>
        )}
        <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
          <RotateCcw className="h-2.5 w-2.5" />
          Uppdatera <code className="bg-muted px-1 rounded">CLAUDE_KEY_ISSUED_AT</code> i Supabase Secrets efter rotation
        </p>
      </CardContent>
    </Card>
  );
}
