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
    name: 'Högvärde Mobila Användare',
    description: 'Mobila användare med hög engagement',
    icon: <Smartphone className="h-4 w-4" />,
    conditions: [
      { dimension: 'deviceCategory', operator: 'equals', value: 'mobile' },
      { dimension: 'sessionDuration', operator: 'greaterThan', value: '180' }
    ]
  },
  {
    id: 'new-desktop-users',
    name: 'Nya Desktop Användare',
    description: 'Förstagångsbesökare på desktop',
    icon: <Monitor className="h-4 w-4" />,
    conditions: [
      { dimension: 'deviceCategory', operator: 'equals', value: 'desktop' },
      { dimension: 'newVsReturning', operator: 'equals', value: 'new' }
    ]
  },
  {
    id: 'organic-converters',
    name: 'Organiska Konverterare',
    description: 'Användare från organisk sökning som konverterat',
    icon: <Globe className="h-4 w-4" />,
    conditions: [
      { dimension: 'source', operator: 'equals', value: 'google' },
      { dimension: 'medium', operator: 'equals', value: 'organic' },
      { dimension: 'conversions', operator: 'greaterThan', value: '0' }
    ]
  },
  {
    id: 'repeat-purchasers',
    name: 'Återkommande Köpare',
    description: 'Kunder som handlat flera gånger',
    icon: <ShoppingCart className="h-4 w-4" />,
    conditions: [
      { dimension: 'newVsReturning', operator: 'equals', value: 'returning' },
      { dimension: 'ecommercePurchases', operator: 'greaterThan', value: '1' }
    ]
  },
  {
    id: 'long-session-users',
    name: 'Långsessionsanvändare',
    description: 'Användare med långa sessioner',
    icon: <Clock className="h-4 w-4" />,
    conditions: [
      { dimension: 'sessionDuration', operator: 'greaterThan', value: '300' }
    ]
  },
  {
    id: 'stockholm-users',
    name: 'Stockholm Användare',
    description: 'Besökare från Stockholm',
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
          <DialogTitle>Skapa Anpassat Segment</DialogTitle>
          <DialogDescription>
            Välj färdiga segment eller skapa egna villkor för att analysera specifika användargrupper
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
              Fördefinierade Segment
            </Button>
            <Button
              variant={activeTab === 'custom' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('custom')}
            >
              Anpassade Villkor
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
                  <h4 className="font-medium mb-2">Valda segment ({selectedPredefined.length})</h4>
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
                <Label htmlFor="segment-name">Segmentnamn</Label>
                <Input
                  id="segment-name"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="t.ex. Högengagerade mobila användare"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Villkor</h4>
                {customConditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <select
                      value={condition.dimension}
                      onChange={(e) => updateCustomCondition(index, 'dimension', e.target.value)}
                      className="flex-1 p-2 border rounded"
                    >
                      <option value="">Välj dimension</option>
                      <option value="deviceCategory">Enhetstyp</option>
                      <option value="source">Trafikkälla</option>
                      <option value="medium">Medium</option>
                      <option value="country">Land</option>
                      <option value="city">Stad</option>
                      <option value="newVsReturning">Ny vs Återkommande</option>
                      <option value="sessionDuration">Sessionsvaraktighet</option>
                      <option value="conversions">Konverteringar</option>
                    </select>

                    <select
                      value={condition.operator}
                      onChange={(e) => updateCustomCondition(index, 'operator', e.target.value)}
                      className="p-2 border rounded"
                    >
                      <option value="equals">Lika med</option>
                      <option value="contains">Innehåller</option>
                      <option value="greaterThan">Större än</option>
                      <option value="lessThan">Mindre än</option>
                    </select>

                    <Input
                      value={condition.value}
                      onChange={(e) => updateCustomCondition(index, 'value', e.target.value)}
                      placeholder="Värde"
                      className="flex-1"
                    />

                    {customConditions.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomCondition(index)}
                      >
                        Ta bort
                      </Button>
                    )}
                  </div>
                ))}

                <Button variant="outline" onClick={addCustomCondition} className="w-full">
                  + Lägg till villkor
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={
                activeTab === 'predefined' 
                  ? selectedPredefined.length === 0
                  : !segmentName || customConditions.every(c => !c.dimension || !c.value)
              }
            >
              Skapa Segment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}