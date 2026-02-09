<?php
/**
 * Data retention management for GDPR compliance
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsDataRetention {
    
    private $options;
    
    public function __construct($options) {
        $this->options = $options;
        
        // Schedule daily cleanup
        if (!wp_next_scheduled('heatmap_analytics_daily_cleanup')) {
            wp_schedule_event(time(), 'daily', 'heatmap_analytics_daily_cleanup');
        }
        
        add_action('heatmap_analytics_daily_cleanup', array($this, 'run_cleanup'));
        add_action('admin_notices', array($this, 'show_retention_notice'));
    }
    
    public function run_cleanup() {
        $retention_days = isset($this->options['data_retention_days']) ? intval($this->options['data_retention_days']) : 90;
        
        // Call Supabase edge function for data cleanup
        $result = $this->call_retention_function($retention_days);
        
        // Log cleanup activity
        error_log('Heatmap Analytics: Data retention cleanup executed. Retention period: ' . $retention_days . ' days. Result: ' . ($result ? 'Success' : 'Failed'));
        
        // Update last cleanup timestamp
        update_option('heatmap_analytics_last_cleanup', current_time('mysql'));
    }
    
    private function call_retention_function($retention_days) {
        $endpoint = 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/data-retention';
        
        $response = wp_remote_post($endpoint, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . get_option('heatmap_analytics_api_key', ''),
            ),
            'body' => json_encode(array(
                'retention_days' => $retention_days,
                'site_url' => get_site_url()
            )),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            error_log('Heatmap Analytics: Data retention API error: ' . $response->get_error_message());
            return false;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            error_log('Heatmap Analytics: Data retention API returned code: ' . $response_code);
            return false;
        }
        
        return true;
    }
    
    public function show_retention_notice() {
        $screen = get_current_screen();
        if ($screen && $screen->id !== 'settings_page_heatmap-analytics') {
            return;
        }
        
        $last_cleanup = get_option('heatmap_analytics_last_cleanup');
        $retention_days = isset($this->options['data_retention_days']) ? intval($this->options['data_retention_days']) : 90;
        
        ?>
        <div class="notice notice-info">
            <p>
                <strong>GDPR Data Retention:</strong> 
                Data äldre än <?php echo $retention_days; ?> dagar rensas automatiskt. 
                <?php if ($last_cleanup): ?>
                    Senaste rensning: <?php echo $last_cleanup; ?>
                <?php else: ?>
                    Ingen rensning utförd ännu.
                <?php endif; ?>
            </p>
        </div>
        <?php
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}
?>
