import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, Shield } from "lucide-react";
import { useAgentMacros, AgentMacro } from "@/hooks/useAgentMacros";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AgentMacroManagerProps {
  siteId: string | null;
}

const BROWSER_PROFILE_TEMPLATES = {
  "ChatGPT Browser": {
    userAgentPattern: "ChatGPT",
    capabilities: ["web_search", "link_following", "form_interaction"],
    trustLevel: "high"
  },
  "Perplexity Comet": {
    userAgentPattern: "Perplexity",
    capabilities: ["web_search", "content_extraction"],
    trustLevel: "high"
  },
  "Claude Browser": {
    userAgentPattern: "Claude",
    capabilities: ["web_search", "content_analysis"],
    trustLevel: "high"
  },
  "Generic Agent": {
    userAgentPattern: "custom",
    capabilities: ["basic_tracking"],
    trustLevel: "medium"
  }
};

export const AgentMacroManager = ({ siteId }: AgentMacroManagerProps) => {
  const { macros, isLoading, createMacro, updateMacro, deleteMacro, toggleMacro } = useAgentMacros(siteId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMacro, setEditingMacro] = useState<AgentMacro | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    macro_type: 'browser_profile' | 'detection_rule' | 'tracking_config';
    config: Record<string, any>;
  }>({
    name: "",
    description: "",
    macro_type: "browser_profile",
    config: {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) return;

    if (editingMacro) {
      updateMacro({
        id: editingMacro.id,
        ...formData,
      });
    } else {
      createMacro({
        site_id: siteId,
        ...formData,
        is_active: true,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      macro_type: "browser_profile",
      config: {},
    });
    setEditingMacro(null);
  };

  const handleEdit = (macro: AgentMacro) => {
    setEditingMacro(macro);
    setFormData({
      name: macro.name,
      description: macro.description || "",
      macro_type: macro.macro_type,
      config: macro.config,
    });
    setIsDialogOpen(true);
  };

  const applyTemplate = (templateName: string) => {
    const template = BROWSER_PROFILE_TEMPLATES[templateName as keyof typeof BROWSER_PROFILE_TEMPLATES];
    setFormData(prev => ({
      ...prev,
      config: template,
    }));
  };

  const getMacroTypeLabel = (type: string) => {
    switch (type) {
      case 'browser_profile': return 'Browser Profil';
      case 'detection_rule': return 'Detektionsregel';
      case 'tracking_config': return 'Tracking-konfiguration';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Agent Browser Makron
            </CardTitle>
            <CardDescription>
              Hantera säkra konfigurationer för olika agentiska webbläsare och detektionsregler
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nytt Makro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingMacro ? 'Redigera' : 'Skapa'} Makro</DialogTitle>
                <DialogDescription>
                  Konfigurera säker tracking och detektering för agentiska webbläsare
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Namn</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivning</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="macro_type">Makrotyp</Label>
                  <Select
                    value={formData.macro_type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, macro_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser_profile">Browser Profil</SelectItem>
                      <SelectItem value="detection_rule">Detektionsregel</SelectItem>
                      <SelectItem value="tracking_config">Tracking-konfiguration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.macro_type === 'browser_profile' && (
                  <div className="space-y-2">
                    <Label>Snabbmallar</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(BROWSER_PROFILE_TEMPLATES).map(template => (
                        <Button
                          key={template}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyTemplate(template)}
                        >
                          {template}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="config">Konfiguration (JSON)</Label>
                  <Textarea
                    id="config"
                    value={JSON.stringify(formData.config, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData(prev => ({ ...prev, config: parsed }));
                      } catch (err) {
                        // Invalid JSON, don't update
                      }
                    }}
                    className="font-mono text-sm"
                    rows={8}
                  />
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All konfiguration valideras och sanitizeras innan den används. Undvik att lägga till känslig information.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit">
                    {editingMacro ? 'Uppdatera' : 'Skapa'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laddar makron...</p>
        ) : macros.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga makron ännu. Skapa ditt första makro för att komma igång.</p>
        ) : (
          <div className="space-y-4">
            {macros.map((macro) => (
              <div key={macro.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{macro.name}</h4>
                    <Badge variant="outline">{getMacroTypeLabel(macro.macro_type)}</Badge>
                    {macro.is_active && <Badge variant="default">Aktiv</Badge>}
                  </div>
                  {macro.description && (
                    <p className="text-sm text-muted-foreground mb-2">{macro.description}</p>
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Visa konfiguration</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(macro.config, null, 2)}
                    </pre>
                  </details>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={macro.is_active}
                    onCheckedChange={(checked) => toggleMacro({ id: macro.id, is_active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(macro)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Är du säker på att du vill ta bort detta makro?')) {
                        deleteMacro(macro.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};