import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useABTesting } from '@/hooks/useABTesting';
import { useABStatistics } from '@/hooks/useABStatistics';
import { CreateABTestDialog } from './CreateABTestDialog';
import { ABTestResultsDialog } from './ABTestResultsDialog';
import { 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Users,
  Target,
  BarChart3
} from 'lucide-react';

interface ABTestingOverviewProps {
  siteId: string;
}

export function ABTestingOverview({ siteId }: ABTestingOverviewProps) {
  const { tests, isLoading, updateTestStatus } = useABTesting(siteId);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  const activeTests = tests.filter(test => test.test_status === 'running');
  const completedTests = tests.filter(test => test.test_status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'paused': return 'bg-warning text-warning-foreground';
      case 'draft': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <Square className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{tests.length}</p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold">{activeTests.length}</p>
                <p className="text-sm text-muted-foreground">Active Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Square className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{completedTests.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold">
                  {completedTests.length > 0 ? '12%' : '--'}
                </p>
                <p className="text-sm text-muted-foreground">Avg. Lift</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Test Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">A/B Tests</h2>
          <p className="text-muted-foreground">Optimize your conversion rates with data-driven testing</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Target className="h-4 w-4 mr-2" />
          Create New Test
        </Button>
      </div>

      {/* Tests List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-secondary rounded animate-pulse" />
              <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
              <div className="h-4 bg-secondary rounded animate-pulse w-1/2" />
            </div>
          </CardContent>
        </Card>
      ) : tests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No A/B Tests Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start optimizing your conversion rates by creating your first A/B test
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Your First Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.test_status)}
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(test.test_status)}
                      >
                        {test.test_status}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{test.test_name}</CardTitle>
                      <CardDescription>
                        Goal: {test.conversion_goal} • Type: {test.test_type}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {test.test_status === 'running' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateTestStatus(test.id, 'paused')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    
                    {test.test_status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateTestStatus(test.id, 'running')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    
                    {test.test_status === 'draft' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateTestStatus(test.id, 'running')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Test
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTest(test.id);
                        setShowResultsDialog(true);
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Results
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {test.variants.find(v => v.is_control)?.traffic_percentage || 50}%
                    </div>
                    <div className="text-sm text-muted-foreground">Control</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {test.variants.find(v => !v.is_control)?.traffic_percentage || 50}%
                    </div>
                    <div className="text-sm text-muted-foreground">Variant</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {test.confidence_level}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {test.target_lift ? `${test.target_lift}%` : '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Target Lift</div>
                  </div>
                </div>

                {test.test_status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Test Progress</span>
                      <span>65% Complete</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateABTestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        siteId={siteId}
      />

      <ABTestResultsDialog
        open={showResultsDialog}
        onOpenChange={setShowResultsDialog}
        testId={selectedTest}
      />
    </div>
  );
}