import { useMemo } from 'react';

interface StatisticalResult {
  conversions_a: number;
  sessions_a: number;
  conversions_b: number;
  sessions_b: number;
  conversion_rate_a: number;
  conversion_rate_b: number;
  relative_improvement: number;
  absolute_improvement: number;
  statistical_significance: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  p_value: number;
  is_significant: boolean;
  required_sample_size: number;
  statistical_power: number;
  test_duration_recommendation: number; // days
}

interface TestData {
  control: { conversions: number; sessions: number };
  variant: { conversions: number; sessions: number };
  baseline_rate?: number;
  target_lift?: number;
  confidence_level?: number;
}

export function useABStatistics(data: TestData | null) {
  return useMemo((): StatisticalResult | null => {
    if (!data || !data.control.sessions || !data.variant.sessions) {
      return null;
    }

    const { control, variant, baseline_rate = 0, target_lift = 0.2, confidence_level = 95 } = data;
    
    // Basic conversion rates
    const conversion_rate_a = control.conversions / control.sessions;
    const conversion_rate_b = variant.conversions / variant.sessions;
    
    // Improvements
    const relative_improvement = ((conversion_rate_b - conversion_rate_a) / conversion_rate_a) * 100;
    const absolute_improvement = conversion_rate_b - conversion_rate_a;
    
    // Statistical calculations
    const n_a = control.sessions;
    const n_b = variant.sessions;
    const x_a = control.conversions;
    const x_b = variant.conversions;
    
    // Pooled standard error for two-proportion z-test
    const p_pooled = (x_a + x_b) / (n_a + n_b);
    const se_pooled = Math.sqrt(p_pooled * (1 - p_pooled) * (1/n_a + 1/n_b));
    
    // Z-score calculation
    const z_score = Math.abs(conversion_rate_b - conversion_rate_a) / se_pooled;
    
    // P-value approximation (two-tailed test)
    const p_value = 2 * (1 - normalCDF(z_score));
    
    // Statistical significance
    const alpha = (100 - confidence_level) / 100;
    const is_significant = p_value < alpha;
    const statistical_significance = (1 - p_value) * 100;
    
    // Confidence interval for the difference
    const z_critical = getZCritical(confidence_level);
    const se_diff = Math.sqrt((conversion_rate_a * (1 - conversion_rate_a)) / n_a + 
                              (conversion_rate_b * (1 - conversion_rate_b)) / n_b);
    
    const ci_margin = z_critical * se_diff;
    const confidence_interval_lower = (absolute_improvement - ci_margin) * 100;
    const confidence_interval_upper = (absolute_improvement + ci_margin) * 100;
    
    // Sample size calculation (for adequate power)
    const effect_size = Math.abs(target_lift);
    const base_rate = baseline_rate || conversion_rate_a;
    const power = 0.8; // 80% statistical power
    
    const required_sample_size = calculateSampleSize(base_rate, effect_size, alpha, power);
    
    // Current statistical power
    const current_power = calculatePower(conversion_rate_a, conversion_rate_b, n_a, n_b, alpha);
    
    // Test duration recommendation (assuming 1000 sessions per day)
    const sessions_per_day = 1000;
    const total_sessions_needed = required_sample_size * 2;
    const test_duration_recommendation = Math.ceil(total_sessions_needed / sessions_per_day);
    
    return {
      conversions_a: x_a,
      sessions_a: n_a,
      conversions_b: x_b,
      sessions_b: n_b,
      conversion_rate_a: conversion_rate_a * 100,
      conversion_rate_b: conversion_rate_b * 100,
      relative_improvement,
      absolute_improvement: absolute_improvement * 100,
      statistical_significance: Math.max(0, statistical_significance),
      confidence_interval_lower,
      confidence_interval_upper,
      p_value,
      is_significant,
      required_sample_size,
      statistical_power: current_power * 100,
      test_duration_recommendation
    };
  }, [data]);
}

// Helper functions for statistical calculations
function normalCDF(z: number): number {
  // Approximation of the cumulative standard normal distribution
  return (1 + erf(z / Math.sqrt(2))) / 2;
}

function erf(x: number): number {
  // Error function approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

function getZCritical(confidence_level: number): number {
  const alpha = (100 - confidence_level) / 100;
  const z_values: { [key: number]: number } = {
    0.1: 1.645,  // 90%
    0.05: 1.96,  // 95%
    0.01: 2.576, // 99%
  };
  return z_values[alpha] || 1.96;
}

function calculateSampleSize(base_rate: number, effect_size: number, alpha: number, power: number): number {
  const z_alpha = getZCritical((1 - alpha) * 100);
  const z_beta = getZCritical((power) * 100);
  
  const p1 = base_rate;
  const p2 = base_rate * (1 + effect_size);
  
  const numerator = Math.pow(z_alpha + z_beta, 2) * (p1 * (1 - p1) + p2 * (1 - p2));
  const denominator = Math.pow(p2 - p1, 2);
  
  return Math.ceil(numerator / denominator);
}

function calculatePower(p1: number, p2: number, n1: number, n2: number, alpha: number): number {
  const z_alpha = getZCritical((1 - alpha) * 100);
  const pooled_p = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pooled_p * (1 - pooled_p) * (1/n1 + 1/n2));
  
  const z_score = Math.abs(p2 - p1) / se;
  const power = normalCDF(z_score - z_alpha);
  
  return Math.max(0, Math.min(1, power));
}