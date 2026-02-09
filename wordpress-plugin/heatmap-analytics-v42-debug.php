<?php
/**
 * Plugin Name: Heatmap Analytics Pro (Debug Version)
 * Plugin URI: https://expandtalk.se
 * Description: Avancerad heatmap och användaranalys med förbättrad GDPR-kompatibilitet, cookie-hantering och Google Site Kit integration. Utvecklat av Expandtalk.se
 * Version: 4.2.0-debug
 * Author: Expandtalk.se
 * Author URI: https://expandtalk.se
 * License: GPL v2 or later
 * Text Domain: heatmap-analytics
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Enable error reporting for debugging
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Define plugin constants
define('HEATMAP_ANALYTICS_VERSION', '4.2.0-debug');
define('HEATMAP_ANALYTICS_PLUGIN_FILE', __FILE__);
define('HEATMAP_ANALYTICS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEATMAP_ANALYTICS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HEATMAP_ANALYTICS_CACHE_KEY', 'heatmap_analytics_cache_');
define('HEATMAP_ANALYTICS_CACHE_TIME', 3600); // 1 hour

// Error logging helper
if (!function_exists('heatmap_log')) {
    function heatmap_log($message, $level = 'info') {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('[Heatmap Analytics Debug ' . $level . '] ' . $message);
        }
    }
}

// Main plugin class with enhanced error handling
class HeatmapAnalyticsCore {
    
    private $options;
    private $tracking_id;
    private $managers = array();
    private $load_errors = array();
    
    public function __construct() {
        heatmap_log('Starting plugin initialization', 'info');
        
        try {
            $this->init();
            $this->load_dependencies();
            $this->init_hooks();
            heatmap_log('Plugin initialized successfully', 'info');
        } catch (Exception $e) {
            heatmap_log('Fatal error during initialization: ' . $e->getMessage(), 'error');
            $this->handle_fatal_error($e);
        }
    }
    
    private function handle_fatal_error($error) {
        // Log the error and disable the plugin gracefully
        heatmap_log('Disabling plugin due to fatal error: ' . $error->getMessage(), 'error');
        
        // Add admin notice about the error
        add_action('admin_notices', function() use ($error) {
            if (current_user_can('manage_options')) {
                ?>
                <div class="notice notice-error">
                    <p><strong>Heatmap Analytics Pro Error:</strong> <?php echo esc_html($error->getMessage()); ?></p>
                    <p>Plugin has been disabled to prevent site issues. Check error logs for details.</p>
                </div>
                <?php
            }
        });
    }
    
    private function init() {
        $this->options = get_option('heatmap_analytics_options', $this->get_default_options());
        $this->tracking_id = isset($this->options['tracking_id']) ? $this->options['tracking_id'] : '';
        heatmap_log('Options and tracking ID loaded', 'info');
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
    
    private function load_file_safely($file_path, $class_name = null) {
        if (!file_exists($file_path)) {
            $error = "Required file missing: $file_path";
            $this->load_errors[] = $error;
            heatmap_log($error, 'error');
            return false;
        }
        
        try {
            require_once $file_path;
            
            if ($class_name && !class_exists($class_name)) {
                $error = "Class $class_name not found in $file_path";
                $this->load_errors[] = $error;
                heatmap_log($error, 'error');
                return false;
            }
            
            heatmap_log("Successfully loaded: $file_path", 'debug');
            return true;
        } catch (Exception $e) {
            $error = "Error loading $file_path: " . $e->getMessage();
            $this->load_errors[] = $error;
            heatmap_log($error, 'error');
            return false;
        }
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
        heatmap_log('Starting dependency loading', 'info');
        
        // Required files array with optional class checking
        $required_files = array(
            'includes/class-edge-functions.php' => 'HeatmapAnalyticsEdgeFunctions',
            'includes/class-enhanced-cookie-banner-v2.php' => 'HeatmapAnalyticsEnhancedCookieBanner',
            'includes/class-rest-api-v2.php' => 'HeatmapAnalyticsRestAPIv2',
        );
        
        // Optional files that may not exist in all installations
        $optional_files = array(
            'includes/class-cookie-manager.php' => 'HeatmapAnalyticsCookieManager',
            'includes/class-tracking-manager.php' => 'HeatmapAnalyticsTrackingManager',
            'includes/class-admin-settings.php' => 'HeatmapAnalyticsAdminSettings',
            'includes/class-data-retention.php' => 'HeatmapAnalyticsDataRetention',
            'includes/class-pixel-detector.php' => 'HeatmapAnalyticsPixelDetector',
            'includes/class-performance-optimizer.php' => 'HeatmapAnalyticsPerformanceOptimizer',
            'includes/class-error-handler.php' => 'HeatmapAnalyticsErrorHandler',
            'includes/class-navigation-sync.php' => 'HeatmapAnalyticsNavigationSync',
            'includes/class-google-analytics.php' => 'HeatmapAnalyticsGoogleAnalytics',
            'includes/class-plugin-scanner.php' => 'HeatmapAnalyticsPluginScanner',
            'includes/class-sitekit-integration.php' => 'HeatmapAnalyticsSiteKitIntegration',
            'includes/class-tiktok-integration.php' => 'HeatmapAnalyticsTikTokIntegration',
            'includes/class-ab-testing-manager.php' => 'HeatmapAnalyticsABTestingManager',
            'includes/class-consent-validator.php' => 'HeatmapAnalyticsConsentValidator',
            'includes/class-gdpr-consent-handler.php' => 'HeatmapAnalyticsGDPRConsentHandler',
        );
        
        // Load required files first
        foreach ($required_files as $file => $class) {
            $file_path = HEATMAP_ANALYTICS_PLUGIN_DIR . $file;
            if (!$this->load_file_safely($file_path, $class)) {
                throw new Exception("Critical file missing or corrupt: $file");
            }
        }
        
        // Load optional files
        foreach ($optional_files as $file => $class) {
            $file_path = HEATMAP_ANALYTICS_PLUGIN_DIR . $file;
            $this->load_file_safely($file_path, $class);
        }
        
        // Initialize managers with comprehensive error handling
        try {
            heatmap_log('Initializing core managers', 'info');
            
            // Core edge functions manager (NEW in 4.2.0)
            $this->managers['edge_functions'] = new HeatmapAnalyticsEdgeFunctions();
            heatmap_log('Edge functions manager initialized', 'debug');
            
            // Core managers
            if (class_exists('HeatmapAnalyticsCookieManager')) {
                $this->managers['cookie'] = new HeatmapAnalyticsCookieManager($this->options);
                heatmap_log('Cookie manager initialized', 'debug');
            }
            
            // Frontend managers - only load when appropriate
            if ($this->should_load_frontend_features()) {
                heatmap_log('Loading frontend features', 'debug');
                
                if ($this->options['cookie_banner_enabled']) {
                    $this->managers['cookie_banner'] = new HeatmapAnalyticsEnhancedCookieBanner($this->options);
                    heatmap_log('Cookie banner initialized', 'debug');
                }
                
                if (class_exists('HeatmapAnalyticsTrackingManager')) {
                    $this->managers['tracking'] = new HeatmapAnalyticsTrackingManager($this->options, $this->tracking_id);
                    heatmap_log('Tracking manager initialized', 'debug');
                }
                
                if ($this->options['auto_detect_pixels'] && class_exists('HeatmapAnalyticsPixelDetector')) {
                    $this->managers['pixels'] = new HeatmapAnalyticsPixelDetector($this->options);
                    heatmap_log('Pixel detector initialized', 'debug');
                }
            }
            
            // Admin and backend managers
            if (class_exists('HeatmapAnalyticsAdminSettings')) {
                $this->managers['admin'] = new HeatmapAnalyticsAdminSettings($this->options, $this->managers['cookie'], null);
                heatmap_log('Admin settings initialized', 'debug');
            }
            
            // REST API manager (NEW v2 with Edge Functions support)
            $this->managers['rest_api'] = new HeatmapAnalyticsRestAPIv2($this->options);
            heatmap_log('REST API v2 initialized', 'debug');
            
            heatmap_log('All managers initialized successfully (v4.2.0 with Edge Functions)', 'info');
            
        } catch (Exception $e) {
            heatmap_log('Failed to initialize managers: ' . $e->getMessage(), 'error');
            throw $e;
        }
    }
    
    private function init_hooks() {
        register_activation_hook(HEATMAP_ANALYTICS_PLUGIN_FILE, array($this, 'activate'));
        register_deactivation_hook(HEATMAP_ANALYTICS_PLUGIN_FILE, array($this, 'deactivate'));
        
        // Add performance monitoring
        if ($this->options['performance_mode']) {
            add_action('shutdown', array($this, 'log_performance_metrics'));
        }
        
        // Schedule hourly sync for Edge Functions
        add_action('heatmap_analytics_hourly', array($this, 'hourly_tasks'));
        
        // GDPR consent handling
        add_action('wp_ajax_store_cookie_consent', array($this, 'ajax_store_consent'));
        add_action('wp_ajax_nopriv_store_cookie_consent', array($this, 'ajax_store_consent'));
        
        heatmap_log('Hooks initialized', 'debug');
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
    
    public function activate() {
        heatmap_log('Plugin activation started', 'info');
        
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
    
    public function log_performance_metrics() {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }
        
        $metrics = array(
            'memory_peak' => memory_get_peak_usage(true) / 1024 / 1024 . ' MB',
            'execution_time' => (microtime(true) - $_SERVER["REQUEST_TIME_FLOAT"]) . ' seconds',
            'queries' => get_num_queries(),
            'edge_functions_enabled' => $this->options['edge_functions_enabled'],
            'managers_loaded' => count($this->managers),
            'load_errors' => count($this->load_errors)
        );
        
        heatmap_log('Performance metrics: ' . json_encode($metrics), 'debug');
        
        if (!empty($this->load_errors)) {
            heatmap_log('Load errors: ' . json_encode($this->load_errors), 'warning');
        }
    }
    
    public function get_load_errors() {
        return $this->load_errors;
    }
}

// Initialize the plugin
function heatmap_analytics_init() {
    global $heatmap_core;
    try {
        $heatmap_core = new HeatmapAnalyticsCore();
    } catch (Exception $e) {
        heatmap_log('Critical error during plugin initialization: ' . $e->getMessage(), 'error');
        
        // Display admin notice
        add_action('admin_notices', function() use ($e) {
            if (current_user_can('manage_options')) {
                ?>
                <div class="notice notice-error">
                    <p><strong>Heatmap Analytics Pro Critical Error:</strong></p>
                    <p><?php echo esc_html($e->getMessage()); ?></p>
                    <p>Check the error logs for more details. The plugin has been disabled to prevent site issues.</p>
                </div>
                <?php
            }
        });
    }
}

add_action('init', 'heatmap_analytics_init');

// Admin notices with enhanced error reporting
add_action('admin_notices', function() {
    global $heatmap_core;
    
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
    
    // Show load errors if any
    if ($heatmap_core && method_exists($heatmap_core, 'get_load_errors')) {
        $load_errors = $heatmap_core->get_load_errors();
        if (!empty($load_errors) && current_user_can('manage_options')) {
            ?>
            <div class="notice notice-warning is-dismissible">
                <p><strong>Heatmap Analytics Pro - Laddningsvarningar:</strong></p>
                <ul>
                    <?php foreach ($load_errors as $error): ?>
                        <li><?php echo esc_html($error); ?></li>
                    <?php endforeach; ?>
                </ul>
                <p>Vissa funktioner kanske inte fungerar optimalt. Kontrollera att alla plugin-filer är kompletta.</p>
            </div>
            <?php
        }
    }
});

// Debug status checker
add_action('wp_ajax_heatmap_debug_status', function() {
    global $heatmap_core;
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
        return;
    }
    
    $status = array(
        'plugin_active' => is_object($heatmap_core),
        'load_errors' => $heatmap_core ? $heatmap_core->get_load_errors() : array(),
        'wp_debug' => defined('WP_DEBUG') && WP_DEBUG,
        'version' => HEATMAP_ANALYTICS_VERSION
    );
    
    wp_send_json_success($status);
});