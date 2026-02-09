/**
 * Session Recording List Component
 * Task #7: Session Recording
 *
 * List, filter, and manage session recordings
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Play,
  Filter,
  Trash2,
  Search,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
} from 'lucide-react';
import { SessionRecordingPlayer, SessionRecording } from './SessionRecordingPlayer';

interface SessionRecordingListProps {
  siteId: string;
}

export function SessionRecordingList({ siteId }: SessionRecordingListProps) {
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<SessionRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null);
  const [recordingEvents, setRecordingEvents] = useState<any[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7d');

  useEffect(() => {
    loadRecordings();
  }, [siteId, dateFilter]);

  useEffect(() => {
    applyFilters();
  }, [recordings, searchQuery, deviceFilter, agentFilter]);

  async function loadRecordings() {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      let fromDate = new Date();

      switch (dateFilter) {
        case '1d':
          fromDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          fromDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          fromDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          fromDate.setDate(now.getDate() - 90);
          break;
        default:
          fromDate.setDate(now.getDate() - 7);
      }

      const { data, error } = await supabase
        .from('session_recordings')
        .select('*')
        .eq('site_id', siteId)
        .gte('started_at', fromDate.toISOString())
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setRecordings(data || []);
    } catch (error) {
      console.error('Error loading recordings:', error);
      toast.error('Failed to load session recordings');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...recordings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.page_url.toLowerCase().includes(query) ||
          r.page_title?.toLowerCase().includes(query) ||
          r.visitor_hash.toLowerCase().includes(query)
      );
    }

    // Device filter
    if (deviceFilter !== 'all') {
      filtered = filtered.filter((r) => r.device_type === deviceFilter);
    }

    // AI Agent filter
    if (agentFilter === 'ai') {
      filtered = filtered.filter((r) => r.is_ai_agent === true);
    } else if (agentFilter === 'human') {
      filtered = filtered.filter((r) => r.is_ai_agent === false);
    }

    setFilteredRecordings(filtered);
  }

  async function playRecording(recording: SessionRecording) {
    try {
      // Load recording events
      const { data, error } = await supabase
        .from('session_recording_events')
        .select('*')
        .eq('recording_id', recording.id)
        .order('timestamp_ms');

      if (error) throw error;

      // Convert to rrweb events format
      const events = data.map((e: any) => ({
        type: parseInt(e.event_type),
        data: e.event_data,
        timestamp: e.timestamp_ms,
      }));

      setRecordingEvents(events);
      setSelectedRecording(recording);
    } catch (error) {
      console.error('Error loading recording events:', error);
      toast.error('Failed to load recording');
    }
  }

  async function deleteRecording(id: string) {
    if (!confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('session_recordings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Recording deleted');
      await loadRecordings();
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    }
  }

  function getDeviceIcon(deviceType: string) {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  }

  function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Session Recordings</CardTitle>
          <CardDescription>
            Watch recordings of user sessions to understand behavior and identify issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by URL, title, or visitor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Visitors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visitors</SelectItem>
                <SelectItem value="human">Humans Only</SelectItem>
                <SelectItem value="ai">AI Agents Only 🤖</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{filteredRecordings.length} recordings</span>
            {filteredRecordings.filter((r) => r.is_ai_agent).length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Bot className="h-4 w-4" />
                  {filteredRecordings.filter((r) => r.is_ai_agent).length} AI agents
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recordings Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading recordings...
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recordings found</p>
              <p className="text-sm">
                Recordings will appear here when visitors interact with your site
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecordings.map((recording) => (
                  <TableRow key={recording.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{recording.page_title || 'Untitled'}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {recording.page_url}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs">
                          {recording.visitor_hash.substring(0, 8)}...
                        </code>
                        {recording.is_ai_agent && (
                          <Badge variant="outline" className="text-xs">
                            🤖 {recording.agent_type}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(recording.device_type)}
                        <span className="text-sm">{recording.device_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDuration(recording.duration_ms)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(recording.started_at).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playRecording(recording)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Play
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteRecording(recording.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Player Dialog */}
      {selectedRecording && (
        <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
          <DialogContent className="max-w-6xl">
            <SessionRecordingPlayer
              recording={selectedRecording}
              events={recordingEvents}
              onClose={() => setSelectedRecording(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
