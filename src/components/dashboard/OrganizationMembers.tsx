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
  owner: { label: 'Owner', icon: Crown, color: 'bg-yellow-500/10 text-yellow-600' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-blue-500/10 text-blue-600' },
  member: { label: 'Member', icon: User, color: 'bg-green-500/10 text-green-600' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-gray-500/10 text-gray-600' },
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
    if (confirm('Are you sure you want to remove this member?')) {
      removeMember.mutate({ memberId, organizationId });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading team members...</p>
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
                Team members
              </CardTitle>
              <CardDescription>
                Manage who has access to the organization
              </CardDescription>
            </div>
            {canManageMembers && (
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
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
                        {member.profile?.full_name || member.email || 'Unknown user'}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-2">(you)</span>
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
                          Make admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                          Make member
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'viewer')}>
                          Make viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
            
            {members?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No team members yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Invite someone to your organization. They will get access to all sites.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrgRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Full access</SelectItem>
                  <SelectItem value="member">Member - Can manage sites</SelectItem>
                  <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button disabled={!inviteEmail}>
              Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
