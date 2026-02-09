<?php
/**
 * Enhanced Supabase Edge Functions Integration
 * Version: 4.2.0 - Updated for cookiefree analytics and latest edge functions
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsEdgeFunctions {
    
    private $supabase_url;
    private $supabase_anon_key;
    
    public function __construct() {
        $this->supabase_url = 'https://cxmkdtgfocgbfizawlwa.supabase.co';
        $this->supabase_anon_key = 'YOUR_SUPABASE_ANON_KEY';
    }
    
    /**
     * Invoke a Supabase Edge Function
     */
    private function invoke_edge_function($function_name, $payload = array()) {
        $url = $this->supabase_url . '/functions/v1/' . $function_name;
        
        $headers = array(
            'Authorization' => 'Bearer ' . $this->supabase_anon_key,
            'Content-Type' => 'application/json',
            'apikey' => $this->supabase_anon_key
        );
        
        $args = array(
            'method' => 'POST',
            'headers' => $headers,
            'body' => json_encode($payload),
            'timeout' => 30
        );
        
        heatmap_log("Invoking edge function: {$function_name}", 'debug');
        
        $response = wp_remote_post($url, $args);
        
        if (is_wp_error($response)) {
            heatmap_log("Edge function error: " . $response->get_error_message(), 'error');
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $decoded = json_decode($body, true);
        
        if (wp_remote_retrieve_response_code($response) !== 200) {
            heatmap_log("Edge function HTTP error: " . wp_remote_retrieve_response_code($response), 'error');
            return false;
        }
        
        return $decoded;
    }
    
    /**
     * Store consent data via edge function
     */
    public function store_consent($consent_data) {
        return $this->invoke_edge_function('store-consent', $consent_data);
    }
    
    /**
     * Validate consent for tracking
     */
    public function validate_consent($site_id, $session_id, $consent_type) {
        return $this->invoke_edge_function('consent-check', array(
            'siteId' => $site_id,
            'sessionId' => $session_id,
            'consentType' => $consent_type
        ));
    }
    
    /**
     * Get cookiefree analytics data
     */
    public function get_cookiefree_analytics($site_id, $start_date, $end_date) {
        return $this->invoke_edge_function('cookiefree-analytics', array(
            'siteId' => $site_id,
            'startDate' => $start_date,
            'endDate' => $end_date
        ));
    }
    
    /**
     * Sync detected cookies
     */
    public function sync_detected_cookies($site_id, $cookies_data) {
        return $this->invoke_edge_function('cookie-scanner', array(
            'siteId' => $site_id,
            'cookies' => $cookies_data
        ));
    }
    
    /**
     * GDPR compliant tracking
     */
    public function track_gdpr_compliant($tracking_data) {
        return $this->invoke_edge_function('gdpr-compliant-tracking', $tracking_data);
    }
    
    /**
     * Pixel tracking via edge function
     */
    public function track_pixel($pixel_data) {
        return $this->invoke_edge_function('pixel-tracking', $pixel_data);
    }
    
    /**
     * Form detection
     */
    public function detect_forms($site_url) {
        return $this->invoke_edge_function('form-detector', array(
            'siteUrl' => $site_url
        ));
    }
    
    /**
     * A/B test assignment
     */
    public function assign_ab_test($site_id, $session_id, $test_id = null) {
        return $this->invoke_edge_function('ab-test-calculator', array(
            'siteId' => $site_id,
            'sessionId' => $session_id,
            'testId' => $test_id
        ));
    }
    
    /**
     * Generate dashboard insights
     */
    public function generate_insights($site_id) {
        return $this->invoke_edge_function('generate-dashboard-insights', array(
            'siteId' => $site_id
        ));
    }
    
    /**
     * Navigation sync
     */
    public function sync_navigation($site_id, $navigation_data) {
        return $this->invoke_edge_function('navigation-sync', array(
            'siteId' => $site_id,
            'navigationData' => $navigation_data
        ));
    }
    
    /**
     * Track navigation click
     */
    public function track_navigation($navigation_data) {
        return $this->invoke_edge_function('track-navigation', $navigation_data);
    }
    
    /**
     * Data retention cleanup
     */
    public function cleanup_data($site_id) {
        return $this->invoke_edge_function('data-retention', array(
            'siteId' => $site_id
        ));
    }
    
    /**
     * Cookie import from external sources
     */
    public function import_cookies($site_id, $import_data) {
        return $this->invoke_edge_function('cookie-importer', array(
            'siteId' => $site_id,
            'importData' => $import_data
        ));
    }
    
    /**
     * Get active cookies for a site
     */
    public function get_active_cookies($site_id) {
        return $this->invoke_edge_function('active-cookies', array(
            'siteId' => $site_id
        ));
    }
    
    /**
     * Analyze website for cookies and scripts
     */
    public function analyze_website($site_url) {
        return $this->invoke_edge_function('analyze-website', array(
            'siteUrl' => $site_url
        ));
    }
    
    /**
     * GA4 integrations
     */
    public function sync_ga4_data($site_id, $property_id) {
        return $this->invoke_edge_function('ga4-import', array(
            'siteId' => $site_id,
            'propertyId' => $property_id
        ));
    }
    
    public function get_ga4_search_terms($site_id) {
        return $this->invoke_edge_function('ga4-search-terms', array(
            'siteId' => $site_id
        ));
    }
    
    public function get_ga4_traffic_sources($site_id) {
        return $this->invoke_edge_function('ga4-traffic-sources', array(
            'siteId' => $site_id
        ));
    }
    
    public function get_ga4_ai_traffic($site_id) {
        return $this->invoke_edge_function('ga4-ai-traffic', array(
            'siteId' => $site_id
        ));
    }
    
    public function sync_ga4_conversions($site_id) {
        return $this->invoke_edge_function('ga4-conversion-sync', array(
            'siteId' => $site_id
        ));
    }
    
    public function get_ga4_kpi_dashboard($site_id) {
        return $this->invoke_edge_function('ga4-kpi-dashboard', array(
            'siteId' => $site_id
        ));
    }
    
    public function get_ga4_segment_data($site_id, $segment_id) {
        return $this->invoke_edge_function('ga4-segment-data', array(
            'siteId' => $site_id,
            'segmentId' => $segment_id
        ));
    }
}