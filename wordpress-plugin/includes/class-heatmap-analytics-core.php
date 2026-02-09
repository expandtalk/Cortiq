<?php
/**
 * Core Plugin Class
 * Version: 3.2.1
 */

if (!defined('ABSPATH')) {
    exit;
}

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
            'cookie_widget_enabled' => true,
            'data_retention_days' => 90,
            'anonymize_ip' => true,
            'track_mobile' => true,
            'performance_mode' => true,
            'sampling_rate' => 100,
            'excluded_roles' => array('administrator'),
            'ip_exclusion_enabled' => false,
            'excluded_ips' => '',
            'form_tracking_enabled' => false,
            'ga_integration_enabled' => false,
            'detect_external_consent' => true,
            'error_logging' => true,
            'batch_events' => true,
            'batch_size' => 10,
            'batch_interval' => 5000,
            'auto_detect_pixels' => true,
            'plugin_scanner_enabled' => true,
            'privacy_policy_url' => '/integritetspolicy' // NEW: pass to widget class
        );
    }

    public function load_dependencies() {
        $classes = array(
            'class-security-manager.php',
            'class-cookie-manager.php',
            'class-supabase-sync.php',
            'class-enhanced-cookie-banner.php',
            'class-tracking-manager.php',
            'class-admin-settings.php',
            'class-data-retention.php',
            'class-pixel-detector.php',
            'class-performance-optimizer.php',
            'class-error-handler.php',
            'class-google-analytics.php',
            'class-plugin-scanner.php',
            'class-cookie-widget.php'
        );

        foreach ($classes as $class_file) {
            $file_path = HEATMAP_ANALYTICS_PLUGIN_DIR . 'includes/' . $class_file;
            if (file_exists($file_path)) {
                require_once $file_path;
            } else {
                if (function_exists('heatmap_log')) {
                    heatmap_log("Missing required file: $class_file", 'error');
                }
            }
        }

        try {
            $this->managers['security'] = new HeatmapAnalyticsSecurityManager();
            $this->managers['cookie'] = new HeatmapAnalyticsCookieManager($this->options);
            $this->managers['supabase'] = new HeatmapAnalyticsSupabaseSync();

            if (!empty($this->options['cookie_banner_enabled'])) {
                $this->managers['banner'] = new HeatmapAnalyticsEnhancedCookieBanner($this->options, $this->tracking_id);
            }

            $this->managers['admin'] = new HeatmapAnalyticsAdminSettings($this->options, $this->managers['cookie'], $this->managers['security']);

            if (!empty($this->options['cookie_widget_enabled'])) {
                $this->managers['cookie_widget'] = new HeatmapAnalyticsCookieWidget($this->options);
            }

            $this->managers['tracking'] = new HeatmapAnalyticsTrackingManager($this->options, $this->tracking_id);
            $this->managers['pixels'] = new HeatmapAnalyticsPixelDetector($this->options);
            $this->managers['retention'] = new HeatmapAnalyticsDataRetention($this->options);
            $this->managers['performance'] = new HeatmapAnalyticsPerformanceOptimizer($this->options);
            $this->managers['errors'] = new HeatmapAnalyticsErrorHandler($this->options);

            if (!empty($this->options['ga_integration_enabled'])) {
                $this->managers['ga_integration'] = new HeatmapAnalyticsGoogleAnalytics($this->options);
            }

            if (!empty($this->options['plugin_scanner_enabled'])) {
                $this->managers['plugin_scanner'] = new HeatmapAnalyticsPluginScanner($this->options);
            }

            if (function_exists('heatmap_log')) {
                heatmap_log('All managers initialized successfully', 'info');
            }
        } catch (Exception $e) {
            if (function_exists('heatmap_log')) {
                heatmap_log('Failed to initialize managers: ' . $e->getMessage(), 'error');
            }
        }
    }

    private function init_hooks() {
        register_activation_hook(HEATMAP_ANALYTICS_PLUGIN_FILE, array($this, 'activate'));
        register_deactivation_hook(HEATMAP_ANALYTICS_PLUGIN_FILE, array($this, 'deactivate'));

        if (!empty($this->options['performance_mode'])) {
            add_action('shutdown', array($this, 'log_performance_metrics'));
        }

        add_action('heatmap_analytics_hourly', array($this, 'hourly_tasks'));
    }

    public function activate() {
        $existing_options = get_option('heatmap_analytics_options', array());
        $default_options = $this->get_default_options();
        $merged_options = wp_parse_args($existing_options, $default_options);
        update_option('heatmap_analytics_options', $merged_options);
        $this->create_tables();

        if (!wp_next_scheduled('heatmap_analytics_hourly')) {
            wp_schedule_event(time(), 'hourly', 'heatmap_analytics_hourly');
        }
        if (!wp_next_scheduled('heatmap_gdpr_cleanup')) {
            wp_schedule_event(time(), 'daily', 'heatmap_gdpr_cleanup');
        }
        if (!wp_next_scheduled('heatmap_analytics_daily_cleanup')) {
            wp_schedule_event(time(), 'daily', 'heatmap_analytics_daily_cleanup');
        }

        if (function_exists('heatmap_log')) {
            heatmap_log('Plugin activated successfully', 'info');
        }
    }

    public function deactivate() {
        wp_clear_scheduled_hook('heatmap_gdpr_cleanup');
        wp_clear_scheduled_hook('heatmap_analytics_daily_cleanup');
        wp_clear_scheduled_hook('heatmap_analytics_hourly');
        $this->clear_all_cache();

        if (function_exists('heatmap_log')) {
            heatmap_log('Plugin deactivated', 'info');
        }
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

        if (function_exists('heatmap_log')) {
            heatmap_log('Database tables created/updated', 'info');
        }
    }

    public function hourly_tasks() {
        if (isset($this->managers['supabase'])) {
            $this->managers['supabase']->sync_pending_events();
        }

        if (isset($this->managers['errors'])) {
            $errors = $this->managers['errors']->get_recent_errors(200);
            if (count($errors) > 100) {
                $this->managers['errors']->clear_errors();
                foreach (array_slice($errors, 0, 100) as $error) {
                    $this->managers['errors']->log_error($error);
                }
            }
        }

        if (function_exists('heatmap_log')) {
            heatmap_log('Hourly tasks completed', 'info');
        }
    }

    private function clear_all_cache() {
        global $wpdb;

        if (defined('HEATMAP_ANALYTICS_CACHE_KEY')) {
            $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_" . HEATMAP_ANALYTICS_CACHE_KEY . "%'");
            $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_" . HEATMAP_ANALYTICS_CACHE_KEY . "%'");
        }

        if (function_exists('heatmap_log')) {
            heatmap_log('Cache cleared', 'info');
        }
    }

    public function log_performance_metrics() {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        if (function_exists('heatmap_log')) {
            $metrics = array(
                'memory_peak' => memory_get_peak_usage(true) / 1024 / 1024 . ' MB',
                'execution_time' => (microtime(true) - $_SERVER["REQUEST_TIME_FLOAT"]) . ' seconds',
                'queries' => get_num_queries(),
                'managers_loaded' => count($this->managers)
            );

            heatmap_log('Performance metrics: ' . json_encode($metrics), 'debug');
        }
    }

    public function get_options() {
        return $this->options;
    }

    public function get_manager($name) {
        return isset($this->managers[$name]) ? $this->managers[$name] : null;
    }

    public function update_options($new_options) {
        $this->options = $new_options;
        update_option('heatmap_analytics_options', $new_options);
        $this->tracking_id = isset($new_options['tracking_id']) ? $new_options['tracking_id'] : '';

        foreach ($this->managers as $manager) {
            if (method_exists($manager, 'update_options')) {
                $manager->update_options($new_options);
            }
        }

        if (isset($this->managers['tracking'])) {
            $this->managers['tracking']->update_options($new_options, $this->tracking_id);
        }

        if (isset($this->managers['banner'])) {
            $this->managers['banner'] = new HeatmapAnalyticsEnhancedCookieBanner($new_options, $this->tracking_id);
        }

        $this->clear_all_cache();

        if (function_exists('heatmap_log')) {
            heatmap_log('Options updated', 'info');
        }
    }

    public function get_tracking_id() {
        return $this->tracking_id;
    }

    public function is_tracking_enabled() {
        return isset($this->options['tracking_enabled']) && $this->options['tracking_enabled'] && !empty($this->tracking_id);
    }

    public function get_all_managers() {
        return $this->managers;
    }
}
