import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BehavioralAlert {
  id: string;
  site_id: string;
  alert_type: string;
  alert_name: string;
  alert_description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold_config: any;
  is_active: boolean;
  notification_settings: any;
  created_at: string;
  updated_at: string;
}

export interface BehavioralIncident {
  id: string;
  site_id: string;
  alert_id: string;
  incident_type: string;
  incident_data: any;
  severity: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  detected_at: string;
  resolved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useBehavioralAlerts = (siteId: string | null) => {
  const [alerts, setAlerts] = useState<BehavioralAlert[]>([]);
  const [incidents, setIncidents] = useState<BehavioralIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    if (!siteId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: alertsError } = await supabase
        .from('behavioral_alerts')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;
      setAlerts((data || []) as BehavioralAlert[]);
    } catch (err) {
      console.error('Error loading behavioral alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const loadIncidents = async () => {
    if (!siteId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: incidentsError } = await supabase
        .from('behavioral_incidents')
        .select('*')
        .eq('site_id', siteId)
        .order('detected_at', { ascending: false })
        .limit(50);

      if (incidentsError) throw incidentsError;
      setIncidents((data || []) as BehavioralIncident[]);
    } catch (err) {
      console.error('Error loading behavioral incidents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async (): Promise<{ success: boolean; results?: any; error?: string }> => {
    if (!siteId) return { success: false, error: 'No site selected' };

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('behavioral-analysis', {
        body: { siteId }
      });

      if (error) throw error;

      // Refresh incidents after analysis
      await loadIncidents();
      
      return { success: true, results: data.results };
    } catch (err) {
      console.error('Error running behavioral analysis:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Analysis failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (
    incidentId: string, 
    status: BehavioralIncident['status'],
    notes?: string
  ) => {
    try {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from('behavioral_incidents')
        .update(updateData)
        .eq('id', incidentId);

      if (error) throw error;

      // Refresh incidents
      await loadIncidents();
      return { success: true };
    } catch (err) {
      console.error('Error updating incident status:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Update failed' 
      };
    }
  };

  const updateAlertSettings = async (alertId: string, updates: Partial<BehavioralAlert>) => {
    try {
      const { error } = await supabase
        .from('behavioral_alerts')
        .update(updates)
        .eq('id', alertId);

      if (error) throw error;

      // Refresh alerts
      await loadAlerts();
      return { success: true };
    } catch (err) {
      console.error('Error updating alert settings:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Update failed' 
      };
    }
  };

  useEffect(() => {
    if (siteId) {
      loadAlerts();
      loadIncidents();
    }
  }, [siteId]);

  // Get summary statistics
  const getStats = () => {
    const openIncidents = incidents.filter(i => i.status === 'open').length;
    const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status === 'open').length;
    const highIncidents = incidents.filter(i => i.severity === 'high' && i.status === 'open').length;
    const activeAlerts = alerts.filter(a => a.is_active).length;

    return {
      openIncidents,
      criticalIncidents,
      highIncidents,
      activeAlerts,
      totalAlerts: alerts.length,
      totalIncidents: incidents.length
    };
  };

  return {
    alerts,
    incidents,
    loading,
    error,
    loadAlerts,
    loadIncidents,
    runAnalysis,
    updateIncidentStatus,
    updateAlertSettings,
    stats: getStats()
  };
};