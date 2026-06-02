import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanyIntegration {
  id: string;
  company_id: string;
  integration_type: string;
  credentials: Record<string, string>;
  oauth_access_token: string | null;
  oauth_refresh_token: string | null;
  token_expires_at: string | null;
  oauth_scopes: string[] | null;
  account_metadata: Record<string, string>;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  error_message: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanyIntegrations(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company_integrations', companyId],
    queryFn: async (): Promise<CompanyIntegration[]> => {
      const { data, error } = await supabase
        .from('company_integrations')
        .select('*')
        .eq('company_id', companyId!);

      if (error) throw error;
      return (data ?? []) as CompanyIntegration[];
    },
    enabled: !!companyId,
  });
}

export interface SaveIntegrationPayload {
  companyId: string;
  integrationType: string;
  credentials: Record<string, string>;
  accountMetadata?: Record<string, string>;
}

export function useSaveIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ companyId, integrationType, credentials, accountMetadata }: SaveIntegrationPayload) => {
      const { data, error } = await supabase
        .from('company_integrations')
        .upsert(
          {
            company_id: companyId,
            integration_type: integrationType,
            credentials,
            account_metadata: accountMetadata ?? {},
            status: 'connected',
            error_message: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'company_id,integration_type' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company_integrations', variables.companyId] });
      toast({ title: 'Integration saved', description: 'Credentials stored successfully.' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not save integration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ companyId, integrationType }: { companyId: string; integrationType: string }) => {
      const { error } = await supabase
        .from('company_integrations')
        .update({
          status: 'disconnected',
          credentials: {},
          oauth_access_token: null,
          oauth_refresh_token: null,
          token_expires_at: null,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId)
        .eq('integration_type', integrationType);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company_integrations', variables.companyId] });
      toast({ title: 'Integration disconnected' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not disconnect',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
