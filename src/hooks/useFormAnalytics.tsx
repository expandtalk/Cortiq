import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FormAnalytics = {
  id: string;
  site_id: string;
  form_id: string;
  form_name: string | null;
  form_type: 'contact_form_7' | 'gravity_forms' | 'woocommerce_checkout' | 'custom';
  total_starts: number;
  total_completions: number;
  total_abandons: number;
  avg_completion_time: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
};

export type FormFieldAnalytics = {
  id: string;
  site_id: string;
  form_id: string;
  field_name: string;
  field_type: string | null;
  field_label: string | null;
  field_position: number | null;
  total_interactions: number;
  total_errors: number;
  total_skips: number;
  avg_focus_time: number;
  error_rate: number;
  skip_rate: number;
  created_at: string;
  updated_at: string;
};

export type FormSession = {
  id: string;
  site_id: string;
  session_id: string;
  form_id: string;
  form_type: string;
  started_at: string;
  completed_at: string | null;
  abandoned_at: string | null;
  completion_time: number | null;
  fields_completed: number;
  total_fields: number;
  error_count: number;
  device_type: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
};

export function useFormAnalytics(siteId: string) {
  return useQuery({
    queryKey: ['form-analytics', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_analytics')
        .select('*')
        .eq('site_id', siteId)
        .order('total_starts', { ascending: false });

      if (error) throw error;
      return data as FormAnalytics[];
    },
    enabled: !!siteId,
  });
}

export function useFormFieldAnalytics(siteId: string, formId?: string) {
  return useQuery({
    queryKey: ['form-field-analytics', siteId, formId],
    queryFn: async () => {
      let query = supabase
        .from('form_field_analytics')
        .select('*')
        .eq('site_id', siteId);

      if (formId) {
        query = query.eq('form_id', formId);
      }

      const { data, error } = await query
        .order('field_position', { ascending: true });

      if (error) throw error;
      return data as FormFieldAnalytics[];
    },
    enabled: !!siteId,
  });
}

export function useFormSessions(siteId: string, formId?: string, limit = 100) {
  return useQuery({
    queryKey: ['form-sessions', siteId, formId, limit],
    queryFn: async () => {
      let query = supabase
        .from('form_sessions')
        .select('*')
        .eq('site_id', siteId);

      if (formId) {
        query = query.eq('form_id', formId);
      }

      const { data, error } = await query
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as FormSession[];
    },
    enabled: !!siteId,
  });
}

export function useFormFunnelAnalysis(siteId: string, formId: string) {
  return useQuery({
    queryKey: ['form-funnel', siteId, formId],
    queryFn: async () => {
      // Get field analytics for funnel visualization
      const { data: fieldData, error: fieldError } = await supabase
        .from('form_field_analytics')
        .select('*')
        .eq('site_id', siteId)
        .eq('form_id', formId)
        .order('field_position', { ascending: true });

      if (fieldError) throw fieldError;

      // Get form completion rates
      const { data: formData, error: formError } = await supabase
        .from('form_analytics')
        .select('*')
        .eq('site_id', siteId)
        .eq('form_id', formId)
        .single();

      if (formError) throw formError;

      // Calculate funnel steps
      const funnelSteps = fieldData.map((field, index) => {
        const previousField = fieldData[index - 1];
        const completionRate = previousField 
          ? ((previousField.total_interactions - field.total_skips) / previousField.total_interactions) * 100
          : 100; // First field starts at 100%

        return {
          ...field,
          completionRate,
          dropOffRate: 100 - completionRate,
          users: Math.round((formData.total_starts * completionRate) / 100),
        };
      });

      return {
        form: formData,
        steps: funnelSteps,
        overallConversionRate: formData.conversion_rate,
      };
    },
    enabled: !!siteId && !!formId,
  });
}

export function useFormPerformanceMetrics(siteId: string) {
  return useQuery({
    queryKey: ['form-performance', siteId],
    queryFn: async () => {
      // Get all forms data
      const { data: forms, error: formsError } = await supabase
        .from('form_analytics')
        .select('*')
        .eq('site_id', siteId);

      if (formsError) throw formsError;

      // Calculate overall metrics
      const totalStarts = forms.reduce((sum, form) => sum + form.total_starts, 0);
      const totalCompletions = forms.reduce((sum, form) => sum + form.total_completions, 0);
      const totalAbandons = forms.reduce((sum, form) => sum + form.total_abandons, 0);

      const avgConversionRate = forms.length > 0 
        ? forms.reduce((sum, form) => sum + form.conversion_rate, 0) / forms.length 
        : 0;

      const avgCompletionTime = forms.length > 0
        ? forms.reduce((sum, form) => sum + form.avg_completion_time, 0) / forms.length
        : 0;

      // Find best and worst performing forms
      const bestForm = forms.reduce((best, current) => 
        current.conversion_rate > best.conversion_rate ? current : best, 
        forms[0] || null
      );

      const worstForm = forms.reduce((worst, current) => 
        current.conversion_rate < worst.conversion_rate ? current : worst, 
        forms[0] || null
      );

      return {
        totalStarts,
        totalCompletions,
        totalAbandons,
        avgConversionRate,
        avgCompletionTime,
        formsCount: forms.length,
        bestForm,
        worstForm,
        forms,
      };
    },
    enabled: !!siteId,
  });
}