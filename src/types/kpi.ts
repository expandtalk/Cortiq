export type KPIStatus = 'activated' | 'partial' | 'planned';
export type KPICategory = 'critical' | 'live-data' | 'planned';
export type KPIPriority = 'critical' | 'high' | 'medium' | 'low';

export interface KPIMetric {
  id: string;
  title: string;
  description: string;
  businessValue: string;
  status: KPIStatus;
  category: KPICategory;
  priority: KPIPriority;
  dataSources: string[];
  integrations: string[];
  order: number;
  enabled: boolean;
  hasLiveData: boolean;
}

export interface KPIData {
  metricId: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  lastUpdated: Date;
}
