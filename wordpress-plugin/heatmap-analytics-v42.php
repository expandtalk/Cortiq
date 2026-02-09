<?php
/**
 * Plugin Name: Heatmap Analytics Pro
 * Plugin URI: https://expandtalk.se
 * Description: Avancerad heatmap och användaranalys med förbättrad GDPR-kompatibilitet, cookie-hantering och Google Site Kit integration. Utvecklat av Expandtalk.se
 * Version: 4.2.0
 * Author: Expandtalk.se
 * Author URI: https://expandtalk.se
 * License: GPL v2 or later
 * Text Domain: heatmap-analytics
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HEATMAP_ANALYTICS_VERSION', '4.2.0');
define('HEATMAP_ANALYTICS_PLUGIN_FILE', __FILE__);
define('HEATMAP_ANALYTICS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEATMAP_ANALYTICS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HEATMAP_ANALYTICS_CACHE_KEY', 'heatmap_analytics_cache_');
define('HEATMAP_ANALYTICS_CACHE_TIME', 3600); // 1 hour

// Error logging helper
if (!function_exists('heatmap_log')) {
    function heatmap_log($message, $level = 'info') {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('[Heatmap Analytics ' . $level . '] ' . $message);
        }
    }
}

// Main plugin class
class HeatmapAnalyticsCore {
    
    private $options;
    private $tracking_id;
    private $managers = array();
    
    public function __construct() {
        $this->init();
        $this->load_dependencies();
        $this->init_hooks();
    }
    
    private function init() {
        $this->options = get_option('heatmap_analytics_options', $this->get_default_options());
        $this->tracking_id = isset($this->options['tracking_id']) ? $this->options['tracking_id'] : '';
    }
    
    private function get_default_options() {
        return array(
            'tracking_enabled' => true,
            'gdpr_enabled' => true,
            'cookie_banner_enabled' => true,
            'data_retention_days' => 90,
            'anonymize_ip' => true,
            'track_mobile' => true,
            'performance_mode' => true,
            'sampling_rate' => 100,
            'excluded_roles' => array('administrator'),
            'ip_exclusion_enabled' => false,
            'excluded_ips' => '',
            'form_tracking_enabled' => true,
            'ga_integration_enabled' => false,
            'detect_external_consent' => true,
            'error_logging' => true,
            'batch_events' => true,
            'batch_size' => 10,
            'batch_interval' => 5000,
            'auto_detect_pixels' => true,
            'plugin_scanner_enabled' => true,
            'first_party_enabled' => false,
            'beta_features_enabled' => false,
            'conversion_tracking_enabled' => true,
            'ai_insights_enabled' => false,
            'navigation_sync_enabled' => true,
            'sitekit_integration_enabled' => false,
            'sitekit_auto_sync' => true,
            'sitekit_sync_interval' => 3600,
            'tiktok_integration_enabled' => false,
            'tiktok_pixel_id' => '',
            'tiktok_age_verification' => true,
            'tiktok_china_consent' => false,
            'supabase_url' => 'https://cxmkdtgfocgbfizawlwa.supabase.co',
            'supabase_anon_key' => 'YOUR_SUPABASE_ANON_KEY',
            
            // New 4.2.0 options for Edge Functions integration
            'cookiefree_analytics_enabled' => true,
            'ab_testing_enabled' => false,
            'consent_validation_enabled' => true,
            'server_side_tracking' => true,
            'store_consent_edge_function' => true,
            'enhanced_gdpr_compliance' => true,
            'automatic_cookie_detection' => true,
            'real_time_consent_validation' => true,
            'edge_functions_enabled' => true,
            
            // Server-side tracking config
            'block_analytics_without_consent' => true,
            'block_marketing_without_consent' => true,
            'require_explicit_consent' => true,
            'third_party_integrations' => array(),
        );
    }
    
    private function should_load_frontend_features() {
        // Don't load for admin area
        if (is_admin()) {
            return false;
        }
        
        // Don't load for REST API requests
        if (defined('REST_REQUEST') && REST_REQUEST) {
            return false;
        }
        
        // Don't load for AJAX requests
        if (wp_doing_ajax()) {
            return false;
        }
        
        // Don't load for administrators (unless specifically testing)
        if (current_user_can('manage_options') && !isset($_GET['heatmap_test'])) {
            return false;
        }
        
        return true;
    }
    
    public function load_dependencies() {
        // Array of required files with their priorities
        $required_files = array(
            // Core files (highest priority)
            'includes/class-edge-functions.php' => 'required',
            'includes/class-enhanced-cookie-banner-v2.php' => 'required',
            'includes/class-rest-api-v2.php' => 'required',
            'includes/class-ab-testing-manager.php' => 'required',
            'includes/class-consent-validator.php' => 'required',
            
            // Optional files - inte längre required
            'includes/class-navigation-sync.php' => 'optional',
            'includes/class-sitekit-integration.php' => 'optional',
            'includes/class-tiktok-integration.php' => 'optional',
            'includes/class-gdpr-consent-handler.php' => 'optional',
            'includes/class-cookie-manager.php' => 'optional',
            'includes/class-tracking-manager.php' => 'optional',
            'includes/class-admin-settings.php' => 'optional',
            'includes/class-data-retention.php' => 'optional',
            'includes/class-pixel-detector.php' => 'optional',
            'includes/class-performance-optimizer.php' => 'optional',
            'includes/class-error-handler.php' => 'optional',
            'includes/class-google-analytics.php' => 'optional',
            'includes/class-plugin-scanner.php' => 'optional',
        );
        
        // Load files based on priority
        $missing_files = array();
        foreach ($required_files as $file => $priority) {
            $file_path = HEATMAP_ANALYTICS_PLUGIN_DIR . $file;
            
            if (file_exists($file_path)) {
                require_once $file_path;
                heatmap_log("Loaded: $file", 'debug');
            } else {
                if ($priority === 'required') {
                    $missing_files[] = $file;
                    heatmap_log("Required file missing: $file", 'error');
                } else {
                    heatmap_log("Optional file missing: $file", 'info');
                }
            }
        }
        
        // Show admin notice for missing required files
        if (!empty($missing_files)) {
            add_action('admin_notices', function() use ($missing_files) {
                if (current_user_can('manage_options')) {
                    echo '<div class="notice notice-error is-dismissible">';
                    echo '<p><strong>Heatmap Analytics Pro - Kritiska filer saknas:</strong></p>';
                    echo '<ul>';
                    foreach ($missing_files as $file) {
                        echo '<li>' . esc_html($file) . '</li>';
                    }
                    echo '</ul>';
                    echo '</div>';
                }
            });
        }
        
        // Initialize managers with Edge Functions support
        try {
            // Core edge functions manager (NEW in 4.2.0)
            $this->managers['edge_functions'] = new HeatmapAnalyticsEdgeFunctions();
            
            // Core managers
            $this->managers['cookie'] = new HeatmapAnalyticsCookieManager($this->options);
            
            // Frontend managers - only load when appropriate
            if ($this->should_load_frontend_features()) {
                if (isset($this->options['cookie_banner_enabled']) && $this->options['cookie_banner_enabled']) {
                    $this->managers['cookie_banner'] = new HeatmapAnalyticsEnhancedCookieBanner($this->options);
                }
                
                if (class_exists('HeatmapAnalyticsTrackingManager')) {
                    $this->managers['tracking'] = new HeatmapAnalyticsTrackingManager($this->options, $this->tracking_id);
                }
                
                if (isset($this->options['auto_detect_pixels']) && $this->options['auto_detect_pixels'] && class_exists('HeatmapAnalyticsPixelDetector')) {
                    $this->managers['pixels'] = new HeatmapAnalyticsPixelDetector($this->options);
                }
            }
            
            // Admin and backend managers
            if (class_exists('HeatmapAnalyticsAdminSettings')) {
                $this->managers['admin'] = new HeatmapAnalyticsAdminSettings($this->options, $this->managers['cookie'], null);
            }
            
            if (class_exists('HeatmapAnalyticsDataRetention')) {
                $this->managers['retention'] = new HeatmapAnalyticsDataRetention($this->options);
            }
            
            if (class_exists('HeatmapAnalyticsPerformanceOptimizer')) {
                $this->managers['performance'] = new HeatmapAnalyticsPerformanceOptimizer($this->options);
            }
            
            if (class_exists('HeatmapAnalyticsErrorHandler')) {
                $this->managers['errors'] = new HeatmapAnalyticsErrorHandler($this->options);
            }
            
            // Integration managers
            if ($this->options['ga_integration_enabled'] && class_exists('HeatmapAnalyticsGoogleAnalytics')) {
                $this->managers['ga_integration'] = new HeatmapAnalyticsGoogleAnalytics($this->options);
            }
            
            if ($this->options['plugin_scanner_enabled'] && class_exists('HeatmapAnalyticsPluginScanner')) {
                $this->managers['plugin_scanner'] = new HeatmapAnalyticsPluginScanner($this->options);
            }
            
            // Navigation sync manager
            if (class_exists('HeatmapAnalyticsNavigationSync')) {
                $this->managers['navigation'] = new HeatmapAnalyticsNavigationSync($this->options, $this->managers['edge_functions']);
            }
            
            // Google Site Kit integration manager
            if ($this->options['sitekit_integration_enabled'] && class_exists('HeatmapAnalyticsSiteKitIntegration')) {
                $this->managers['sitekit'] = new HeatmapAnalyticsSiteKitIntegration(
                    $this->options, 
                    $this->options['supabase_url'], 
                    $this->tracking_id
                );
            }
            
            // TikTok integration
            if ($this->options['tiktok_integration_enabled'] && class_exists('HeatmapAnalyticsTikTokIntegration')) {
                $this->managers['tiktok'] = new HeatmapAnalyticsTikTokIntegration($this->options);
            }
            
            // A/B Testing manager
            if ($this->options['ab_testing_enabled'] && class_exists('HeatmapAnalyticsABTestingManager')) {
                $this->managers['ab_testing'] = new HeatmapAnalyticsABTestingManager($this->options, $this->managers['edge_functions']);
            }
            
            // Consent validator
            if ($this->options['consent_validation_enabled'] && class_exists('HeatmapAnalyticsConsentValidator')) {
                $this->managers['consent_validator'] = new HeatmapAnalyticsConsentValidator($this->options, $this->managers['edge_functions']);
            }
            
            // REST API manager (NEW v2 with Edge Functions support)
            $this->managers['rest_api'] = new HeatmapAnalyticsRestAPIv2($this->options);
            
            heatmap_log('All managers initialized successfully (v4.2.0 with Edge Functions)', 'info');
            
        } catch (Exception $e) {
            heatmap_log('Failed to initialize managers: ' . $e->getMessage(), 'error');
        }
    }
    
    private function init_hooks() {
        register_activation_hook(HEATMAP_ANALYTICS_PLUGIN_FILE, array($this, 'activate'));
        register_deactivation_hook(HEATMAP_ANALYTICS_PLUGIN_FILE, array($this, 'deactivate'));
        
        // Add performance monitoring
        if (isset($this->options['performance_mode']) && $this->options['performance_mode']) {
            add_action('shutdown', array($this, 'log_performance_metrics'));
        }
        
        // Add nonce for batch events - only on frontend
        if (!is_admin() && !defined('REST_REQUEST') && !wp_doing_ajax()) {
            add_action('wp_enqueue_scripts', array($this, 'add_batch_nonce'));
        }
        
        // Schedule hourly sync for Edge Functions
        add_action('heatmap_analytics_hourly', array($this, 'hourly_tasks'));
        
        // GDPR consent handling
        add_action('wp_ajax_store_cookie_consent', array($this, 'ajax_store_consent'));
        add_action('wp_ajax_nopriv_store_cookie_consent', array($this, 'ajax_store_consent'));
    }
    
    public function ajax_store_consent() {
        if (!wp_verify_nonce($_POST['nonce'], 'store_consent_nonce')) {
            wp_send_json_error('Invalid nonce');
            return;
        }
        
        $consent_data = json_decode(stripslashes($_POST['consent_data']), true);
        
        if (!$consent_data || !isset($this->managers['edge_functions'])) {
            wp_send_json_error('Invalid data or Edge Functions not available');
            return;
        }
        
        // Store consent via Edge Function
        $result = $this->managers['edge_functions']->store_consent($consent_data);
        
        if ($result && isset($result['success']) && $result['success']) {
            wp_send_json_success('Consent stored via Edge Function');
        } else {
            wp_send_json_error('Failed to store consent');
        }
    }
    
    public function add_batch_nonce() {
        if (!$this->should_load_frontend_features()) {
            return;
        }
        
        wp_localize_script('heatmap-analytics-tracking', 'heatmap_ajax', array(
            'batch_nonce' => wp_create_nonce('heatmap_batch_nonce'),
            'store_consent_nonce' => wp_create_nonce('store_consent_nonce'),
            'edge_functions_enabled' => $this->options['edge_functions_enabled']
        ));
    }
    
    public function activate() {
        // Set default options on activation
        $defaults = $this->get_default_options();
        $existing = get_option('heatmap_analytics_options', array());
        $merged = wp_parse_args($existing, $defaults);
        
        // Add new 4.2.0 options to existing installations
        update_option('heatmap_analytics_options', $merged);
        
        // Schedule cron jobs
        if (!wp_next_scheduled('heatmap_analytics_hourly')) {
            wp_schedule_event(time(), 'hourly', 'heatmap_analytics_hourly');
        }
        
        heatmap_log('Plugin activated (v4.2.0 with Edge Functions support)', 'info');
    }
    
    public function deactivate() {
        // Cleanup on deactivation
        wp_clear_scheduled_hook('heatmap_analytics_hourly');
        wp_clear_scheduled_hook('heatmap_gdpr_cleanup');
        wp_clear_scheduled_hook('heatmap_analytics_daily_cleanup');
        
        heatmap_log('Plugin deactivated', 'info');
    }
    
    public function hourly_tasks() {
        // Sync with Edge Functions
        if (isset($this->managers['edge_functions'])) {
            $site_id = $this->tracking_id;
            if ($site_id) {
                // Trigger data cleanup via Edge Function
                $this->managers['edge_functions']->cleanup_data($site_id);
                
                // Generate insights
                if ($this->options['ai_insights_enabled']) {
                    $this->managers['edge_functions']->generate_insights($site_id);
                }
            }
        }
        
        heatmap_log('Hourly tasks completed with Edge Functions', 'info');
    }
    
    public function get_options() {
        return $this->options;
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
        update_option('heatmap_analytics_options', $new_options);
        $this->tracking_id = isset($new_options['tracking_id']) ? $new_options['tracking_id'] : '';
        
        // Update all managers
        foreach ($this->managers as $manager_name => $manager) {
            if (method_exists($manager, 'update_options')) {
                try {
                    $manager->update_options($new_options);
                } catch (Exception $e) {
                    heatmap_log('Error updating manager ' . $manager_name . ': ' . $e->getMessage(), 'error');
                }
            }
        }
        
        heatmap_log('Options updated (v4.2.0)', 'info');
    }
    
    public function log_performance_metrics() {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }
        
        $metrics = array(
            'memory_peak' => memory_get_peak_usage(true) / 1024 / 1024 . ' MB',
            'execution_time' => (microtime(true) - $_SERVER["REQUEST_TIME_FLOAT"]) . ' seconds',
            'queries' => get_num_queries(),
            'edge_functions_enabled' => $this->options['edge_functions_enabled']
        );
        
        heatmap_log('Performance metrics: ' . json_encode($metrics), 'debug');
    }
}

// Initialize the plugin
function heatmap_analytics_init() {
    global $heatmap_core;
    $heatmap_core = new HeatmapAnalyticsCore();
}

add_action('init', 'heatmap_analytics_init');

// Admin notices
add_action('admin_notices', function() {
    $options = get_option('heatmap_analytics_options', array());
    
    if (empty($options['tracking_id']) && current_user_can('manage_options')) {
        $settings_url = admin_url('options-general.php?page=heatmap-analytics');
        ?>
        <div class="notice notice-warning is-dismissible">
            <p><strong>Heatmap Analytics Pro v4.2.0:</strong> Konfigurera ditt tracking ID för att aktivera Edge Functions. 
            <a href="<?php echo esc_url($settings_url); ?>">Gå till inställningar</a></p>
        </div>
        <?php
    }
    
    // Show Edge Functions status
    if (current_user_can('manage_options') && !empty($options['tracking_id'])) {
        if (!$options['edge_functions_enabled']) {
            ?>
            <div class="notice notice-info is-dismissible">
                <p><strong>Heatmap Analytics Pro:</strong> Aktivera Edge Functions för cookiefri analys och förbättrad prestanda. 
                <a href="<?php echo esc_url(admin_url('options-general.php?page=heatmap-analytics')); ?>">Aktivera nu</a></p>
            </div>
            <?php
        }
    }
});

// AJAX endpoints for frontend functionality
add_action('wp_ajax_nopriv_heatmap_get_site_id', function() {
    global $heatmap_core;
    if (isset($heatmap_core->managers['tracking'])) {
        $site_id = $heatmap_core->managers['tracking']->get_site_id();
        wp_send_json_success(array('site_id' => $site_id));
    } else {
        wp_send_json_error('Tracking manager not available');
    }
});

add_action('wp_ajax_heatmap_get_site_id', function() {
    global $heatmap_core;
    if (isset($heatmap_core->managers['tracking'])) {
        $site_id = $heatmap_core->managers['tracking']->get_site_id();
        wp_send_json_success(array('site_id' => $site_id));
    } else {
        wp_send_json_error('Tracking manager not available');
    }
});

// Enhanced plugin status check
add_action('wp_ajax_heatmap_check_status', function() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
        return;
    }
    
    global $heatmap_core;
    $options = $heatmap_core->get_options();
    
    $status = array(
        'version' => HEATMAP_ANALYTICS_VERSION,
        'tracking_enabled' => $options['tracking_enabled'],
        'tracking_id_set' => !empty($options['tracking_id']),
        'gdpr_enabled' => $options['gdpr_enabled'],
        'edge_functions_enabled' => $options['edge_functions_enabled'],
        'cookiefree_analytics_enabled' => $options['cookiefree_analytics_enabled'],
        'managers_loaded' => array()
    );
    
    // Check which managers are loaded
    $manager_types = array('edge_functions', 'cookie', 'cookie_banner', 'tracking', 
                          'admin', 'retention', 'pixels', 'performance', 'errors', 
                          'ga_integration', 'plugin_scanner', 'ab_testing', 'consent_validator');
    
    foreach ($manager_types as $type) {
        $status['managers_loaded'][$type] = isset($heatmap_core->managers[$type]);
    }
    
    wp_send_json_success($status);
});

// Uninstall hook
register_uninstall_hook(__FILE__, 'heatmap_analytics_uninstall');

function heatmap_analytics_uninstall() {
    // Remove options
    delete_option('heatmap_analytics_options');
    delete_option('heatmap_analytics_last_sync');
    delete_option('heatmap_analytics_last_cleanup');
    delete_option('heatmap_manual_cookies');
    delete_option('heatmap_analytics_errors');
    delete_option('heatmap_analytics_site_id');
    
    // Clear scheduled hooks
    wp_clear_scheduled_hook('heatmap_gdpr_cleanup');
    wp_clear_scheduled_hook('heatmap_analytics_daily_cleanup');
    wp_clear_scheduled_hook('heatmap_analytics_hourly');
    wp_clear_scheduled_hook('heatmap_analytics_sync_events');
}

// Debug footer output - only for admins
add_action('wp_footer', function() {
    if (current_user_can('manage_options') && defined('WP_DEBUG') && WP_DEBUG && !is_admin()) {
        $options = get_option('heatmap_analytics_options', array());
        echo '<!-- Heatmap Analytics Pro v' . HEATMAP_ANALYTICS_VERSION . ' (Edge Functions) -->';
        echo '<!-- Tracking ID: ' . (isset($options['tracking_id']) ? esc_html($options['tracking_id']) : 'Not set') . ' -->';
        echo '<!-- Edge Functions: ' . ($options['edge_functions_enabled'] ? 'Enabled' : 'Disabled') . ' -->';
        echo '<!-- Cookiefree Analytics: ' . ($options['cookiefree_analytics_enabled'] ? 'Enabled' : 'Disabled') . ' -->';
    }
}, 100);

?>