import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Target, FormInput, Phone, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Site } from '@/types/dashboard';

interface ConversionGoal {
  id: string;
  name: string;
  type: 'form_submission' | 'element_click' | 'page_visit' | 'phone_click';
  selector: string;
  value?: number;
}

interface ConversionGoalsConfigProps {
  selectedSite: Site;
  onUpdate?: () => void;
}

export function ConversionGoalsConfig({ selectedSite, onUpdate }: ConversionGoalsConfigProps) {
  const [goals, setGoals] = useState<ConversionGoal[]>([]);
  const [newGoal, setNewGoal] = useState<Partial<ConversionGoal>>({
    type: 'form_submission'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedSite) {
      loadGoals();
    }
  }, [selectedSite]);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('conversion_goals')
        .eq('id', selectedSite.id)
        .single();

      if (error) throw error;
      
      const goals = (data.conversion_goals as unknown as ConversionGoal[]) || [];
      setGoals(goals);
    } catch (error) {
      console.error('Error loading conversion goals:', error);
    }
  };

  const saveGoals = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sites')
        .update({ conversion_goals: goals as any })
        .eq('id', selectedSite.id);

      if (error) throw error;

      toast({
        title: "✅ Konverteringsmål sparade",
        description: "Dina konverteringsmål har uppdaterats"
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error saving conversion goals:', error);
      toast({
        title: "❌ Fel",
        description: "Kunde inte spara konverteringsmål",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addGoal = () => {
    if (!newGoal.name || !newGoal.selector) {
      toast({
        title: "⚠️ Ofullständig information",
        description: "Ange namn och CSS-selektor",
        variant: "destructive"
      });
      return;
    }

    const goal: ConversionGoal = {
      id: `goal_${Date.now()}`,
      name: newGoal.name!,
      type: newGoal.type!,
      selector: newGoal.selector!,
      value: newGoal.value || 0
    };

    setGoals([...goals, goal]);
    setNewGoal({ type: 'form_submission' });
  };

  const removeGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'form_submission': return <FormInput className="h-4 w-4" />;
      case 'phone_click': return <Phone className="h-4 w-4" />;
      case 'page_visit': return <Eye className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'form_submission': return 'Formulärskickning';
      case 'element_click': return 'Elementklick';
      case 'phone_click': return 'Telefonklick';
      case 'page_visit': return 'Sidbesök';
      default: return type;
    }
  };

  const predefinedGoals = [
    {
      name: 'Kontaktformulär',
      type: 'form_submission' as const,
      selector: 'form[name="contact"], #contact-form, .contact-form',
      value: 50
    },
    {
      name: 'Telefonklick',
      type: 'phone_click' as const,
      selector: 'a[href^="tel:"], .phone-link, .call-button',
      value: 25
    },
    {
      name: 'Offertförfrågan',
      type: 'form_submission' as const,
      selector: 'form[name="quote"], #quote-form, .quote-form',
      value: 100
    },
    {
      name: 'Newsletter-registrering',
      type: 'form_submission' as const,
      selector: 'form[name="newsletter"], #newsletter, .newsletter-signup',
      value: 15
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-500" />
          Konverteringsmål
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Definiera viktiga åtgärder som användare kan ta på din webbplats
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Befintliga mål */}
        <div className="space-y-3">
          <h4 className="font-medium">Aktiva konverteringsmål ({goals.length})</h4>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Inga konverteringsmål konfigurerade än. Lägg till nedan.
            </p>
          ) : (
            <div className="space-y-2">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getGoalIcon(goal.type)}
                    <div>
                      <div className="font-medium">{goal.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getGoalTypeLabel(goal.type)} • {goal.selector}
                      </div>
                    </div>
                    <Badge variant="outline">{goal.value || 0} poäng</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Snabbmål */}
        <div className="space-y-3">
          <h4 className="font-medium">Snabba mallar</h4>
          <div className="grid gap-2">
            {predefinedGoals.map((goal, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  const newGoal: ConversionGoal = {
                    ...goal,
                    id: `goal_${Date.now()}_${index}`
                  };
                  setGoals([...goals, newGoal]);
                }}
                className="justify-start"
              >
                {getGoalIcon(goal.type)}
                {goal.name} ({goal.value} poäng)
              </Button>
            ))}
          </div>
        </div>

        {/* Lägg till nytt mål */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium">Lägg till nytt mål</h4>
          
          <div className="grid gap-4">
            <div>
              <Label htmlFor="goal-name">Målnamn</Label>
              <Input
                id="goal-name"
                placeholder="t.ex. Kontaktformulär"
                value={newGoal.name || ''}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="goal-type">Typ</Label>
              <Select
                value={newGoal.type}
                onValueChange={(value: any) => setNewGoal({ ...newGoal, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="form_submission">Formulärskickning</SelectItem>
                  <SelectItem value="element_click">Elementklick</SelectItem>
                  <SelectItem value="phone_click">Telefonklick</SelectItem>
                  <SelectItem value="page_visit">Sidbesök</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="goal-selector">CSS-selektor</Label>
              <Input
                id="goal-selector"
                placeholder="t.ex. #contact-form, .contact-button"
                value={newGoal.selector || ''}
                onChange={(e) => setNewGoal({ ...newGoal, selector: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                CSS-selektor som identifierar elementet på din webbplats
              </p>
            </div>

            <div>
              <Label htmlFor="goal-value">Poängvärde (valfritt)</Label>
              <Input
                id="goal-value"
                type="number"
                placeholder="0"
                value={newGoal.value || ''}
                onChange={(e) => setNewGoal({ ...newGoal, value: parseInt(e.target.value) || 0 })}
              />
            </div>

            <Button onClick={addGoal} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Lägg till mål
            </Button>
          </div>
        </div>

        {/* Spara ändringar */}
        <Button 
          onClick={saveGoals} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sparar...' : 'Spara konverteringsmål'}
        </Button>
      </CardContent>
    </Card>
  );
}