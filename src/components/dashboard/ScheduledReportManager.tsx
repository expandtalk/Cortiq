/**
 * Scheduled Report Manager
 * Task #13: Schemalagda e-postrapporter
 *
 * Configure automated report delivery via email
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Mail,
  Clock,
  Plus,
  Trash2,
  Toggle,
  FileText,
} from 'lucide-react';

interface ScheduledReport {
  id: string;
  custom_report_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number;
  day_of_month?: number;
  time_of_day: string;
  recipients: string[];
  format: 'pdf' | 'html' | 'png';
  is_active: boolean;
  last_sent_at?: string;
  next_send_at?: string;
}

interface ScheduledReportManagerProps {
  reportId: string;
  reportName: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ScheduledReportManager({
  reportId,
  reportName,
}: ScheduledReportManagerProps) {
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [recipients, setRecipients] = useState('');
  const [format, setFormat] = useState<'pdf' | 'html'>('pdf');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [reportId]);

  async function loadSchedules() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('custom_report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  }

  async function createSchedule() {
    if (!recipients.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }

    const emailList = recipients
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e);

    if (emailList.length === 0) {
      toast.error('Please enter valid email addresses');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: report } = await supabase
        .from('custom_reports')
        .select('company_id')
        .eq('id', reportId)
        .single();

      if (!report) throw new Error('Report not found');

      const { error } = await supabase
        .from('scheduled_reports')
        .insert({
          custom_report_id: reportId,
          company_id: report.company_id,
          frequency,
          day_of_week: frequency === 'weekly' ? dayOfWeek : null,
          day_of_month: frequency === 'monthly' ? dayOfMonth : null,
          time_of_day: timeOfDay,
          recipients: emailList,
          format,
          is_active: true,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Scheduled report created!');
      setIsDialogOpen(false);
      setRecipients('');
      await loadSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create scheduled report');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      await loadSchedules();
      toast.success(currentActive ? 'Schedule disabled' : 'Schedule enabled');
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast.error('Failed to update schedule');
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadSchedules();
      toast.success('Schedule deleted');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  }

  function getNextSendText(nextSend?: string): string {
    if (!nextSend) return 'Not scheduled';
    const date = new Date(nextSend);
    return date.toLocaleString();
  }

  function getFrequencyText(schedule: ScheduledReport): string {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.time_of_day}`;
      case 'weekly':
        return `Every ${DAYS_OF_WEEK[schedule.day_of_week || 0]} at ${schedule.time_of_day}`;
      case 'monthly':
        return `Monthly on day ${schedule.day_of_month} at ${schedule.time_of_day}`;
      default:
        return '';
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Scheduled Email Reports
              </CardTitle>
              <CardDescription>
                Automatically send "{reportName}" to team members
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Scheduled Report</DialogTitle>
                  <DialogDescription>
                    Set up automatic email delivery of this report
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {frequency === 'weekly' && (
                    <div>
                      <Label htmlFor="dayOfWeek">Day of Week</Label>
                      <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day, index) => (
                            <SelectItem key={day} value={index.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {frequency === 'monthly' && (
                    <div>
                      <Label htmlFor="dayOfMonth">Day of Month</Label>
                      <Input
                        id="dayOfMonth"
                        type="number"
                        min="1"
                        max="31"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="time">Time of Day</Label>
                    <Input
                      id="time"
                      type="time"
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                    <Input
                      id="recipients"
                      placeholder="john@example.com, jane@example.com"
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="html">HTML (Email)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createSchedule} disabled={isSaving}>
                      {isSaving ? 'Creating...' : 'Create Schedule'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading schedules...
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No scheduled reports yet</p>
              <p className="text-sm">Create one to automatically send reports to your team</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Next Send</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getFrequencyText(schedule)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {schedule.recipients.map((r) => (
                          <div key={r} className="text-muted-foreground">
                            {r}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{schedule.format.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getNextSendText(schedule.next_send_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(schedule.id, schedule.is_active)}
                        >
                          {schedule.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteSchedule(schedule.id)}
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
    </div>
  );
}
