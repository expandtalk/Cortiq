import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Shield, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  Play,
  Settings,
  Eye,
  MousePointer,
  Smartphone,
  FormInput,
  AlertCircle
} from 'lucide-react';
import { useBehavioralAlerts } from '@/hooks/useBehavioralAlerts';
import { useToast } from '@/hooks/use-toast';

interface BehavioralAlertsTabProps {
  selectedSite: { id: string; site_name: string };
}

export function BehavioralAlertsTab({ selectedSite }: BehavioralAlertsTabProps) {
  const { 
    alerts, 
    incidents, 
    loading, 
    error, 
    runAnalysis, 
    updateIncidentStatus, 
    updateAlertSettings,
    stats 
  } = useBehavioralAlerts(selectedSite.id);
  const { toast } = useToast();
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [incidentNotes, setIncidentNotes] = useState('');

  const handleRunAnalysis = async () => {
    setAnalysisRunning(true);
    const result = await runAnalysis();
    
    if (result.success) {
      toast({
        title: "Analysis completed",
        description: `${result.results?.incidentsCreated || 0} new incidents detected`
      });
    } else {
      toast({
        title: "Analysis failed",
        description: result.error,
        variant: "destructive"
      });
    }
    setAnalysisRunning(false);
  };

  const handleUpdateIncidentStatus = async (incidentId: string, status: string) => {
    const result = await updateIncidentStatus(incidentId, status as any, incidentNotes);
    
    if (result.success) {
      toast({
        title: "Incident updated",
        description: `Status changed to ${status}`
      });
      setSelectedIncident(null);
      setIncidentNotes('');
    } else {
      toast({
        title: "Update failed",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    const result = await updateAlertSettings(alertId, { is_active: isActive });
    
    if (result.success) {
      toast({
        title: "Alert rule updated",
        description: `Rule ${isActive ? 'enabled' : 'disabled'}`
      });
    } else {
      toast({
        title: "Update failed",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'rage_clicks': return <MousePointer className="h-4 w-4" />;
      case 'high_bounce_rate': return <Activity className="h-4 w-4" />;
      case 'form_abandonment': return <FormInput className="h-4 w-4" />;
      case 'session_timeout': return <Clock className="h-4 w-4" />;
      case 'mobile_conversion_drop': return <Smartphone className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatIncidentData = (incident: any) => {
    const data = incident.incident_data;
    switch (incident.incident_type) {
      case 'rage_clicks':
        return (
          <div className="text-sm space-y-1">
            <p><strong>Location:</strong> {data.location}</p>
            <p><strong>Click count:</strong> {data.clicks_count}</p>
            <p><strong>Time window:</strong> {data.time_window}s</p>
            <p><strong>URL:</strong> {data.url}</p>
          </div>
        );
      case 'high_bounce_rate':
        return (
          <div className="text-sm space-y-1">
            <p><strong>Bounce rate:</strong> {data.bounce_rate?.toFixed(1)}%</p>
            <p><strong>Total sessions:</strong> {data.total_sessions}</p>
            <p><strong>Bounced sessions:</strong> {data.bounced_sessions}</p>
          </div>
        );
      case 'form_abandonment':
        return (
          <div className="text-sm space-y-1">
            <p><strong>Form:</strong> {data.form_type} ({data.form_id})</p>
            <p><strong>Abandonment rate:</strong> {data.abandonment_rate?.toFixed(1)}%</p>
            <p><strong>Abandoned:</strong> {data.abandoned_sessions}/{data.total_sessions}</p>
          </div>
        );
      case 'mobile_conversion_drop':
        return (
          <div className="text-sm space-y-1">
            <p><strong>Mobile conversion:</strong> {data.mobile_conversion_rate?.toFixed(1)}%</p>
            <p><strong>Desktop conversion:</strong> {data.desktop_conversion_rate?.toFixed(1)}%</p>
            <p><strong>Ratio:</strong> {data.conversion_ratio?.toFixed(1)}x</p>
            <p><strong>Drop:</strong> {data.drop_percentage?.toFixed(1)}%</p>
          </div>
        );
      default:
        return <p className="text-sm">Incident data: {JSON.stringify(data)}</p>;
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alarming Behavior Tracking</h2>
          <p className="text-muted-foreground">
            Automatic detection of abnormal user behavior
          </p>
        </div>
        <Button 
          onClick={handleRunAnalysis} 
          disabled={analysisRunning || loading}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {analysisRunning ? 'Analyzing...' : 'Run analysis'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openIncidents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical alerts</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalIncidents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.highIncidents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active rules</CardTitle>
            <Settings className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="alerts">Alert rules</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent incidents</CardTitle>
              <CardDescription>
                Automatically detected behavioral anomalies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading incidents...</div>
              ) : incidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No incidents detected</p>
                  <p className="text-sm">Run an analysis to check current data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <Card key={incident.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getAlertIcon(incident.incident_type)}
                            <div>
                              <CardTitle className="text-base">
                                {incident.incident_type.replace('_', ' ').toUpperCase()}
                              </CardTitle>
                              <CardDescription>
                                {new Date(incident.detected_at).toLocaleString('sv-SE')}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityVariant(incident.severity)}>
                              {incident.severity}
                            </Badge>
                            <Badge 
                              variant={incident.status === 'open' ? 'destructive' : 'secondary'}
                            >
                              {incident.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {formatIncidentData(incident)}
                        
                        {incident.status === 'open' && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex gap-2 mb-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedIncident(
                                  selectedIncident === incident.id ? null : incident.id
                                )}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Manage
                              </Button>
                            </div>
                            
                            {selectedIncident === incident.id && (
                              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                                <Textarea
                                  placeholder="Add notes..."
                                  value={incidentNotes}
                                  onChange={(e) => setIncidentNotes(e.target.value)}
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateIncidentStatus(incident.id, 'investigating')}
                                  >
                                    Investigate
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleUpdateIncidentStatus(incident.id, 'resolved')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Resolve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleUpdateIncidentStatus(incident.id, 'dismissed')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Dismiss
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {incident.notes && (
                          <div className="mt-3 p-2 bg-muted/30 rounded text-sm">
                            <strong>Notes:</strong> {incident.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert rules</CardTitle>
              <CardDescription>
                Configure automatic behavioral alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading alert rules...</div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <Card key={alert.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getAlertIcon(alert.alert_type)}
                            <div>
                              <CardTitle className="text-base">{alert.alert_name}</CardTitle>
                              <CardDescription>{alert.alert_description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={getSeverityVariant(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Switch
                              checked={alert.is_active}
                              onCheckedChange={(checked) => handleToggleAlert(alert.id, checked)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <strong>Configuration:</strong>
                          <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-auto">
                            {JSON.stringify(alert.threshold_config, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}