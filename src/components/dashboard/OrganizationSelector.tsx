import { useState } from 'react';
import { Building2, ChevronDown, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrganizations, useCreateOrganization, Organization } from '@/hooks/useOrganization';

interface OrganizationSelectorProps {
  selectedOrgId: string | null;
  onSelectOrg: (orgId: string) => void;
}

export function OrganizationSelector({ selectedOrgId, onSelectOrg }: OrganizationSelectorProps) {
  const { data: organizations, isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');

  const selectedOrg = organizations?.find(org => org.id === selectedOrgId);

  const handleCreateOrg = async () => {
    if (!newOrgName || !newOrgSlug) return;
    
    try {
      const org = await createOrg.mutateAsync({ 
        name: newOrgName, 
        slug: newOrgSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      });
      onSelectOrg(org.id);
      setShowCreateDialog(false);
      setNewOrgName('');
      setNewOrgSlug('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full justify-between">
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Laddar...
        </span>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {selectedOrg?.name || 'Välj organisation'}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          {organizations?.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => onSelectOrg(org.id)}
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              <span className="truncate">{org.name}</span>
              {org.id === selectedOrgId && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Skapa ny organisation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa ny organisation</DialogTitle>
            <DialogDescription>
              En organisation kan ha flera sajter och teammedlemmar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organisationsnamn</Label>
              <Input
                id="org-name"
                value={newOrgName}
                onChange={(e) => {
                  setNewOrgName(e.target.value);
                  if (!newOrgSlug || newOrgSlug === generateSlug(newOrgName)) {
                    setNewOrgSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="Mitt Företag AB"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="org-slug">URL-slug</Label>
              <Input
                id="org-slug"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="mitt-foretag"
              />
              <p className="text-xs text-muted-foreground">
                Används i URL:er, t.ex. cortiq.app/org/{newOrgSlug || 'mitt-foretag'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreateOrg}
              disabled={!newOrgName || !newOrgSlug || createOrg.isPending}
            >
              {createOrg.isPending ? 'Skapar...' : 'Skapa organisation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
