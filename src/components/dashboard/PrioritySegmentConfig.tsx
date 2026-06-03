import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, TrendingUp, Users, Target, Globe, Smartphone, Monitor } from 'lucide-react';

interface Segment {
  id: string;
  name: string;
  description: string;
  value: number;
  growth: number;
  icon: React.ReactNode;
  definition: string;
  priority?: number;
}

interface PrioritySegmentConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (segments: Segment[]) => void;
}

export function PrioritySegmentConfig({ open, onOpenChange, onSave }: PrioritySegmentConfigProps) {
  const [selectedSegments, setSelectedSegments] = useState<string[]>(['new-customers', 'returning-customers', 'premium-customers']);

  const availableSegments: Segment[] = [
    {
      id: 'new-customers',
      name: 'New customers',
      description: 'Users visiting the website for the first time',
      definition: 'Defined as sessions where the user has no previous visits recorded in the system. Identified by checking whether session_id does not exist in previous tracking_sessions.',
      value: 245000,
      growth: 12.5,
      icon: <Users className="h-5 w-5 text-blue-500" />
    },
    {
      id: 'returning-customers',
      name: 'Returning customers',
      description: 'Users who have visited the website before',
      definition: 'Defined as sessions where the user has at least one previous visit recorded. Identified by matching the user IP or browser fingerprint against previous tracking_sessions.',
      value: 380000,
      growth: 8.2,
      icon: <Target className="h-5 w-5 text-green-500" />
    },
    {
      id: 'premium-customers',
      name: 'Premium customers',
      description: 'High-value users based on behavior',
      definition: 'Defined as users with high engagement: >5 page views per session, >3 minutes session time, or users who have performed conversions. Calculated from page_views and conversion_events.',
      value: 125000,
      growth: 22.1,
      icon: <TrendingUp className="h-5 w-5 text-purple-500" />
    },
    {
      id: 'mobile-users',
      name: 'Mobile users',
      description: 'Users visiting via mobile devices',
      definition: 'Defined as sessions where device_type = "mobile" in the tracking_sessions table.',
      value: 195000,
      growth: 15.8,
      icon: <Smartphone className="h-5 w-5 text-orange-500" />
    },
    {
      id: 'desktop-users',
      name: 'Desktop users',
      description: 'Users visiting via desktop',
      definition: 'Defined as sessions where device_type = "desktop" in the tracking_sessions table.',
      value: 285000,
      growth: 5.4,
      icon: <Monitor className="h-5 w-5 text-gray-500" />
    },
    {
      id: 'organic-traffic',
      name: 'Organic traffic',
      description: 'Users from search engines',
      definition: 'Defined as sessions where referrer contains google.com, bing.com, or other search engines, or where referrer is empty (direct traffic).',
      value: 220000,
      growth: 9.7,
      icon: <Globe className="h-5 w-5 text-emerald-500" />
    }
  ];

  const handleSegmentToggle = (segmentId: string) => {
    setSelectedSegments(prev => {
      if (prev.includes(segmentId)) {
        return prev.filter(id => id !== segmentId);
      } else if (prev.length < 3) {
        return [...prev, segmentId];
      }
      return prev;
    });
  };

  const handleSave = () => {
    const prioritySegments = availableSegments
      .filter(segment => selectedSegments.includes(segment.id))
      .map((segment, index) => ({ ...segment, priority: index + 1 }));
    
    onSave(prioritySegments);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Priority Segments
          </DialogTitle>
          <DialogDescription>
            Select up to 3 segments most important to your analysis. These will be prioritized in reports and insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Available Segments</h3>
              <Badge variant="outline">
                {selectedSegments.length}/3 selected
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableSegments.map((segment) => (
                <Card 
                  key={segment.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSegments.includes(segment.id) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:ring-1 hover:ring-muted'
                  }`}
                  onClick={() => handleSegmentToggle(segment.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedSegments.includes(segment.id)}
                        disabled={!selectedSegments.includes(segment.id) && selectedSegments.length >= 3}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {segment.icon}
                          <h4 className="font-medium">{segment.name}</h4>
                          {selectedSegments.includes(segment.id) && (
                            <Badge variant="default" className="text-xs">
                              Priority #{selectedSegments.indexOf(segment.id) + 1}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {segment.description}
                        </p>
                        <div className="mb-3">
                          <div className="text-lg font-bold">
                            {segment.value.toLocaleString()} kr
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <TrendingUp className="h-3 w-3 text-success" />
                            <span className="text-success font-medium">+{segment.growth}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          <strong>Definition:</strong> {segment.definition}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              The selected segments will be prioritized in all analyses and reports
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={selectedSegments.length === 0}>
                Save configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}