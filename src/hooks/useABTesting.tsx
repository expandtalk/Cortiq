import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ABTest {
  id: string;
  site_id: string;
  test_name: string;
  test_description?: string;
  test_status: 'draft' | 'running' | 'paused' | 'completed';
  test_type: 'page' | 'element' | 'flow';
  start_date?: string;
  end_date?: string;
  traffic_allocation: { variant_a: number; variant_b: number };
  conversion_goal: string;
  conversion_metric: string;
  baseline_value?: number;
  target_lift?: number;
  confidence_level: number;
  minimum_sample_size?: number;
  created_at: string;
  updated_at: string;
  variants: ABTestVariant[];
}

interface ABTestVariant {
  id: string;
  test_id: string;
  variant_name: string;
  variant_description?: string;
  variant_config?: any;
  traffic_percentage: number;
  is_control: boolean;
  created_at: string;
}

interface ABTestResults {
  id: string;
  test_id: string;
  variant_id: string;
  sessions: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
  statistical_significance?: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  p_value?: number;
  calculated_at: string;
}

export function useABTesting(siteId: string | null) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all AB tests for a site
  const loadTests = async () => {
    if (!siteId) return;
    
    setIsLoading(true);
    try {
      const { data: testsData, error: testsError } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (testsError) throw testsError;

      // Load variants for each test
      const testsWithVariants = await Promise.all(
        testsData.map(async (test) => {
          const { data: variants, error: variantsError } = await supabase
            .from('ab_test_variants')
            .select('*')
            .eq('test_id', test.id)
            .order('created_at', { ascending: true });

          if (variantsError) throw variantsError;

          return {
            ...test,
            test_status: test.test_status as ABTest['test_status'],
            test_type: test.test_type as ABTest['test_type'],
            traffic_allocation: test.traffic_allocation as { variant_a: number; variant_b: number },
            variants: variants || []
          };
        })
      );

      setTests(testsWithVariants);
    } catch (error) {
      console.error('Error loading AB tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new AB test
  const createTest = async (testData: Partial<ABTest>) => {
    if (!siteId) return null;

    try {
      // Create the test
      const { data: test, error: testError } = await supabase
        .from('ab_tests')
        .insert({
          site_id: siteId,
          test_name: testData.test_name,
          test_description: testData.test_description,
          test_type: testData.test_type || 'page',
          conversion_goal: testData.conversion_goal,
          conversion_metric: testData.conversion_metric || 'conversion_rate',
          baseline_value: testData.baseline_value,
          target_lift: testData.target_lift,
          confidence_level: testData.confidence_level || 95,
          traffic_allocation: testData.traffic_allocation || { variant_a: 50, variant_b: 50 }
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create default variants (Control + Variant)
      const { error: variantsError } = await supabase
        .from('ab_test_variants')
        .insert([
          {
            test_id: test.id,
            variant_name: 'Control',
            variant_description: 'Original version',
            traffic_percentage: testData.traffic_allocation?.variant_a || 50,
            is_control: true
          },
          {
            test_id: test.id,
            variant_name: 'Variant A',
            variant_description: 'Test version',
            traffic_percentage: testData.traffic_allocation?.variant_b || 50,
            is_control: false
          }
        ]);

      if (variantsError) throw variantsError;

      await loadTests();
      return test;
    } catch (error) {
      console.error('Error creating AB test:', error);
      return null;
    }
  };

  // Update test status
  const updateTestStatus = async (testId: string, status: ABTest['test_status']) => {
    try {
      const updateData: any = { test_status: status };
      
      if (status === 'running') {
        updateData.start_date = new Date().toISOString();
      }
      
      if (status === 'completed') {
        updateData.end_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ab_tests')
        .update(updateData)
        .eq('id', testId);

      if (error) throw error;

      await loadTests();
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  // Get test results with statistical analysis
  const getTestResults = async (testId: string): Promise<ABTestResults[]> => {
    try {
      const { data, error } = await supabase
        .from('ab_test_results')
        .select('*')
        .eq('test_id', testId)
        .order('calculated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching test results:', error);
      return [];
    }
  };

  // Assign user to test variant (for tracking script)
  const assignToVariant = async (testId: string, sessionId: string, userIdentifier?: string) => {
    if (!siteId) return null;

    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from('ab_test_assignments')
        .select('variant_id')
        .eq('test_id', testId)
        .eq('session_id', sessionId)
        .single();

      if (existing) {
        return existing.variant_id;
      }

      // Get test variants
      const { data: variants, error: variantsError } = await supabase
        .from('ab_test_variants')
        .select('*')
        .eq('test_id', testId);

      if (variantsError) throw variantsError;

      // Simple random assignment based on traffic percentage
      const random = Math.random() * 100;
      let cumulativePercentage = 0;
      let assignedVariant = variants[0]; // fallback to first variant

      for (const variant of variants) {
        cumulativePercentage += variant.traffic_percentage;
        if (random <= cumulativePercentage) {
          assignedVariant = variant;
          break;
        }
      }

      // Record assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('ab_test_assignments')
        .insert({
          test_id: testId,
          variant_id: assignedVariant.id,
          session_id: sessionId,
          user_identifier: userIdentifier,
          site_id: siteId
        })
        .select('variant_id')
        .single();

      if (assignmentError) throw assignmentError;

      return assignment.variant_id;
    } catch (error) {
      console.error('Error assigning to variant:', error);
      return null;
    }
  };

  useEffect(() => {
    loadTests();
  }, [siteId]);

  return {
    tests,
    isLoading,
    createTest,
    updateTestStatus,
    getTestResults,
    assignToVariant,
    loadTests
  };
}