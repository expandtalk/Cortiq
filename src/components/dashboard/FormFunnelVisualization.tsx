import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFormFunnelAnalysis } from '@/hooks/useFormAnalytics';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Users, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

interface FormFunnelVisualizationProps {
  siteId: string;
  formId: string;
  formName?: string;
}

const FunnelStepNode = ({ data }: { data: any }) => {
  const { field, step, index, totalSteps } = data;
  
  const getStepColor = (completionRate: number) => {
    if (completionRate >= 80) return 'border-green-500 bg-green-50';
    if (completionRate >= 60) return 'border-yellow-500 bg-yellow-50';
    return 'border-red-500 bg-red-50';
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'tel': return '📞';
      case 'text': return '✏️';
      case 'textarea': return '📝';
      case 'select': return '📋';
      case 'checkbox': return '☑️';
      case 'radio': return '🔘';
      default: return '📄';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 bg-white min-w-[280px] ${getStepColor(step.completionRate)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getFieldTypeIcon(field.field_type)}</span>
          <span className="font-medium text-sm">Step {index + 1}</span>
        </div>
        <Badge variant={step.completionRate >= 70 ? 'default' : 'destructive'}>
          {step.completionRate.toFixed(1)}%
        </Badge>
      </div>
      
      <h4 className="font-semibold mb-1">{field.field_label || field.field_name}</h4>
      <p className="text-xs text-muted-foreground mb-3">
        {field.field_type} • Position {field.field_position}
      </p>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Users
          </span>
          <span className="font-medium">{step.users.toLocaleString()}</span>
        </div>
        
        <Progress value={step.completionRate} className="h-2" />
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Interactions:</span>
            <span className="font-medium ml-1">{field.total_interactions}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Errors:</span>
            <span className="font-medium ml-1 text-red-600">{field.total_errors}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Skips:</span>
            <span className="font-medium ml-1 text-yellow-600">{field.total_skips}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Focus time:</span>
            <span className="font-medium ml-1">{(field.avg_focus_time / 1000).toFixed(1)}s</span>
          </div>
        </div>
        
        {step.dropOffRate > 20 && (
          <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
            <TrendingDown className="h-3 w-3" />
            High drop-off rate: {step.dropOffRate.toFixed(1)}%
          </div>
        )}
        
        {field.error_rate > 10 && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
            <AlertTriangle className="h-3 w-3" />
            Many errors: {field.error_rate.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};

export function FormFunnelVisualization({ siteId, formId, formName }: FormFunnelVisualizationProps) {
  const { data: funnelData, isLoading } = useFormFunnelAnalysis(siteId, formId);

  const { nodes, edges } = useMemo(() => {
    if (!funnelData?.steps) return { nodes: [], edges: [] };

    const stepNodes: Node[] = funnelData.steps.map((step, index) => ({
      id: `step-${index}`,
      type: 'default',
      position: { x: 0, y: index * 200 },
      data: { 
        field: step, 
        step: step, 
        index,
        totalSteps: funnelData.steps.length 
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    // Add completion node
    const completionNode: Node = {
      id: 'completion',
      type: 'default',
      position: { x: 0, y: funnelData.steps.length * 200 },
      data: {
        isCompletion: true,
        completionRate: funnelData.overallConversionRate,
        completions: funnelData.form.total_completions,
      },
      targetPosition: Position.Top,
    };

    const allNodes = [...stepNodes, completionNode];

    const stepEdges: Edge[] = [];
    for (let i = 0; i < funnelData.steps.length; i++) {
      const step = funnelData.steps[i];
      const targetId = i === funnelData.steps.length - 1 ? 'completion' : `step-${i + 1}`;
      
      stepEdges.push({
        id: `edge-${i}`,
        source: `step-${i}`,
        target: targetId,
        type: 'smoothstep',
        animated: step.dropOffRate > 20,
        style: { 
          stroke: step.dropOffRate > 20 ? '#ef4444' : '#22c55e',
          strokeWidth: 3,
        },
        label: `${(100 - step.dropOffRate).toFixed(1)}% continue`,
        labelStyle: { 
          fontSize: 11, 
          fontWeight: 'bold',
          fill: step.dropOffRate > 20 ? '#ef4444' : '#22c55e',
        },
      });
    }

    return { nodes: allNodes, edges: stepEdges };
  }, [funnelData]);

  const [nodesState, , onNodesChange] = useNodesState(nodes);
  const [edgesState, , onEdgesChange] = useEdgesState(edges);

  if (isLoading) {
    return <div className="animate-pulse">Loading funnel analysis...</div>;
  }

  if (!funnelData || !funnelData.steps.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Form Funnel</CardTitle>
          <CardDescription>
            No data available for this form yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Custom node types
  const nodeTypes = {
    default: ({ data }: { data: any }) => {
      if (data.isCompletion) {
        return (
          <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50 min-w-[280px]">
            <div className="text-center">
              <div className="text-2xl mb-2">🎉</div>
              <h4 className="font-bold text-green-700">Form completed!</h4>
              <div className="mt-2">
                <div className="text-2xl font-bold text-green-600">
                  {data.completionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.completions} users completed the form
                </p>
              </div>
            </div>
          </div>
        );
      }
      return <FunnelStepNode data={data} />;
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total starts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData.form.total_starts.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {funnelData.form.total_completions.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData.overallConversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funnelData.form.avg_completion_time < 60 
                ? `${funnelData.form.avg_completion_time}s`
                : `${Math.floor(funnelData.form.avg_completion_time / 60)}m ${funnelData.form.avg_completion_time % 60}s`
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Form Funnel: {formName || formId}</CardTitle>
          <CardDescription>
            Visualization of user flow through the form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px', width: '100%' }}>
            <ReactFlow
              nodes={nodesState}
              edges={edgesState}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
              style={{ background: '#f8fafc' }}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Optimization suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.steps
              .filter(step => step.dropOffRate > 20 || step.error_rate > 10)
              .map((step, index) => (
                <div key={index} className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                  <h4 className="font-medium text-yellow-800">
                    {step.field_label || step.field_name}
                  </h4>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    {step.dropOffRate > 20 && (
                      <li>• High drop-off rate ({step.dropOffRate.toFixed(1)}%) — consider simplifying or moving the field</li>
                    )}
                    {step.error_rate > 10 && (
                      <li>• Many validation errors ({step.error_rate.toFixed(1)}%) — improve instructions or validation</li>
                    )}
                    {step.avg_focus_time > 30000 && (
                      <li>• Long focus time — the field may be confusing or complex</li>
                    )}
                  </ul>
                </div>
              ))}
            
            {funnelData.steps.filter(step => step.dropOffRate > 20 || step.error_rate > 10).length === 0 && (
              <div className="p-3 border-l-4 border-green-500 bg-green-50">
                <p className="text-green-700">
                  🎉 Good job! This form is performing well without major issues.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}