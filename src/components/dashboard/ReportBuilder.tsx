/**
 * Custom Report Builder Component
 * Task #8: Custom Reports (rapportbyggare)
 *
 * Drag-and-drop report builder with dimensions, metrics, and visualizations
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3,
  LineChart,
  PieChart,
  Table as TableIcon,
  X,
  Plus,
} from 'lucide-react';

export type Dimension = 'page' | 'referrer' | 'device' | 'country' | 'browser' | 'os' | 'date' | 'hour' | 'agent_type';
export type Metric = 'visits' | 'pageviews' | 'unique_visitors' | 'bounce_rate' | 'avg_session_duration' | 'conversion_rate' | 'revenue';
export type VisualizationType = 'table' | 'line' | 'bar' | 'pie';

interface ReportConfig {
  dimensions: Dimension[];
  metrics: Metric[];
  filters?: Record<string, any>;
  visualization: VisualizationType;
  sort?: { field: string; order: 'asc' | 'desc' };
  limit?: number;
}

interface ReportBuilderProps {
  siteId: string;
  onSave?: (report: any) => void;
  initialConfig?: ReportConfig;
}

const AVAILABLE_DIMENSIONS: { value: Dimension; label: string; description: string }[] = [
  { value: 'page', label: 'Page URL', description: 'Group by page URL' },
  { value: 'referrer', label: 'Referrer', description: 'Traffic source domain' },
  { value: 'device', label: 'Device Type', description: 'Desktop, mobile, tablet' },
  { value: 'country', label: 'Country', description: 'Visitor country' },
  { value: 'browser', label: 'Browser', description: 'Browser name' },
  { value: 'os', label: 'Operating System', description: 'OS name' },
  { value: 'date', label: 'Date', description: 'Group by date' },
  { value: 'hour', label: 'Hour', description: 'Group by hour of day' },
  { value: 'agent_type', label: 'AI Agent Type', description: 'ChatGPT, Perplexity, etc.' },
];

const AVAILABLE_METRICS: { value: Metric; label: string; description: string }[] = [
  { value: 'visits', label: 'Visits', description: 'Number of sessions' },
  { value: 'pageviews', label: 'Page Views', description: 'Total page views' },
  { value: 'unique_visitors', label: 'Unique Visitors', description: 'Distinct visitors' },
  { value: 'bounce_rate', label: 'Bounce Rate', description: 'Single-page sessions (%)' },
  { value: 'avg_session_duration', label: 'Avg. Session Duration', description: 'Average time on site' },
  { value: 'conversion_rate', label: 'Conversion Rate', description: 'Conversion percentage' },
  { value: 'revenue', label: 'Revenue', description: 'Total revenue' },
];

export function ReportBuilder({ siteId, onSave, initialConfig }: ReportBuilderProps) {
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedDimensions, setSelectedDimensions] = useState<Dimension[]>(
    initialConfig?.dimensions || []
  );
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>(
    initialConfig?.metrics || ['visits']
  );
  const [visualization, setVisualization] = useState<VisualizationType>(
    initialConfig?.visualization || 'table'
  );
  const [isSaving, setIsSaving] = useState(false);

  function addDimension(dimension: Dimension) {
    if (selectedDimensions.includes(dimension)) {
      toast.error('Dimension already added');
      return;
    }
    if (selectedDimensions.length >= 3) {
      toast.error('Maximum 3 dimensions allowed');
      return;
    }
    setSelectedDimensions([...selectedDimensions, dimension]);
  }

  function removeDimension(dimension: Dimension) {
    setSelectedDimensions(selectedDimensions.filter((d) => d !== dimension));
  }

  function addMetric(metric: Metric) {
    if (selectedMetrics.includes(metric)) {
      toast.error('Metric already added');
      return;
    }
    if (selectedMetrics.length >= 5) {
      toast.error('Maximum 5 metrics allowed');
      return;
    }
    setSelectedMetrics([...selectedMetrics, metric]);
  }

  function removeMetric(metric: Metric) {
    if (selectedMetrics.length === 1) {
      toast.error('At least one metric is required');
      return;
    }
    setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
  }

  async function saveReport() {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    if (selectedDimensions.length === 0) {
      toast.error('Please select at least one dimension');
      return;
    }

    if (selectedMetrics.length === 0) {
      toast.error('Please select at least one metric');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: site } = await supabase
        .from('sites')
        .select('company_id')
        .eq('id', siteId)
        .single();

      if (!site) throw new Error('Site not found');

      const config: ReportConfig = {
        dimensions: selectedDimensions,
        metrics: selectedMetrics,
        visualization,
        sort: { field: selectedMetrics[0], order: 'desc' },
        limit: 100,
      };

      const { data, error } = await supabase
        .from('custom_reports')
        .insert({
          site_id: siteId,
          company_id: site.company_id,
          name: reportName,
          description: reportDescription || null,
          config,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Report saved successfully!');

      if (onSave) {
        onSave(data);
      }

      // Reset form
      setReportName('');
      setReportDescription('');
      setSelectedDimensions([]);
      setSelectedMetrics(['visits']);
      setVisualization('table');
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  }

  const getVisualizationIcon = (type: VisualizationType) => {
    switch (type) {
      case 'table':
        return <TableIcon className="h-4 w-4" />;
      case 'line':
        return <LineChart className="h-4 w-4" />;
      case 'bar':
        return <BarChart3 className="h-4 w-4" />;
      case 'pie':
        return <PieChart className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Name and Description */}
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Report</CardTitle>
          <CardDescription>
            Build a custom report by selecting dimensions and metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Report Name</Label>
            <Input
              id="name"
              placeholder="e.g., Traffic by Device and Country"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this report shows..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensions (Max 3)</CardTitle>
          <CardDescription>
            Group your data by these attributes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Dimensions */}
          {selectedDimensions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedDimensions.map((dimension) => {
                const dim = AVAILABLE_DIMENSIONS.find((d) => d.value === dimension);
                return (
                  <Badge
                    key={dimension}
                    variant="default"
                    className="pl-3 pr-1 py-2"
                  >
                    {dim?.label}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1"
                      onClick={() => removeDimension(dimension)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Add Dimension */}
          <Select onValueChange={(value) => addDimension(value as Dimension)}>
            <SelectTrigger>
              <SelectValue placeholder="Add a dimension..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_DIMENSIONS.map((dim) => (
                <SelectItem
                  key={dim.value}
                  value={dim.value}
                  disabled={selectedDimensions.includes(dim.value)}
                >
                  <div>
                    <p className="font-medium">{dim.label}</p>
                    <p className="text-xs text-muted-foreground">{dim.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Metrics (Max 5)</CardTitle>
          <CardDescription>
            Select the metrics to measure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Metrics */}
          {selectedMetrics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMetrics.map((metric) => {
                const met = AVAILABLE_METRICS.find((m) => m.value === metric);
                return (
                  <Badge
                    key={metric}
                    variant="secondary"
                    className="pl-3 pr-1 py-2"
                  >
                    {met?.label}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1"
                      onClick={() => removeMetric(metric)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Add Metric */}
          <Select onValueChange={(value) => addMetric(value as Metric)}>
            <SelectTrigger>
              <SelectValue placeholder="Add a metric..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_METRICS.map((met) => (
                <SelectItem
                  key={met.value}
                  value={met.value}
                  disabled={selectedMetrics.includes(met.value)}
                >
                  <div>
                    <p className="font-medium">{met.label}</p>
                    <p className="text-xs text-muted-foreground">{met.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>
            Choose how to display your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['table', 'line', 'bar', 'pie'] as VisualizationType[]).map((type) => (
              <Button
                key={type}
                variant={visualization === type ? 'default' : 'outline'}
                className="h-auto flex-col p-4"
                onClick={() => setVisualization(type)}
              >
                {getVisualizationIcon(type)}
                <span className="mt-2 capitalize">{type}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline">Cancel</Button>
        <Button onClick={saveReport} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Report'}
        </Button>
      </div>
    </div>
  );
}
