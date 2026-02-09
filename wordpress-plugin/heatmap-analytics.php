<?php
/**
 * Plugin Name: Heatmap Analytics Pro
 * Plugin URI: https://expandtalk.se
 * Description: Först på marknaden med Agentic Browser Analytics - spåra AI-agenter som ChatGPT Browser och Perplexity Comet. Inkluderar cookiefree serverside tracking, avancerad heatmap-analys och GDPR-kompatibilitet. Utvecklat av Expandtalk.se
 * Version: 5.0.0
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
define('HEATMAP_ANALYTICS_VERSION', '5.0.0');
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
            'tiktok_integration_enabled' => false, // NEW: TikTok integration
            'tiktok_pixel_id' => '',
            'tiktok_age_verification' => true,
            'tiktok_china_consent' => false,
            'supabase_url' => 'https://cxmkdtgfocgbfizawlwa.supabase.co',
            'supabase_anon_key' => 'YOUR_SUPABASE_ANON_KEY'
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
        
        // Don't load for administrators
        if (current_user_can('manage_options')) {
            return false;
        }
        
        return true;
    }
    
    public function load_dependencies() {
        // Load all required classes (SecurityManager removed)
        $classes = array(
            // 'class-security-manager.php', // REMOVED - Causing REST API conflicts
            'class-cookie-manager.php',
            'class-supabase-sync.php',
            'class-enhanced-cookie-banner.php',
            'class-tracking-manager.php',
            'class-admin-settings.php',
            'class-data-retention.php',
            'class-pixel-detector.php',
            'class-performance-optimizer.php',
            'class-error-handler.php',
            'class-navigation-sync.php',
            'class-google-analytics.php',
            'class-plugin-scanner.php',
            'class-sitekit-integration.php',
            'class-tiktok-integration.php',
            'class-ab-testing-manager.php',
            'class-consent-validator.php',
            'class-rest-api.php'
        );
        
        foreach ($classes as $class_file) {
            $file_path = HEATMAP_ANALYTICS_PLUGIN_DIR . 'includes/' . $class_file;
            if (file_exists($file_path)) {
                require_once $file_path;
            } else {
                heatmap_log("Missing required file: $class_file", 'error');
            }
        }
        
        // Initialize all managers
        try {
            // Core managers
            $this->managers['cookie'] = new HeatmapAnalyticsCookieManager($this->options);
            $this->managers['supabase'] = new HeatmapAnalyticsSupabaseSync();
            
            // Frontend managers - only load when appropriate
            if ($this->should_load_frontend_features()) {
                if (isset($this->options['cookie_banner_enabled']) && $this->options['cookie_banner_enabled']) {
                    $this->managers['banner'] = new HeatmapAnalyticsEnhancedCookieBanner($this->options, $this->tracking_id);
                }
                
                $this->managers['tracking'] = new HeatmapAnalyticsTrackingManager($this->options, $this->tracking_id);
                
                if (isset($this->options['auto_detect_pixels']) && $this->options['auto_detect_pixels']) {
                    $this->managers['pixels'] = new HeatmapAnalyticsPixelDetector($this->options);
                }
            }
            
            // Admin settings (always load)
            $this->managers['admin'] = new HeatmapAnalyticsAdminSettings($this->options, $this->managers['cookie'], null);
            
            // Data managers
            $this->managers['retention'] = new HeatmapAnalyticsDataRetention($this->options);
            $this->managers['performance'] = new HeatmapAnalyticsPerformanceOptimizer($this->options);
            $this->managers['errors'] = new HeatmapAnalyticsErrorHandler($this->options);
            
            // Integration managers
            if (isset($this->options['ga_integration_enabled']) && $this->options['ga_integration_enabled']) {
                $this->managers['ga_integration'] = new HeatmapAnalyticsGoogleAnalytics($this->options);
            }
            
            if (isset($this->options['plugin_scanner_enabled']) && $this->options['plugin_scanner_enabled']) {
                $this->managers['plugin_scanner'] = new HeatmapAnalyticsPluginScanner($this->options);
            }
            
            // Navigation sync manager
            $this->managers['navigation'] = new HeatmapAnalyticsNavigationSync($this->options, $this->managers['supabase']);
            
            // Google Site Kit integration manager
            if (isset($this->options['sitekit_integration_enabled']) && $this->options['sitekit_integration_enabled']) {
                $supabase_url = isset($this->options['supabase_url']) ? $this->options['supabase_url'] : 'https://cxmkdtgfocgbfizawlwa.supabase.co';
                $this->managers['sitekit'] = new HeatmapAnalyticsSiteKitIntegration($this->options, $supabase_url, $this->tracking_id);
            }
            
            // REST API manager
            $this->managers['rest_api'] = new HeatmapAnalyticsRestAPI($this->options, $this->managers['sitekit'] ?? null);
            
            heatmap_log('All managers initialized successfully', 'info');
            
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
        
        // Schedule hourly sync
        add_action('heatmap_analytics_hourly', array($this, 'hourly_tasks'));
    }
    
    public function add_batch_nonce() {
        // Only add nonce if tracking is enabled and conditions are met
        if (!$this->should_load_frontend_features()) {
            return;
        }
        
        wp_localize_script('heatmap-analytics-tracking', 'heatmap_ajax', array(
            'batch_nonce' => wp_create_nonce('heatmap_batch_nonce')
        ));
    }
    
    public function activate() {
        // Safety check for Site Kit conflicts
        if (class_exists('Google\Site_Kit\Plugin')) {
            // Add admin notice about Site Kit integration
            add_option('heatmap_sitekit_integration_notice', true);
        }
        
        // Set default options on activation
        $defaults = $this->get_default_options();
        $existing = get_option('heatmap_analytics_options', array());
        $merged = wp_parse_args($existing, $defaults);
        update_option('heatmap_analytics_options', $merged);
        
        // Create database tables if needed
        $this->create_tables();
        
        // Schedule cron jobs - but not during activation to prevent conflicts
        wp_schedule_single_event(time() + 300, 'heatmap_delayed_cron_setup'); // 5 minutes delay
        add_action('heatmap_delayed_cron_setup', array($this, 'setup_cron_jobs'));
        
        heatmap_log('Plugin activated successfully', 'info');
    }
    
    public function setup_cron_jobs() {
        if (!wp_next_scheduled('heatmap_analytics_hourly')) {
            wp_schedule_event(time(), 'hourly', 'heatmap_analytics_hourly');
        }
        
        if (!wp_next_scheduled('heatmap_gdpr_cleanup')) {
            wp_schedule_event(time(), 'daily', 'heatmap_gdpr_cleanup');
        }
        
        if (!wp_next_scheduled('heatmap_analytics_daily_cleanup')) {
            wp_schedule_event(time(), 'daily', 'heatmap_analytics_daily_cleanup');
        }
    }
    
    public function deactivate() {
        // Cleanup on deactivation
        wp_clear_scheduled_hook('heatmap_gdpr_cleanup');
        wp_clear_scheduled_hook('heatmap_analytics_daily_cleanup');
        wp_clear_scheduled_hook('heatmap_analytics_hourly');
        
        // Clear cache
        $this->clear_all_cache();
        
        heatmap_log('Plugin deactivated', 'info');
    }
    
    private function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        $table_name = $wpdb->prefix . 'heatmap_analytics_events';
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            tracking_id varchar(50) NOT NULL,
            session_id varchar(100) NOT NULL,
            event_type varchar(50) NOT NULL,
            event_data longtext,
            user_ip varchar(45),
            user_agent text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            synced tinyint(1) DEFAULT 0,
            PRIMARY KEY (id),
            KEY tracking_id (tracking_id),
            KEY session_id (session_id),
            KEY event_type (event_type),
            KEY created_at (created_at),
            KEY synced (synced)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        heatmap_log('Database tables created/updated', 'info');
    }
    
    public function hourly_tasks() {
        // Sync pending events
        if (isset($this->managers['supabase'])) {
            $this->managers['supabase']->sync_pending_events();
        }
        
        // Clean up old error logs
        if (isset($this->managers['errors'])) {
            $errors = $this->managers['errors']->get_recent_errors(200);
            if (count($errors) > 100) {
                // Keep only last 100 errors
                $this->managers['errors']->clear_errors();
                foreach (array_slice($errors, 0, 100) as $error) {
                    $this->managers['errors']->log_error($error);
                }
            }
        }
        
        heatmap_log('Hourly tasks completed', 'info');
    }
    
    public function get_options() {
        return $this->options;
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
        update_option('heatmap_analytics_options', $new_options);
        
        // Update tracking ID
        $this->tracking_id = isset($new_options['tracking_id']) ? $new_options['tracking_id'] : '';
        
        // Update all managers with proper parameter handling
        foreach ($this->managers as $manager_name => $manager) {
            if (method_exists($manager, 'update_options')) {
                try {
                    // Get method reflection to check parameter count
                    $reflection = new ReflectionMethod($manager, 'update_options');
                    $paramCount = $reflection->getNumberOfParameters();
                    
                    if ($paramCount >= 2 && $manager_name === 'tracking') {
                        // Tracking manager needs two parameters
                        $manager->update_options($new_options, $this->tracking_id);
                    } else {
                        // Other managers need only one parameter
                        $manager->update_options($new_options);
                    }
                } catch (Exception $e) {
                    heatmap_log('Error updating manager ' . $manager_name . ': ' . $e->getMessage(), 'error');
                }
            }
        }
        
        // Clear cache when options change
        $this->clear_all_cache();
        
        heatmap_log('Options updated', 'info');
    }
    
    private function clear_all_cache() {
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_" . HEATMAP_ANALYTICS_CACHE_KEY . "%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_" . HEATMAP_ANALYTICS_CACHE_KEY . "%'");
        
        heatmap_log('Cache cleared', 'info');
    }
    
    public function log_performance_metrics() {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }
        
        $metrics = array(
            'memory_peak' => memory_get_peak_usage(true) / 1024 / 1024 . ' MB',
            'execution_time' => (microtime(true) - $_SERVER["REQUEST_TIME_FLOAT"]) . ' seconds',
            'queries' => get_num_queries()
        );
        
        heatmap_log('Performance metrics: ' . json_encode($metrics), 'debug');
    }
}

// Initialize the plugin
function heatmap_analytics_init() {
    global $heatmap_core;
    
    // Initialize core plugin
    $heatmap_core = new HeatmapAnalyticsCore();
}

add_action('init', 'heatmap_analytics_init');

// Debug footer output - only on frontend for admins with debug enabled
add_action('wp_footer', function() {
    if (current_user_can('manage_options') && defined('WP_DEBUG') && WP_DEBUG && !is_admin() && !defined('REST_REQUEST')) {
        $options = get_option('heatmap_analytics_options', array());
        echo '<!-- Heatmap Analytics Debug: Plugin loaded v' . HEATMAP_ANALYTICS_VERSION . ' -->';
        echo '<!-- Tracking ID: ' . (isset($options['tracking_id']) ? esc_html($options['tracking_id']) : 'Not set') . ' -->';
        echo '<!-- GDPR Enabled: ' . (isset($options['gdpr_enabled']) && $options['gdpr_enabled'] ? 'Yes' : 'No') . ' -->';
        echo '<!-- Cookie Banner Enabled: ' . (isset($options['cookie_banner_enabled']) && $options['cookie_banner_enabled'] ? 'Yes' : 'No') . ' -->';
        echo '<!-- GA Integration: ' . (isset($options['ga_integration_enabled']) && $options['ga_integration_enabled'] ? 'Yes' : 'No') . ' -->';
        echo '<!-- Plugin Scanner: ' . (isset($options['plugin_scanner_enabled']) && $options['plugin_scanner_enabled'] ? 'Yes' : 'No') . ' -->';
        
        if (isset($_COOKIE['heatmap_consent'])) {
            echo '<!-- Consent cookie exists: ' . esc_html($_COOKIE['heatmap_consent']) . ' -->';
        } else {
            echo '<!-- No consent cookie found - Banner should show if enabled -->';
        }
    }
}, 100);

// Add admin notice for missing tracking ID
add_action('admin_notices', function() {
    $options = get_option('heatmap_analytics_options', array());
    
    if (empty($options['tracking_id']) && current_user_can('manage_options')) {
        $settings_url = admin_url('options-general.php?page=heatmap-analytics');
        ?>
        <div class="notice notice-warning is-dismissible">
            <p><strong>Heatmap Analytics Pro:</strong> Du behöver konfigurera ditt tracking ID. 
            <a href="<?php echo esc_url($settings_url); ?>">Gå till inställningar</a></p>
        </div>
        <?php
    }
});

// AJAX endpoint for getting site ID (no permission required - functional data)
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

// AJAX endpoint for checking plugin status
add_action('wp_ajax_heatmap_check_status', function() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
        return;
    }
    
    global $heatmap_core;
    $options = $heatmap_core->get_options();
    
    $status = array(
        'version' => HEATMAP_ANALYTICS_VERSION,
        'tracking_enabled' => isset($options['tracking_enabled']) && $options['tracking_enabled'],
        'tracking_id_set' => !empty($options['tracking_id']),
        'gdpr_enabled' => isset($options['gdpr_enabled']) && $options['gdpr_enabled'],
        'managers_loaded' => array()
    );
    
    // Check which managers are loaded
    $manager_types = array('security', 'cookie', 'supabase', 'banner', 'tracking', 
                          'admin', 'retention', 'pixels', 'performance', 'errors', 
                          'ga_integration', 'plugin_scanner');
    
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
    delete_option('heatmap_analytics_site_id'); // Remove site ID option
    
    // Remove database tables
    global $wpdb;
    $table_name = $wpdb->prefix . 'heatmap_analytics_events';
    $wpdb->query("DROP TABLE IF EXISTS $table_name");
    
    // Clear all transients
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_heatmap_%'");
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_heatmap_%'");
    
    // Clear scheduled hooks
    wp_clear_scheduled_hook('heatmap_gdpr_cleanup');
    wp_clear_scheduled_hook('heatmap_analytics_daily_cleanup');
    wp_clear_scheduled_hook('heatmap_analytics_hourly');
    wp_clear_scheduled_hook('heatmap_analytics_sync_events');
}

// Include GDPR consent handler
require_once HEATMAP_ANALYTICS_PLUGIN_DIR . 'includes/class-gdpr-consent-handler.php';

?>
