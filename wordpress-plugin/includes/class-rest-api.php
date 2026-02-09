<?php
/**
 * REST API endpoints for Heatmap Analytics
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsRestAPI {
    
    private $options;
    private $sitekit_integration;
    
    public function __construct($options, $sitekit_integration = null) {
        $this->options = $options;
        $this->sitekit_integration = $sitekit_integration;
        
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    public function register_routes() {
        register_rest_route('heatmap-analytics/v1', '/sitekit-status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_sitekit_status'),
            'permission_callback' => '__return_true', // Public endpoint
        ));
        
        register_rest_route('heatmap-analytics/v1', '/sitekit-sync', array(
            'methods' => 'POST',
            'callback' => array($this, 'trigger_sitekit_sync'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('heatmap-analytics/v1', '/plugin-status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_plugin_status'),
            'permission_callback' => '__return_true',
        ));
    }
    
    public function check_permissions($request) {
        // Kontrollera nonce eller API-nyckel här
        $api_key = $request->get_header('X-API-Key');
        if ($api_key && $api_key === $this->options['api_key']) {
            return true;
        }
        
        // Fallback till WordPress capability
        return current_user_can('manage_options');
    }
    
    public function get_sitekit_status($request) {
        try {
            $status = array(
                'detected' => false,
                'configured' => false,
                'analytics' => array('connected' => false),
                'searchConsole' => array('connected' => false),
                'version' => null,
                'lastSync' => null
            );
            
            // Kontrollera om Site Kit är installerat
            if (class_exists('Google\Site_Kit\Plugin')) {
                $status['detected'] = true;
                
                // Försök hämta Site Kit-version
                if (defined('GOOGLESITEKIT_VERSION')) {
                    $status['version'] = GOOGLESITEKIT_VERSION;
                }
                
                // Kontrollera Analytics-anslutning
                $analytics_settings = get_option('googlesitekit_analytics_settings', array());
                if (!empty($analytics_settings['propertyID'])) {
                    $status['analytics'] = array(
                        'connected' => true,
                        'propertyId' => $analytics_settings['propertyID'],
                        'measurementId' => $analytics_settings['measurementID'] ?? null
                    );
                    $status['configured'] = true;
                }
                
                // Kontrollera Search Console-anslutning
                $search_console_settings = get_option('googlesitekit_search-console_settings', array());
                if (!empty($search_console_settings['propertyID'])) {
                    $status['searchConsole'] = array(
                        'connected' => true,
                        'propertyId' => $search_console_settings['propertyID']
                    );
                    $status['configured'] = true;
                }
                
                // Hämta senaste synkronisering
                $last_sync = get_option('heatmap_analytics_last_sitekit_sync');
                if ($last_sync) {
                    $status['lastSync'] = $last_sync;
                }
            }
            
            return new WP_REST_Response($status, 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'error' => 'Failed to get Site Kit status',
                'message' => $e->getMessage()
            ), 500);
        }
    }
    
    public function trigger_sitekit_sync($request) {
        try {
            if (!$this->sitekit_integration) {
                return new WP_REST_Response(array(
                    'error' => 'Site Kit integration not available'
                ), 400);
            }
            
            $sync_type = $request->get_param('sync_type') ?? 'full';
            $result = $this->sitekit_integration->sync_with_supabase($sync_type);
            
            if ($result['success']) {
                return new WP_REST_Response($result, 200);
            } else {
                return new WP_REST_Response($result, 400);
            }
            
        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'error' => 'Sync failed',
                'message' => $e->getMessage()
            ), 500);
        }
    }
    
    public function get_plugin_status($request) {
        try {
            $status = array(
                'plugin_version' => HEATMAP_ANALYTICS_VERSION,
                'wordpress_version' => get_bloginfo('version'),
                'tracking_enabled' => $this->options['tracking_enabled'] ?? false,
                'tracking_id' => $this->options['tracking_id'] ?? '',
                'gdpr_enabled' => $this->options['gdpr_enabled'] ?? false,
                'sitekit_integration' => array(
                    'enabled' => $this->options['sitekit_integration_enabled'] ?? false,
                    'detected' => class_exists('Google\Site_Kit\Plugin')
                ),
                'site_url' => home_url(),
                'admin_email' => get_option('admin_email'),
                'plugins' => array()
            );
            
            // Lägg till information om andra relevanta plugins
            if (is_plugin_active('google-site-kit/google-site-kit.php')) {
                $status['plugins']['google-site-kit'] = array(
                    'active' => true,
                    'version' => defined('GOOGLESITEKIT_VERSION') ? GOOGLESITEKIT_VERSION : 'unknown'
                );
            }
            
            if (is_plugin_active('google-analytics-for-wordpress/googleanalytics.php')) {
                $status['plugins']['monster-insights'] = array(
                    'active' => true,
                    'note' => 'Potential conflict with MonsterInsights'
                );
            }
            
            return new WP_REST_Response($status, 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'error' => 'Failed to get plugin status',
                'message' => $e->getMessage()
            ), 500);
        }
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
    }
    
    public function set_sitekit_integration($sitekit_integration) {
        $this->sitekit_integration = $sitekit_integration;
    }
}
?>