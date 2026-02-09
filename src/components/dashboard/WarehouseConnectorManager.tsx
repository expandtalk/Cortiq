/**
 * Warehouse Connector Manager
 * Task #23: Data Warehouse Connector
 *
 * Manage data warehouse connectors and sync jobs
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Plus, Zap, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface WarehouseConnector {
  id: string;
  site_id: string;
  name: string;
  warehouse_type: string;
  schema_name: string;
  sync_enabled: boolean;
  sync_frequency: string;
  status: string;
  last_sync_at?: string;
  next_sync_at?: string;
  created_at: string;
}

interface SyncJob {
  id: string;
  job_type: string;
  status: string;
  progress_percentage: number;
  rows_synced?: number;
  total_rows?: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

interface WarehouseConnectorManagerProps {
  siteId: string;
}

const WAREHOUSE_TYPES = [
  { id: 'bigquery', name: 'Google BigQuery' },
  { id: 'snowflake', name: 'Snowflake' },
  { id: 'redshift', name: 'Amazon Redshift' },
  { id: 'postgres', name: 'PostgreSQL' },
  { id: 'mysql', name: 'MySQL' },
  { id: 'databricks', name: 'Databricks' },
];

const SYNC_FREQUENCIES = [
  { id: 'hourly', label: 'Hourly' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
];

export function WarehouseConnectorManager({ siteId }: WarehouseConnectorManagerProps) {
  const [connectors, setConnectors] = useState<WarehouseConnector[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<WarehouseConnector>();
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    warehouse_type: '',
    schema_name: 'analytics',
    table_prefix: 'cortiq_',
    sync_frequency: 'daily',
    credentials: {
      project_id: '',
      account: '',
      host: '',
      port: '',
      username: '',
      password: '',
      database: '',
    },
  });

  useEffect(() => {
    loadConnectors();
  }, [siteId]);

  useEffect(() => {
    if (selectedConnector) {
      loadSyncJobs();
    }
  }, [selectedConnector]);

  async function loadConnectors() {
    try {
      setLoading(true);
      const response = await fetch(`/api/warehouse-connector/connectors?site_id=${siteId}`);

      if (response.ok) {
        const { data } = await response.json();
        setConnectors(data || []);
        if (data && data.length > 0) {
          setSelectedConnector(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading connectors:', error);
      toast.error('Failed to load warehouse connectors');
    } finally {
      setLoading(false);
    }
  }

  async function loadSyncJobs() {
    try {
      if (!selectedConnector) return;

      const response = await fetch(`/api/warehouse-connector/${selectedConnector.id}/jobs`);

      if (response.ok) {
        const { data } = await response.json();
        setSyncJobs(data || []);
      }
    } catch (error) {
      console.error('Error loading sync jobs:', error);
    }
  }

  async function handleCreateConnector() {
    try {
      if (!formData.name || !formData.warehouse_type) {
        toast.error('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('warehouse_connectors')
        .insert({
          site_id: siteId,
          name: formData.name,
          warehouse_type: formData.warehouse_type,
          schema_name: formData.schema_name,
          table_prefix: formData.table_prefix,
          sync_frequency: formData.sync_frequency,
          credentials: formData.credentials,
          status: 'testing',
        });

      if (error) {
        throw error;
      }

      toast.success('Connector created');
      setIsDialogOpen(false);
      setFormData({
        name: '',
        warehouse_type: '',
        schema_name: 'analytics',
        table_prefix: 'cortiq_',
        sync_frequency: 'daily',
        credentials: {
          project_id: '',
          account: '',
          host: '',
          port: '',
          username: '',
          password: '',
          database: '',
        },
      });
      await loadConnectors();
    } catch (error) {
      console.error('Error creating connector:', error);
      toast.error('Failed to create connector');
    }
  }

  async function testConnection() {
    if (!selectedConnector) return;

    try {
      setIsTesting(true);

      const response = await fetch('/api/warehouse-connector/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connector_id: selectedConnector.id }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        await loadConnectors();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  }

  async function triggerSync(jobType: string = 'incremental_sync') {
    if (!selectedConnector) return;

    try {
      setIsSyncing(true);

      const response = await fetch('/api/warehouse-connector/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connector_id: selectedConnector.id,
          job_type: jobType,
          sync_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          sync_to: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        toast.success('Sync job created');
        await loadSyncJobs();
      } else {
        toast.error('Failed to create sync job');
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Failed to trigger sync');
    } finally {
      setIsSyncing(false);
    }
  }

  async function deleteConnector(connectorId: string) {
    if (!confirm('Are you sure you want to delete this connector?')) return;

    try {
      const { error } = await supabase
        .from('warehouse_connectors')
        .delete()
        .eq('id', connectorId);

      if (error) throw error;

      toast.success('Connector deleted');
      await loadConnectors();
      setSelectedConnector(undefined);
    } catch (error) {
      console.error('Error deleting connector:', error);
      toast.error('Failed to delete connector');
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'testing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getWarehouseName = (type: string) => {
    return WAREHOUSE_TYPES.find((w) => w.id === type)?.name || type;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Warehouse Connectors
              </CardTitle>
              <CardDescription>
                Connect to data warehouses and sync analytics data
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Connector
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Warehouse Connector</DialogTitle>
                  <DialogDescription>
                    Connect your analytics data to a data warehouse
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Connector Name</Label>
                    <Input
                      id="name"
                      placeholder="My BigQuery Connection"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="warehouse_type">Warehouse Type</Label>
                    <Select value={formData.warehouse_type} onValueChange={(value) => setFormData({ ...formData, warehouse_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WAREHOUSE_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schema_name">Schema Name</Label>
                      <Input
                        id="schema_name"
                        value={formData.schema_name}
                        onChange={(e) => setFormData({ ...formData, schema_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="table_prefix">Table Prefix</Label>
                      <Input
                        id="table_prefix"
                        value={formData.table_prefix}
                        onChange={(e) => setFormData({ ...formData, table_prefix: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sync_frequency">Sync Frequency</Label>
                    <Select value={formData.sync_frequency} onValueChange={(value) => setFormData({ ...formData, sync_frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SYNC_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.id} value={freq.id}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Credentials</p>
                    {formData.warehouse_type === 'bigquery' && (
                      <Input
                        placeholder="Google Cloud Project ID"
                        value={formData.credentials.project_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            credentials: { ...formData.credentials, project_id: e.target.value },
                          })
                        }
                      />
                    )}
                    {formData.warehouse_type === 'snowflake' && (
                      <Input
                        placeholder="Snowflake Account"
                        value={formData.credentials.account}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            credentials: { ...formData.credentials, account: e.target.value },
                          })
                        }
                      />
                    )}
                    {['redshift', 'postgres', 'mysql'].includes(formData.warehouse_type) && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Host"
                          value={formData.credentials.host}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              credentials: { ...formData.credentials, host: e.target.value },
                            })
                          }
                        />
                        <Input
                          placeholder="Port"
                          value={formData.credentials.port}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              credentials: { ...formData.credentials, port: e.target.value },
                            })
                          }
                        />
                        <Input
                          placeholder="Username"
                          value={formData.credentials.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              credentials: { ...formData.credentials, username: e.target.value },
                            })
                          }
                        />
                        <Input
                          type="password"
                          placeholder="Password"
                          value={formData.credentials.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              credentials: { ...formData.credentials, password: e.target.value },
                            })
                          }
                        />
                        <Input
                          placeholder="Database"
                          value={formData.credentials.database}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              credentials: { ...formData.credentials, database: e.target.value },
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateConnector}>Create Connector</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading connectors...
            </div>
          ) : connectors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No warehouse connectors yet</p>
              <p className="text-sm">Create one to sync analytics data to your warehouse</p>
            </div>
          ) : (
            <Tabs defaultValue="connectors">
              <TabsList>
                <TabsTrigger value="connectors">Connectors</TabsTrigger>
                <TabsTrigger value="jobs" disabled={!selectedConnector}>
                  Sync Jobs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="connectors" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Schema</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectors.map((connector) => (
                      <TableRow
                        key={connector.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedConnector(connector)}
                      >
                        <TableCell className="font-medium">{connector.name}</TableCell>
                        <TableCell>{getWarehouseName(connector.warehouse_type)}</TableCell>
                        <TableCell className="text-sm">{connector.schema_name}</TableCell>
                        <TableCell className="text-sm capitalize">{connector.sync_frequency}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(connector.status)}
                            <Badge
                              variant={
                                connector.status === 'active'
                                  ? 'default'
                                  : connector.status === 'error'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {connector.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {connector.last_sync_at ? new Date(connector.last_sync_at).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConnector(connector.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="jobs" className="space-y-4">
                {selectedConnector && (
                  <>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => triggerSync('incremental_sync')}
                        disabled={isSyncing}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {isSyncing ? 'Syncing...' : 'Trigger Sync'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={testConnection}
                        disabled={isTesting}
                      >
                        {isTesting ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>

                    {syncJobs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No sync jobs yet
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Rows</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {syncJobs.map((job) => (
                            <TableRow key={job.id}>
                              <TableCell className="font-medium capitalize">{job.job_type}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    job.status === 'completed'
                                      ? 'default'
                                      : job.status === 'failed'
                                        ? 'destructive'
                                        : 'secondary'
                                  }
                                >
                                  {job.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{job.progress_percentage}%</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {job.started_at ? new Date(job.started_at).toLocaleString() : '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {job.rows_synced ? `${job.rows_synced} / ${job.total_rows}` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
