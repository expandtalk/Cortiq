import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, Mail, Building2, Phone, Users } from 'lucide-react';
import { format } from 'date-fns';

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  notes: string | null;
}

export default function WaitlistManager() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, [filter]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading waitlist',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: status === 'approved' ? 'User approved' : 'User rejected',
        description: `The waitlist entry has been ${status}.`
      });

      fetchEntries();
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const stats = {
    total: entries.length,
    pending: entries.filter(e => e.status === 'pending').length,
    approved: entries.filter(e => e.status === 'approved').length,
    rejected: entries.filter(e => e.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist Management
          </CardTitle>
          <CardDescription>
            Review and manage beta access requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4 text-center cursor-pointer hover:bg-muted/50" onClick={() => setFilter('all')}>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </Card>
            <Card className={`p-4 text-center cursor-pointer hover:bg-muted/50 ${filter === 'pending' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilter('pending')}>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </Card>
            <Card className={`p-4 text-center cursor-pointer hover:bg-muted/50 ${filter === 'approved' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilter('approved')}>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </Card>
            <Card className={`p-4 text-center cursor-pointer hover:bg-muted/50 ${filter === 'rejected' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilter('rejected')}>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </Card>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No waitlist entries found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{entry.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {entry.email}
                        </div>
                        {entry.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {entry.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.company && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {entry.company}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate" title={entry.message || ''}>
                        {entry.message || '-'}
                      </p>
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(entry.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {entry.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600 hover:bg-green-50"
                            onClick={() => updateStatus(entry.id, 'approved')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => updateStatus(entry.id, 'rejected')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
