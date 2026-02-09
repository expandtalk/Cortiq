<?php
/**
 * WordPress REST API Endpoints for Analytics Dashboard
 * Version: 4.2.0 - Updated with cookiefree analytics support
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsRestAPIv2 {
    
    private $options;
    private $edge_functions;
    
    public function __construct($options) {
        $this->options = $options;
        
        // Säker initiering av edge functions
        if (class_exists('HeatmapAnalyticsEdgeFunctions')) {
            $this->edge_functions = new HeatmapAnalyticsEdgeFunctions();
        } else {
            $this->edge_functions = null;
        }
        
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Existing routes
        register_rest_route('heatmap-analytics/v1', '/sitekit-status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_sitekit_status'),
            'permission_callback' => array($this, 'check_permissions')
        ));
        
        register_rest_route('heatmap-analytics/v1', '/sitekit-sync', array(
            'methods' => 'POST',
            'callback' => array($this, 'trigger_sitekit_sync'),
            'permission_callback' => array($this, 'check_permissions')
        ));
        
        register_rest_route('heatmap-analytics/v1', '/plugin-status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_plugin_status'),
            'permission_callback' => array($this, 'check_permissions')
        ));
        
        // New 4.2.0 routes for cookiefree analytics
        register_rest_route('heatmap-analytics/v1', '/cookiefree-analytics', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_cookiefree_analytics'),
            'permission_callback' => array($this, 'check_permissions')
        ));
        
        register_rest_route('heatmap-analytics/v1', '/consent-validation', array(
            'methods' => 'POST',
            'callback' => array($this, 'validate_consent'),
            'permission_callback' => array($this, 'check_permissions')
        ));
        
        register_rest_route('heatmap-analytics/v1', '/track-gdpr', array(
            'methods' => 'POST',
            'callback' => array($this, 'track_gdpr_compliant'),
            'permission_callback' => '__return_true' // Public endpoint
        ));
        
        register_rest_route('heatmap-analytics/v1', '/ab-test-assign', array(
            'methods' => 'POST',
            'callback' => array($this, 'assign_ab_test'),
            'permission_callback' => '__return_true' // Public endpoint
        ));
        
        register_rest_route('heatmap-analytics/v1', '/dashboard-insights', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_dashboard_insights'),
            'permission_callback' => array($this, 'check_permissions')
        ));
    }
    
    /**
     * Check permissions for protected endpoints
     */
    public function check_permissions($request) {
        // Check for API key in header
        $api_key = $request->get_header('X-API-Key');
        if ($api_key && isset($this->options['api_key']) && $api_key === $this->options['api_key']) {
            return true;
        }
        
        // Check WordPress capabilities
        return current_user_can('manage_options');
    }
    
    /**
     * Get cookiefree analytics data
     */
    public function get_cookiefree_analytics($request) {
        if (!$this->edge_functions) {
            return new WP_Error('edge_functions_unavailable', 'Edge functions not available', array('status' => 500));
        }
        
        $params = $request->get_json_params();
        $site_id = $params['siteId'] ?? $this->options['tracking_id'];
        $start_date = $params['startDate'] ?? date('Y-m-d', strtotime('-30 days'));
        $end_date = $params['endDate'] ?? date('Y-m-d');
        
        $result = $this->edge_functions->get_cookiefree_analytics($site_id, $start_date, $end_date);
        
        if ($result && isset($result['success']) && $result['success']) {
            return rest_ensure_response($result['analytics']);
        }
        
        return new WP_Error('analytics_failed', 'Failed to fetch cookiefree analytics', array('status' => 500));
    }
    
    /**
     * Validate consent for tracking
     */
    public function validate_consent($request) {
        $params = $request->get_json_params();
        $site_id = $params['siteId'] ?? $this->options['tracking_id'];
        $session_id = $params['sessionId'];
        $consent_type = $params['consentType'];
        
        if (!$session_id || !$consent_type) {
            return new WP_Error('invalid_params', 'Missing required parameters', array('status' => 400));
        }
        
        $result = $this->edge_functions->validate_consent($site_id, $session_id, $consent_type);
        
        return rest_ensure_response($result);
    }
    
    /**
     * GDPR compliant tracking endpoint
     */
    public function track_gdpr_compliant($request) {
        $params = $request->get_json_params();
        
        if (!isset($params['site_id'])) {
            $params['site_id'] = $this->options['tracking_id'];
        }
        
        $result = $this->edge_functions->track_gdpr_compliant($params);
        
        return rest_ensure_response($result);
    }
    
    /**
     * A/B test assignment
     */
    public function assign_ab_test($request) {
        $params = $request->get_json_params();
        $site_id = $params['siteId'] ?? $this->options['tracking_id'];
        $session_id = $params['sessionId'];
        $test_id = $params['testId'] ?? null;
        
        if (!$session_id) {
            return new WP_Error('invalid_params', 'Missing session ID', array('status' => 400));
        }
        
        $result = $this->edge_functions->assign_ab_test($site_id, $session_id, $test_id);
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get dashboard insights
     */
    public function get_dashboard_insights($request) {
        $site_id = $request->get_param('site_id') ?: $this->options['tracking_id'];
        
        $result = $this->edge_functions->generate_insights($site_id);
        
        return rest_ensure_response($result);
    }
    
    /**
     * Enhanced Site Kit status with edge functions support
     */
    public function get_sitekit_status($request) {
        // Check if Google Site Kit is active
        if (!is_plugin_active('google-site-kit/google-site-kit.php')) {
            return rest_ensure_response(array(
                'detected' => false,
                'configured' => false,
                'analytics' => array('connected' => false),
                'searchConsole' => array('connected' => false),
                'message' => 'Google Site Kit plugin is not active'
            ));
        }
        
        // Get Site Kit status
        $analytics_connected = false;
        $search_console_connected = false;
        $property_id = '';
        $measurement_id = '';
        
        // FIXAT: Korrekt namespace-referens
        if (class_exists('Google\Site_Kit\Context')) {
            // Site Kit is available, get connection status
            try {
                $context = new Google\Site_Kit\Context(GOOGLESITEKIT_PLUGIN_MAIN_FILE);
                $analytics_connected = true; // Would need actual Site Kit API calls
                $search_console_connected = true;
            } catch (Exception $e) {
                if (function_exists('heatmap_log')) {
                    heatmap_log('Site Kit status error: ' . $e->getMessage(), 'error');
                }
            }
        }
        
        return rest_ensure_response(array(
            'detected' => true,
            'configured' => $analytics_connected || $search_console_connected,
            'analytics' => array(
                'connected' => $analytics_connected,
                'propertyId' => $property_id,
                'measurementId' => $measurement_id
            ),
            'searchConsole' => array(
                'connected' => $search_console_connected
            ),
            'lastSync' => get_option('heatmap_last_sitekit_sync'),
            'version' => defined('GOOGLESITEKIT_VERSION') ? GOOGLESITEKIT_VERSION : 'unknown',
            'edgeFunctionsEnabled' => true,
            'cookiefreeAnalyticsEnabled' => isset($this->options['cookiefree_analytics_enabled']) ? $this->options['cookiefree_analytics_enabled'] : false
        ));
    }
    
    /**
     * Enhanced plugin status
     */
    public function get_plugin_status($request) {
        $status = array(
            'plugin_version' => defined('HEATMAP_ANALYTICS_VERSION') ? HEATMAP_ANALYTICS_VERSION : '4.2.0',
            'tracking_enabled' => isset($this->options['tracking_enabled']) ? $this->options['tracking_enabled'] : false,
            'gdpr_enabled' => isset($this->options['gdpr_enabled']) ? $this->options['gdpr_enabled'] : false,
            'tracking_id' => isset($this->options['tracking_id']) ? $this->options['tracking_id'] : '',
            'site_url' => get_site_url(),
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            
            // New 4.2.0 features
            'edge_functions_enabled' => true,
            'cookiefree_analytics_enabled' => isset($this->options['cookiefree_analytics_enabled']) ? $this->options['cookiefree_analytics_enabled'] : false,
            'consent_validation_enabled' => isset($this->options['consent_validation_enabled']) ? $this->options['consent_validation_enabled'] : false,
            'ab_testing_enabled' => isset($this->options['ab_testing_enabled']) ? $this->options['ab_testing_enabled'] : false,
            'server_side_tracking' => isset($this->options['server_side_tracking']) ? $this->options['server_side_tracking'] : false,
            'enhanced_gdpr_compliance' => isset($this->options['enhanced_gdpr_compliance']) ? $this->options['enhanced_gdpr_compliance'] : false,
            
            // Plugin compatibility
            'google_sitekit_active' => is_plugin_active('google-site-kit/google-site-kit.php'),
            'google_analytics_active' => is_plugin_active('google-analytics-for-wordpress/googleanalytics.php'),
            'monsterinsights_active' => is_plugin_active('google-analytics-for-wordpress/googleanalytics.php'),
            'yoast_seo_active' => is_plugin_active('wordpress-seo/wp-seo.php'),
            'wp_rocket_active' => is_plugin_active('wp-rocket/wp-rocket.php'),
            
            // System info
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'max_execution_time' => ini_get('max_execution_time'),
            'memory_limit' => ini_get('memory_limit'),
            'upload_max_filesize' => ini_get('upload_max_filesize')
        );
        
        return rest_ensure_response($status);
    }
    
    /**
     * Enhanced Site Kit sync with edge functions
     */
    public function trigger_sitekit_sync($request) {
        $params = $request->get_json_params();
        $sync_type = $params['syncType'] ?? 'full';
        
        // Trigger Site Kit sync via edge function if available
        if ($this->edge_functions) {
            $site_id = $this->options['tracking_id'];
            $result = $this->edge_functions->sync_navigation($site_id, array('sync_type' => $sync_type));
            
            if ($result) {
                update_option('heatmap_last_sitekit_sync', current_time('mysql'));
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => 'Site Kit sync completed successfully',
                    'sync_type' => $sync_type,
                    'timestamp' => current_time('mysql')
                ));
            }
        }
        
        return new WP_Error('sync_failed', 'Site Kit sync failed', array('status' => 500));
    }
}
