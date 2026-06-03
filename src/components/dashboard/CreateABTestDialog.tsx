import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useABTesting } from '@/hooks/useABTesting';
import { useToast } from '@/hooks/use-toast';

interface CreateABTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
}

export function CreateABTestDialog({ open, onOpenChange, siteId }: CreateABTestDialogProps) {
  const { createTest, loadTests } = useABTesting(siteId);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    test_name: '',
    test_description: '',
    test_type: 'page' as 'page' | 'element' | 'flow',
    conversion_goal: '',
    conversion_metric: 'conversion_rate',
    baseline_value: '',
    target_lift: '',
    confidence_level: 95,
    traffic_split: [50, 50]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createTest({
        test_name: formData.test_name,
        test_description: formData.test_description,
        test_type: formData.test_type,
        conversion_goal: formData.conversion_goal,
        conversion_metric: formData.conversion_metric,
        baseline_value: formData.baseline_value ? parseFloat(formData.baseline_value) : undefined,
        target_lift: formData.target_lift ? parseFloat(formData.target_lift) : undefined,
        confidence_level: formData.confidence_level,
        traffic_allocation: {
          variant_a: formData.traffic_split[0],
          variant_b: formData.traffic_split[1]
        }
      });

      if (result) {
        toast({
          title: 'A/B Test Created',
          description: `Test "${formData.test_name}" has been created successfully.`,
        });
        
        // Reset form
        setFormData({
          test_name: '',
          test_description: '',
          test_type: 'page',
          conversion_goal: '',
          conversion_metric: 'conversion_rate',
          baseline_value: '',
          target_lift: '',
          confidence_level: 95,
          traffic_split: [50, 50]
        });
        
        onOpenChange(false);
        await loadTests();
      } else {
        throw new Error('Failed to create test');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create A/B test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrafficSplitChange = (values: number[]) => {
    const [controlPercent] = values;
    const variantPercent = 100 - controlPercent;
    setFormData(prev => ({
      ...prev,
      traffic_split: [controlPercent, variantPercent]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New A/B Test</DialogTitle>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> The A/B test requires the tracking script to be installed on your website.
              Go to the Setup tab for installation instructions.
            </p>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="test_name">Test Name *</Label>
              <Input
                id="test_name"
                value={formData.test_name}
                onChange={(e) => setFormData(prev => ({ ...prev, test_name: e.target.value }))}
                placeholder="e.g., Homepage Hero Button Test"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="test_description">Description</Label>
              <Textarea
                id="test_description"
                value={formData.test_description}
                onChange={(e) => setFormData(prev => ({ ...prev, test_description: e.target.value }))}
                placeholder="What are you testing and why?"
                rows={3}
              />
            </div>
          </div>

          {/* Test Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Test Type</Label>
              <Select
                value={formData.test_type}
                onValueChange={(value: 'page' | 'element' | 'flow') => 
                  setFormData(prev => ({ ...prev, test_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Page Test</SelectItem>
                  <SelectItem value="element">Element Test</SelectItem>
                  <SelectItem value="flow">Flow Test</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Conversion Metric</Label>
              <Select
                value={formData.conversion_metric}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, conversion_metric: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                  <SelectItem value="click_through_rate">Click-through Rate</SelectItem>
                  <SelectItem value="form_completion">Form Completion</SelectItem>
                  <SelectItem value="revenue_per_session">Revenue per Session</SelectItem>
                  <SelectItem value="page_views">Page Views</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Goals */}
          <div>
            <Label htmlFor="conversion_goal">Conversion Goal *</Label>
            <Input
              id="conversion_goal"
              value={formData.conversion_goal}
              onChange={(e) => setFormData(prev => ({ ...prev, conversion_goal: e.target.value }))}
              placeholder="e.g., Increase signup button clicks"
              required
            />
          </div>

          {/* Statistical Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="baseline_value">Current Rate (%)</Label>
              <Input
                id="baseline_value"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.baseline_value}
                onChange={(e) => setFormData(prev => ({ ...prev, baseline_value: e.target.value }))}
                placeholder="2.5"
              />
            </div>
            
            <div>
              <Label htmlFor="target_lift">Target Lift (%)</Label>
              <Input
                id="target_lift"
                type="number"
                step="0.1"
                min="0"
                value={formData.target_lift}
                onChange={(e) => setFormData(prev => ({ ...prev, target_lift: e.target.value }))}
                placeholder="20"
              />
            </div>
            
            <div>
              <Label htmlFor="confidence_level">Confidence Level</Label>
              <Select
                value={formData.confidence_level.toString()}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, confidence_level: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
                  <SelectItem value="99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Traffic Split */}
          <div>
            <Label>Traffic Split</Label>
            <div className="space-y-3 mt-2">
              <div className="flex justify-between text-sm">
                <span>Control: {formData.traffic_split[0]}%</span>
                <span>Variant: {formData.traffic_split[1]}%</span>
              </div>
              <Slider
                value={[formData.traffic_split[0]]}
                onValueChange={handleTrafficSplitChange}
                max={90}
                min={10}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Test'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}