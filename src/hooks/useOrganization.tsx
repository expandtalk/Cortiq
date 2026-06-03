import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  billing_email: string | null;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  invited_at: string;
  joined_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  email?: string;
}

export function useOrganizations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Organization[];
    },
    enabled: !!user,
  });
}

export function useOrganization(orgId: string | null) {
  return useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!orgId,
  });
}

export function useOrganizationMembers(orgId: string | null) {
  return useQuery({
    queryKey: ['organization-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch profiles separately
      const members = data as OrganizationMember[];
      const userIds = members.map(m => m.user_id);
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        if (profiles) {
          const profileMap = new Map(profiles.map(p => [p.id, p]));
          members.forEach(m => {
            const profile = profileMap.get(m.user_id);
            if (profile) {
              m.profile = {
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
              };
            }
          });
        }
      }
      
      return members;
    },
    enabled: !!orgId,
  });
}

export function useCurrentUserRole(orgId: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-org-role', orgId, user?.id],
    queryFn: async () => {
      if (!orgId || !user) return null;
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .single();
      
      if (error) return null;
      return data.role as OrgRole;
    },
    enabled: !!orgId && !!user,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ 
          name, 
          slug,
          billing_email: user?.email 
        })
        .select()
        .single();
      
      if (orgError) throw orgError;
      
      // Add current user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user!.id,
          role: 'owner'
        });
      
      if (memberError) throw memberError;
      
      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created');
    },
    onError: (error) => {
      toast.error('Could not create organization: ' + error.message);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Organization> & { id: string }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', data.id] });
      toast.success('Organization updated');
    },
    onError: (error) => {
      toast.error('Could not update organization: ' + error.message);
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      userId,
      role 
    }: { 
      organizationId: string; 
      userId: string; 
      role: OrgRole;
    }) => {
      const { error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role,
          invited_by: user!.id,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', variables.organizationId] });
      toast.success('Member added');
    },
    onError: (error) => {
      toast.error('Could not add member: ' + error.message);
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      memberId, 
      organizationId,
      role 
    }: { 
      memberId: string; 
      organizationId: string;
      role: OrgRole;
    }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', variables.organizationId] });
      toast.success('Role updated');
    },
    onError: (error) => {
      toast.error('Could not update role: ' + error.message);
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, organizationId }: { memberId: string; organizationId: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', variables.organizationId] });
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error('Could not remove member: ' + error.message);
    },
  });
}
