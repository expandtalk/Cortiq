/**
 * GDPR DSAR Manager Component
 * Task #11: DSAR-verktyg (GDPR)
 *
 * Handle Data Subject Access Requests and Right to Erasure
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Download, Trash2, Search, Shield, AlertTriangle } from 'lucide-react';

interface VisitorData {
  visitor_hash: string;
  sessions: number;
  pageviews: number;
  events: number;
  first_seen: string;
  last_seen: string;
  data_points: number;
}

export function GDPRManager({ siteId }: { siteId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function searchVisitor() {
    if (!searchTerm.trim()) {
      toast.error('Please enter a visitor hash or IP');
      return;
    }

    setSearching(true);
    setVisitorData(null);

    try {
      // Search for visitor data
      const { data: sessions, error: sessionsError } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('site_id', siteId)
        .eq('visitor_hash', searchTerm)
        .order('started_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        toast.error('No data found for this visitor');
        return;
      }

      const { data: pageviews } = await supabase
        .from('page_views')
        .select('id')
        .eq('site_id', siteId)
        .in('session_id', sessions.map(s => s.id));

      const { data: events } = await supabase
        .from('tracking_events')
        .select('id')
        .eq('site_id', siteId)
        .eq('visitor_hash', searchTerm);

      setVisitorData({
        visitor_hash: searchTerm,
        sessions: sessions.length,
        pageviews: pageviews?.length || 0,
        events: events?.length || 0,
        first_seen: sessions[sessions.length - 1].started_at,
        last_seen: sessions[0].started_at,
        data_points: sessions.length + (pageviews?.length || 0) + (events?.length || 0)
      });

      toast.success('Visitor data found');
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search for visitor data');
    } finally {
      setSearching(false);
    }
  }

  async function exportVisitorData() {
    if (!visitorData) return;

    setExporting(true);

    try {
      // Fetch all data for the visitor
      const { data: sessions } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('site_id', siteId)
        .eq('visitor_hash', visitorData.visitor_hash);

      const sessionIds = sessions?.map(s => s.id) || [];

      const { data: pageviews } = await supabase
        .from('page_views')
        .select('*')
        .eq('site_id', siteId)
        .in('session_id', sessionIds);

      const { data: events } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('site_id', siteId)
        .eq('visitor_hash', visitorData.visitor_hash);

      // Create DSAR export
      const dsarExport = {
        visitor_hash: visitorData.visitor_hash,
        site_id: siteId,
        export_date: new Date().toISOString(),
        data: {
          sessions: sessions || [],
          pageviews: pageviews || [],
          events: events || [],
        },
        summary: {
          total_sessions: visitorData.sessions,
          total_pageviews: visitorData.pageviews,
          total_events: visitorData.events,
          first_seen: visitorData.first_seen,
          last_seen: visitorData.last_seen,
        }
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(dsarExport, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dsar-export-${visitorData.visitor_hash}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log DSAR action
      await supabase.from('gdpr_audit_log').insert({
        site_id: siteId,
        action: 'dsar_export',
        visitor_hash: visitorData.visitor_hash,
        performed_by: (await supabase.auth.getUser()).data.user?.id,
      });

      toast.success('DSAR export downloaded');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export visitor data');
    } finally {
      setExporting(false);
    }
  }

  async function deleteVisitorData() {
    if (!visitorData) return;

    const confirmed = confirm(
      `⚠️ PERMANENT ACTION\n\n` +
      `This will permanently delete ALL data for visitor ${visitorData.visitor_hash}:\n\n` +
      `• ${visitorData.sessions} sessions\n` +
      `• ${visitorData.pageviews} page views\n` +
      `• ${visitorData.events} events\n\n` +
      `This action CANNOT be undone.\n\n` +
      `Type 'DELETE' to confirm:`
    );

    if (!confirmed) return;

    const confirmation = prompt('Type DELETE to confirm:');
    if (confirmation !== 'DELETE') {
      toast.error('Deletion cancelled');
      return;
    }

    setDeleting(true);

    try {
      // Delete via Edge Function (handles cascading deletes)
      const { error } = await supabase.functions.invoke('gdpr-delete-visitor', {
        body: {
          site_id: siteId,
          visitor_hash: visitorData.visitor_hash
        }
      });

      if (error) throw error;

      // Log GDPR action
      await supabase.from('gdpr_audit_log').insert({
        site_id: siteId,
        action: 'right_to_erasure',
        visitor_hash: visitorData.visitor_hash,
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        data_deleted: {
          sessions: visitorData.sessions,
          pageviews: visitorData.pageviews,
          events: visitorData.events
        }
      });

      toast.success('Visitor data permanently deleted');
      setVisitorData(null);
      setSearchTerm('');
    } catch (error) {
      console.error('Deletion error:', error);
      toast.error('Failed to delete visitor data');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>GDPR Data Subject Access Request (DSAR)</CardTitle>
          </div>
          <CardDescription>
            Handle data access requests and right to erasure under GDPR Article 15 & 17
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              All actions are logged in the audit trail for compliance purposes.
              Deletions are permanent and cannot be undone.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="search">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search & Export</TabsTrigger>
              <TabsTrigger value="delete">Right to Erasure</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="search">Visitor Hash or IP Address</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="search"
                    placeholder="e.g., abc123def456... or 192.168.1.1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchVisitor()}
                  />
                  <Button onClick={searchVisitor} disabled={searching}>
                    <Search className="h-4 w-4 mr-2" />
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {visitorData && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">Visitor Data Found</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Visitor Hash</p>
                        <code className="text-sm font-mono">{visitorData.visitor_hash}</code>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Data Points</p>
                        <p className="font-medium">{visitorData.data_points}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sessions</p>
                        <p className="font-medium">{visitorData.sessions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Page Views</p>
                        <p className="font-medium">{visitorData.pageviews}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Events</p>
                        <p className="font-medium">{visitorData.events}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date Range</p>
                        <p className="text-sm">
                          {new Date(visitorData.first_seen).toLocaleDateString()} -
                          {new Date(visitorData.last_seen).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={exportVisitorData}
                        disabled={exporting}
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {exporting ? 'Exporting...' : 'Export All Data (JSON)'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="delete" className="space-y-4 mt-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Deletion is permanent and cannot be undone.
                  All session data, page views, and events for this visitor will be permanently erased.
                </AlertDescription>
              </Alert>

              {visitorData ? (
                <Card className="bg-destructive/10 border-destructive">
                  <CardHeader>
                    <CardTitle className="text-base text-destructive">
                      Ready to Delete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Data to be deleted:</p>
                      <ul className="text-sm space-y-1">
                        <li>• {visitorData.sessions} sessions</li>
                        <li>• {visitorData.pageviews} page views</li>
                        <li>• {visitorData.events} events</li>
                        <li>• Total: {visitorData.data_points} data points</li>
                      </ul>
                    </div>

                    <Button
                      variant="destructive"
                      onClick={deleteVisitorData}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? 'Deleting...' : 'Permanently Delete All Data'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Search for a visitor first to enable deletion
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Compliance Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">GDPR Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Article 15 - Right to Access:</strong>
            <p className="text-muted-foreground">
              Export all personal data held about the data subject in a structured, machine-readable format (JSON).
            </p>
          </div>
          <div>
            <strong>Article 17 - Right to Erasure:</strong>
            <p className="text-muted-foreground">
              Permanently delete all personal data about the data subject without undue delay.
            </p>
          </div>
          <div>
            <strong>Audit Trail:</strong>
            <p className="text-muted-foreground">
              All DSAR actions are logged with timestamp, user, and action details for compliance verification.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
