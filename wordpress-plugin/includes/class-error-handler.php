<?php
/**
 * Error Handler Class for Heatmap Analytics
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsErrorHandler {
    
    private $options;
    private $error_log_key = 'heatmap_analytics_errors';
    private $max_errors = 100;
    
    public function __construct($options) {
        $this->options = $options;
        
        if (isset($options['error_logging']) && $options['error_logging']) {
            add_action('wp_ajax_heatmap_log_error', array($this, 'handle_ajax_error'));
            add_action('wp_ajax_nopriv_heatmap_log_error', array($this, 'handle_ajax_error'));
        }
    }
    
    public function log_error($error_data) {
        if (!isset($this->options['error_logging']) || !$this->options['error_logging']) {
            return;
        }
        
        $errors = get_option($this->error_log_key, array());
        
        // Add timestamp
        $error_data['timestamp'] = current_time('mysql');
        $error_data['user_agent'] = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'Unknown';
        $error_data['url'] = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : 'Unknown';
        
        // Add to beginning of array
        array_unshift($errors, $error_data);
        
        // Keep only last N errors
        $errors = array_slice($errors, 0, $this->max_errors);
        
        update_option($this->error_log_key, $errors);
        
        // Also log to WordPress debug log if enabled
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('[Heatmap Analytics Error] ' . json_encode($error_data));
        }
    }
    
    public function handle_ajax_error() {
        $error_data = array(
            'message' => sanitize_text_field($_POST['message'] ?? ''),
            'source' => sanitize_text_field($_POST['source'] ?? ''),
            'line' => intval($_POST['line'] ?? 0),
            'column' => intval($_POST['column'] ?? 0),
            'stack' => sanitize_textarea_field($_POST['stack'] ?? '')
        );
        
        $this->log_error($error_data);
        
        wp_send_json_success();
    }
    
    public function get_recent_errors($limit = 10) {
        $errors = get_option($this->error_log_key, array());
        return array_slice($errors, 0, $limit);
    }
    
    public function clear_errors() {
        delete_option($this->error_log_key);
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}
