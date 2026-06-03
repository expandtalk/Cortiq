import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, Calendar, MousePointer, Hand, Move } from 'lucide-react';
import type { HeatmapFilters } from '@/hooks/useHeatmapData';

interface HeatmapFiltersProps {
  filters: HeatmapFilters;
  onFiltersChange: (filters: HeatmapFilters) => void;
  onApplyFilters: () => void;
  loading?: boolean;
}

export function HeatmapFilters({ 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  loading 
}: HeatmapFiltersProps) {
  const deviceIcons = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
    all: Monitor
  };

  const interactionIcons = {
    click: MousePointer,
    scroll: Move,
    mousemove: Hand,
    all: MousePointer
  };

  const deviceOptions = [
    { value: 'all', label: 'All devices', icon: Monitor },
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'mobile', label: 'Mobile', icon: Smartphone },
    { value: 'tablet', label: 'Tablet', icon: Tablet },
  ];

  const dayOptions = [
    { value: 365, label: 'Last year' },
    { value: 30, label: 'Last month' },
    { value: 7, label: 'Last week' },
  ];

  const interactionOptions = [
    { value: 'all', label: 'All interactions', icon: MousePointer },
    { value: 'click', label: 'Clicks', icon: MousePointer },
    { value: 'scroll', label: 'Scroll', icon: Move },
    { value: 'mousemove', label: 'Mouse movement', icon: Hand },
  ];

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium">Filter</h3>
        <div className="flex gap-1">
          {filters.deviceType !== 'all' && (
            <Badge variant="secondary">
              {deviceOptions.find(d => d.value === filters.deviceType)?.label}
            </Badge>
          )}
          {filters.days !== 365 && (
            <Badge variant="secondary">
              {dayOptions.find(d => d.value === filters.days)?.label}
            </Badge>
          )}
          {filters.interactionType !== 'click' && (
            <Badge variant="secondary">
              {interactionOptions.find(i => i.value === filters.interactionType)?.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Device Type Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Device type</label>
          <Select 
            value={filters.deviceType || 'all'} 
            onValueChange={(value) => onFiltersChange({ ...filters, deviceType: value as any })}
          >
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  {React.createElement(deviceIcons[filters.deviceType || 'all'], { className: "h-4 w-4" })}
                  <span>{deviceOptions.find(d => d.value === filters.deviceType)?.label || 'All devices'}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {deviceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Period Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Time period</label>
          <Select 
            value={String(filters.days || 365)} 
            onValueChange={(value) => onFiltersChange({ ...filters, days: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{dayOptions.find(d => d.value === filters.days)?.label || 'All available data'}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Interaction Type Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Interaction type</label>
          <Select 
            value={filters.interactionType || 'click'} 
            onValueChange={(value) => onFiltersChange({ ...filters, interactionType: value as any })}
          >
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  {React.createElement(interactionIcons[filters.interactionType || 'click'], { className: "h-4 w-4" })}
                  <span>{interactionOptions.find(i => i.value === filters.interactionType)?.label || 'Clicks'}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {interactionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={onApplyFilters} 
          disabled={loading}
          size="sm"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
              Updating...
            </>
          ) : (
            'Apply filters'
          )}
        </Button>
      </div>
    </div>
  );
}