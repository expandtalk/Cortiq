import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Activity, 
  Globe, 
  Server,
  Eye,
  Clock
} from 'lucide-react';
import { 
  useAgentRegistry, 
  useCreateAgent, 
  useDeleteAgent, 
  useUpdateAgent,
  type RegisteredAgent 
} from '@/hooks/useAgentRegistry';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface AgentRegistryProps {
  siteId: string;
}

const AGENT_TYPE_CONFIG = {
  custom_bot: {
    label: 'Custom Bot Pattern',
    description: 'Spåra inkommande AI-botar med user-agent mönster',
    icon: Bot,
    color: 'bg-blue-500/10 text-blue-500',
  },
  outbound_agent: {
    label: 'Utgående Agent',
    description: 'Övervaka era egna AI-agenter',
    icon: Server,
    color: 'bg-green-500/10 text-green-500',
  },
  third_party: {
    label: 'Tredjepartsintegration',
    description: 'Spåra externa AI-tjänster ni använder',
    icon: Globe,
    color: 'bg-purple-500/10 text-purple-500',
  },
};

const PRESET_PATTERNS = [
  { name: 'Microsoft Copilot', pattern: 'Copilot|BingBot|BingPreview' },
  { name: 'Google AI Studio', pattern: 'GoogleOther|Googlebot' },
  { name: 'ChatGPT', pattern: 'ChatGPT|GPTBot|OpenAI' },
  { name: 'Claude', pattern: 'ClaudeBot|Anthropic' },
  { name: 'Perplexity', pattern: 'PerplexityBot|Perplexity' },
  { name: 'Custom', pattern: '' },
];

export function AgentRegistry({ siteId }: AgentRegistryProps) {
  const { data: agents, isLoading } = useAgentRegistry(siteId);
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();
  const updateAgent = useUpdateAgent();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    agent_name: string;
    agent_type: 'custom_bot' | 'outbound_agent' | 'third_party';
    description: string;
    user_agent_pattern: string;
    endpoint_url: string;
  }>({
    agent_name: '',
    agent_type: 'custom_bot',
    description: '',
    user_agent_pattern: '',
    endpoint_url: '',
  });
  const [selectedPreset, setSelectedPreset] = useState('');

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = PRESET_PATTERNS.find(p => p.name === presetName);
    if (preset) {
      setFormData(prev => ({
        ...prev,
        agent_name: presetName === 'Custom' ? prev.agent_name : presetName,
        user_agent_pattern: preset.pattern,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createAgent.mutateAsync({
      site_id: siteId,
      agent_name: formData.agent_name,
      agent_type: formData.agent_type,
      description: formData.description || undefined,
      user_agent_pattern: formData.user_agent_pattern || undefined,
      endpoint_url: formData.endpoint_url || undefined,
    });
    
    setIsDialogOpen(false);
    setFormData({
      agent_name: '',
      agent_type: 'custom_bot',
      description: '',
      user_agent_pattern: '',
      endpoint_url: '',
    });
    setSelectedPreset('');
  };

  const handleToggleActive = async (agent: RegisteredAgent) => {
    await updateAgent.mutateAsync({
      id: agent.id,
      is_active: !agent.is_active,
    });
  };

  const handleDelete = async (agent: RegisteredAgent) => {
    if (confirm(`Är du säker på att du vill ta bort "${agent.agent_name}"?`)) {
      await deleteAgent.mutateAsync({ id: agent.id, siteId });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agent Registry</h3>
          <p className="text-sm text-muted-foreground">
            Registrera och övervaka AI-agenter som besöker eller integrerar med er sajt
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Lägg till agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrera ny agent</DialogTitle>
              <DialogDescription>
                Lägg till en AI-agent för spårning och övervakning
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Agenttyp</Label>
                <Select
                  value={formData.agent_type}
                  onValueChange={(value: 'custom_bot' | 'outbound_agent' | 'third_party') => 
                    setFormData(prev => ({ ...prev, agent_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AGENT_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.agent_type === 'custom_bot' && (
                <div className="space-y-2">
                  <Label>Snabbval</Label>
                  <Select value={selectedPreset} onValueChange={handlePresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj fördefinierad bot..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_PATTERNS.map(preset => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="agent_name">Agentnamn</Label>
                <Input
                  id="agent_name"
                  value={formData.agent_name}
                  onChange={e => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
                  placeholder="t.ex. Microsoft Copilot"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivning (valfritt)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="t.ex. Spårar Copilot-besök för SEO-analys"
                />
              </div>

              {formData.agent_type === 'custom_bot' && (
                <div className="space-y-2">
                  <Label htmlFor="user_agent_pattern">User-Agent mönster (regex)</Label>
                  <Input
                    id="user_agent_pattern"
                    value={formData.user_agent_pattern}
                    onChange={e => setFormData(prev => ({ ...prev, user_agent_pattern: e.target.value }))}
                    placeholder="t.ex. Copilot|BingBot"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Använd | för att matcha flera mönster
                  </p>
                </div>
              )}

              {(formData.agent_type === 'outbound_agent' || formData.agent_type === 'third_party') && (
                <div className="space-y-2">
                  <Label htmlFor="endpoint_url">Endpoint URL</Label>
                  <Input
                    id="endpoint_url"
                    type="url"
                    value={formData.endpoint_url}
                    onChange={e => setFormData(prev => ({ ...prev, endpoint_url: e.target.value }))}
                    placeholder="https://api.example.com/agent"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={createAgent.isPending}>
                  {createAgent.isPending ? 'Sparar...' : 'Registrera'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {agents?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-1">Inga agenter registrerade</h4>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Registrera AI-agenter för att spåra Copilot, Google AI Studio, egna agenter och mer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {agents?.map(agent => {
            const config = AGENT_TYPE_CONFIG[agent.agent_type];
            const Icon = config.icon;
            
            return (
              <Card key={agent.id} className={!agent.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{agent.agent_name}</CardTitle>
                        <CardDescription>{config.label}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={agent.is_active}
                        onCheckedChange={() => handleToggleActive(agent)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(agent)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {agent.description && (
                    <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    {agent.user_agent_pattern && (
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {agent.user_agent_pattern}
                        </code>
                      </div>
                    )}
                    
                    {agent.endpoint_url && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {agent.endpoint_url}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>{agent.total_requests} förfrågningar</span>
                    </div>
                    
                    {agent.last_seen_at && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Senast sedd {formatDistanceToNow(new Date(agent.last_seen_at), { 
                            addSuffix: true, 
                            locale: sv 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
