import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Monitor, 
  Smartphone, 
  Globe, 
  Target, 
  TrendingUp, 
  ShoppingCart,
  Clock,
  MapPin
} from 'lucide-react';

interface CustomSegmentCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSegment: (segment: any) => void;
}

interface SegmentCondition {
  dimension: string;
  operator: string;
  value: string;
}

const PREDEFINED_SEGMENTS = [
  {
    id: 'high-value-mobile',
    name: 'High-Value Mobile Users',
    description: 'Mobile users with high engagement',
    icon: <Smartphone className="h-4 w-4" />,
    conditions: [
      { dimension: 'deviceCategory', operator: 'equals', value: 'mobile' },
      { dimension: 'sessionDuration', operator: 'greaterThan', value: '180' }
    ]
  },
  {
    id: 'new-desktop-users',
    name: 'New Desktop Users',
    description: 'First-time visitors on desktop',
    icon: <Monitor className="h-4 w-4" />,
    conditions: [
      { dimension: 'deviceCategory', operator: 'equals', value: 'desktop' },
      { dimension: 'newVsReturning', operator: 'equals', value: 'new' }
    ]
  },
  {
    id: 'organic-converters',
    name: 'Organic Converters',
    description: 'Users from organic search who converted',
    icon: <Globe className="h-4 w-4" />,
    conditions: [
      { dimension: 'source', operator: 'equals', value: 'google' },
      { dimension: 'medium', operator: 'equals', value: 'organic' },
      { dimension: 'conversions', operator: 'greaterThan', value: '0' }
    ]
  },
  {
    id: 'repeat-purchasers',
    name: 'Repeat Purchasers',
    description: 'Customers who have purchased multiple times',
    icon: <ShoppingCart className="h-4 w-4" />,
    conditions: [
      { dimension: 'newVsReturning', operator: 'equals', value: 'returning' },
      { dimension: 'ecommercePurchases', operator: 'greaterThan', value: '1' }
    ]
  },
  {
    id: 'long-session-users',
    name: 'Long-Session Users',
    description: 'Users with long sessions',
    icon: <Clock className="h-4 w-4" />,
    conditions: [
      { dimension: 'sessionDuration', operator: 'greaterThan', value: '300' }
    ]
  },
  {
    id: 'stockholm-users',
    name: 'Stockholm Users',
    description: 'Visitors from Stockholm',
    icon: <MapPin className="h-4 w-4" />,
    conditions: [
      { dimension: 'city', operator: 'equals', value: 'Stockholm' }
    ]
  }
];

export function CustomSegmentCreator({ open, onOpenChange, onCreateSegment }: CustomSegmentCreatorProps) {
  const [segmentName, setSegmentName] = useState('');
  const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]);
  const [customConditions, setCustomConditions] = useState<SegmentCondition[]>([
    { dimension: '', operator: 'equals', value: '' }
  ]);
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');

  const handlePredefinedToggle = (segmentId: string) => {
    setSelectedPredefined(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const addCustomCondition = () => {
    setCustomConditions([...customConditions, { dimension: '', operator: 'equals', value: '' }]);
  };

  const updateCustomCondition = (index: number, field: keyof SegmentCondition, value: string) => {
    const updated = [...customConditions];
    updated[index] = { ...updated[index], [field]: value };
    setCustomConditions(updated);
  };

  const removeCustomCondition = (index: number) => {
    setCustomConditions(customConditions.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (activeTab === 'predefined') {
      selectedPredefined.forEach(segmentId => {
        const predefined = PREDEFINED_SEGMENTS.find(s => s.id === segmentId);
        if (predefined) {
          onCreateSegment({
            id: predefined.id,
            name: predefined.name,
            type: 'predefined',
            conditions: predefined.conditions,
            status: 'active'
          });
        }
      });
    } else {
      onCreateSegment({
        id: `custom-${Date.now()}`,
        name: segmentName,
        type: 'custom',
        conditions: customConditions.filter(c => c.dimension && c.value),
        status: 'active'
      });
    }
    
    // Reset form
    setSegmentName('');
    setSelectedPredefined([]);
    setCustomConditions([{ dimension: '', operator: 'equals', value: '' }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Segment</DialogTitle>
          <DialogDescription>
            Choose predefined segments or create custom conditions to analyze specific user groups
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'predefined' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('predefined')}
            >
              Predefined Segments
            </Button>
            <Button
              variant={activeTab === 'custom' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('custom')}
            >
              Custom Conditions
            </Button>
          </div>

          {/* Predefined Segments */}
          {activeTab === 'predefined' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PREDEFINED_SEGMENTS.map((segment) => (
                  <Card 
                    key={segment.id} 
                    className={`cursor-pointer transition-all ${
                      selectedPredefined.includes(segment.id) 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handlePredefinedToggle(segment.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {segment.icon}
                          <CardTitle className="text-sm">{segment.name}</CardTitle>
                        </div>
                        <Checkbox 
                          checked={selectedPredefined.includes(segment.id)}
                          onChange={() => handlePredefinedToggle(segment.id)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-2">
                        {segment.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {segment.conditions.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {condition.dimension} {condition.operator} {condition.value}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedPredefined.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Selected segments ({selectedPredefined.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPredefined.map(id => {
                      const segment = PREDEFINED_SEGMENTS.find(s => s.id === id);
                      return segment ? (
                        <Badge key={id} className="bg-primary text-primary-foreground">
                          {segment.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Segment Builder */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="segment-name">Segment name</Label>
                <Input
                  id="segment-name"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g. Highly engaged mobile users"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Conditions</h4>
                {customConditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <select
                      value={condition.dimension}
                      onChange={(e) => updateCustomCondition(index, 'dimension', e.target.value)}
                      className="flex-1 p-2 border rounded"
                    >
                      <option value="">Select dimension</option>
                      <option value="deviceCategory">Device type</option>
                      <option value="source">Traffic source</option>
                      <option value="medium">Medium</option>
                      <option value="country">Country</option>
                      <option value="city">City</option>
                      <option value="newVsReturning">New vs Returning</option>
                      <option value="sessionDuration">Session duration</option>
                      <option value="conversions">Conversions</option>
                    </select>

                    <select
                      value={condition.operator}
                      onChange={(e) => updateCustomCondition(index, 'operator', e.target.value)}
                      className="p-2 border rounded"
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greaterThan">Greater than</option>
                      <option value="lessThan">Less than</option>
                    </select>

                    <Input
                      value={condition.value}
                      onChange={(e) => updateCustomCondition(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                    />

                    {customConditions.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomCondition(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}

                <Button variant="outline" onClick={addCustomCondition} className="w-full">
                  + Add condition
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                activeTab === 'predefined'
                  ? selectedPredefined.length === 0
                  : !segmentName || customConditions.every(c => !c.dimension || !c.value)
              }
            >
              Create Segment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}