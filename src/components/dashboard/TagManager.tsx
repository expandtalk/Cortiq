/**
 * Tag Manager
 * Task #31: Tag Manager
 *
 * Manage tracking tags without code modifications
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2, Plus, Settings, Copy, Power, Trash2, Eye, Code } from 'lucide-react';
import { toast } from 'sonner';

interface Tag {
  id: string;
  site_id: string;
  name: string;
  type: string;
  description?: string;
  is_enabled: boolean;
  is_paused: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface TagTemplate {
  id: string;
  name: string;
  provider_name: string;
  category: string;
  icon_url?: string;
}

interface TagManagerProps {
  siteId: string;
}

const TAG_TYPES = [
  { id: 'event', label: 'Event' },
  { id: 'pixel', label: 'Pixel' },
  { id: 'script', label: 'Script' },
  { id: 'html', label: 'HTML' },
];

const POPULAR_PROVIDERS = [
  { name: 'Google Analytics', category: 'analytics' },
  { name: 'Meta Pixel', category: 'advertising' },
  { name: 'Hotjar', category: 'optimization' },
  { name: 'Intercom', category: 'cdp' },
  { name: 'Segment', category: 'cdp' },
  { name: 'Klaviyo', category: 'marketing' },
];

export function TagManager({ siteId }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<TagTemplate[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag>();
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'event',
    description: '',
    template: '',
  });

  useEffect(() => {
    loadTags();
    loadTemplates();
  }, [siteId]);

  async function loadTags() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTags(data || []);
      if (data && data.length > 0) {
        setSelectedTag(data[0]);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    try {
      const { data, error } = await supabase
        .from('tag_templates')
        .select('*')
        .limit(20);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  async function createTag() {
    try {
      if (!formData.name || !formData.type) {
        toast.error('Please fill in required fields');
        return;
      }

      const { error } = await supabase
        .from('tags')
        .insert({
          site_id: siteId,
          name: formData.name,
          type: formData.type,
          description: formData.description,
          config: {},
          is_enabled: true,
        });

      if (error) throw error;

      toast.success('Tag created successfully');
      setIsDialogOpen(false);
      setFormData({ name: '', type: 'event', description: '', template: '' });
      await loadTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    }
  }

  async function toggleTag(tagId: string, enabled: boolean) {
    try {
      const { error } = await supabase
        .from('tags')
        .update({ is_enabled: !enabled })
        .eq('id', tagId);

      if (error) throw error;

      toast.success(enabled ? 'Tag disabled' : 'Tag enabled');
      await loadTags();
    } catch (error) {
      console.error('Error toggling tag:', error);
      toast.error('Failed to update tag');
    }
  }

  async function deleteTag(tagId: string) {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast.success('Tag deleted');
      await loadTags();
      setSelectedTag(undefined);
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  }

  const getTagTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return '📊';
      case 'pixel':
        return '📷';
      case 'script':
        return '<>';
      case 'html':
        return '🔗';
      default:
        return '🏷️';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tags">
        <TabsList>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="datalayer">Data Layer</TabsTrigger>
        </TabsList>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Tags
                  </CardTitle>
                  <CardDescription>
                    Manage tracking tags without modifying code
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Tag</DialogTitle>
                      <DialogDescription>
                        Add a new tracking tag to your site
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="name">Tag Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Google Analytics"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="type">Tag Type</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAG_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="Optional description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={createTag}>Create Tag</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading tags...
                </div>
              ) : tags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Code2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tags yet</p>
                  <p className="text-sm">Create your first tag to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow
                        key={tag.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedTag(tag)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{getTagTypeIcon(tag.type)}</span>
                            {tag.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tag.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={tag.is_enabled ? 'default' : 'outline'}
                          >
                            {tag.is_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell>v{tag.version}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tag.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTag(tag.id, tag.is_enabled);
                              }}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTag(tag.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tag Details */}
          {selectedTag && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedTag.name}</CardTitle>
                <CardDescription>{selectedTag.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <div className="font-medium">{selectedTag.type}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Version</Label>
                    <div className="font-medium">v{selectedTag.version}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <div className="font-medium text-sm">
                      {new Date(selectedTag.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className="mt-1">
                      {selectedTag.is_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="font-medium mb-3 block">Tag Code</Label>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                    <div>
                      {`<script>\n`}
                      {`  window.CortIQ = window.CortIQ || {};\n`}
                      {`  window.CortIQ.tags = window.CortIQ.tags || [];\n`}
                      {`  window.CortIQ.tags.push({\n`}
                      {`    id: '${selectedTag.id}',\n`}
                      {`    name: '${selectedTag.name}',\n`}
                      {`    type: '${selectedTag.type}'\n`}
                      {`  });\n`}
                      {`</script>`}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tag Templates</CardTitle>
              <CardDescription>
                Pre-built tags for popular platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {POPULAR_PROVIDERS.map((provider) => (
                  <div
                    key={provider.name}
                    className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition"
                  >
                    <div className="font-medium mb-2">{provider.name}</div>
                    <div className="text-sm text-muted-foreground mb-3 capitalize">
                      {provider.category}
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tag
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Layer Tab */}
        <TabsContent value="datalayer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Layer Variables</CardTitle>
              <CardDescription>
                Define custom variables for your tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No data layer variables yet</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
