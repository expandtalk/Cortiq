import { useState } from 'react';
import { Users, UserPlus, MoreVertical, Shield, Crown, User, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useOrganizationMembers, 
  useCurrentUserRole, 
  useUpdateMemberRole, 
  useRemoveMember,
  OrgRole 
} from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';

interface OrganizationMembersProps {
  organizationId: string;
}

const roleConfig: Record<OrgRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  owner: { label: 'Ägare', icon: Crown, color: 'bg-yellow-500/10 text-yellow-600' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-blue-500/10 text-blue-600' },
  member: { label: 'Medlem', icon: User, color: 'bg-green-500/10 text-green-600' },
  viewer: { label: 'Läsare', icon: Eye, color: 'bg-gray-500/10 text-gray-600' },
};

export function OrganizationMembers({ organizationId }: OrganizationMembersProps) {
  const { user } = useAuth();
  const { data: members, isLoading } = useOrganizationMembers(organizationId);
  const { data: currentUserRole } = useCurrentUserRole(organizationId);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('member');

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const handleRoleChange = (memberId: string, newRole: OrgRole) => {
    updateRole.mutate({ memberId, organizationId, role: newRole });
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Är du säker på att du vill ta bort denna medlem?')) {
      removeMember.mutate({ memberId, organizationId });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Laddar teammedlemmar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teammedlemmar
              </CardTitle>
              <CardDescription>
                Hantera vem som har åtkomst till organisationen
              </CardDescription>
            </div>
            {canManageMembers && (
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Bjud in
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members?.map((member) => {
              const config = roleConfig[member.role];
              const Icon = config.icon;
              const isCurrentUser = member.user_id === user?.id;
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profile?.full_name?.[0] || member.email?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profile?.full_name || member.email || 'Okänd användare'}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-2">(du)</span>
                        )}
                      </p>
                      <Badge variant="secondary" className={config.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                  
                  {canManageMembers && !isCurrentUser && member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                          Gör till admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                          Gör till medlem
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'viewer')}>
                          Gör till läsare
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Ta bort från team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
            
            {members?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Inga teammedlemmar ännu
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bjud in teammedlem</DialogTitle>
            <DialogDescription>
              Bjud in någon till din organisation. De får tillgång till alla sajter.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-postadress</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="kollega@foretag.se"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invite-role">Roll</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrgRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Full åtkomst</SelectItem>
                  <SelectItem value="member">Medlem - Kan hantera sajter</SelectItem>
                  <SelectItem value="viewer">Läsare - Endast läsbehörighet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Avbryt
            </Button>
            <Button disabled={!inviteEmail}>
              Skicka inbjudan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
