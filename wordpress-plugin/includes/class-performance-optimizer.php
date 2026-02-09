<?php
/**
 * Performance Optimizer for Heatmap Analytics
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsPerformanceOptimizer {
    
    private $options;
    private $event_queue = array();
    private $last_flush = 0;
    
    public function __construct($options) {
        $this->options = $options;
        
        if (isset($options['batch_events']) && $options['batch_events']) {
            add_action('wp_ajax_heatmap_batch_events', array($this, 'handle_batch_events'));
            add_action('wp_ajax_nopriv_heatmap_batch_events', array($this, 'handle_batch_events'));
            add_action('shutdown', array($this, 'flush_events'));
        }
    }
    
    public function queue_event($event) {
        $this->event_queue[] = $event;
        
        // Check if we should flush
        $batch_size = isset($this->options['batch_size']) ? $this->options['batch_size'] : 10;
        if (count($this->event_queue) >= $batch_size) {
            $this->flush_events();
        }
    }
    
    public function flush_events() {
        if (empty($this->event_queue)) {
            return;
        }
        
        // Store events in database for processing
        global $wpdb;
        $table_name = $wpdb->prefix . 'heatmap_analytics_events';
        
        foreach ($this->event_queue as $event) {
            $wpdb->insert(
                $table_name,
                array(
                    'tracking_id' => $event['tracking_id'],
                    'session_id' => $event['session_id'],
                    'event_type' => $event['event_type'],
                    'event_data' => json_encode($event['data']),
                    'user_ip' => $this->get_anonymized_ip(),
                    'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
                    'created_at' => current_time('mysql')
                ),
                array('%s', '%s', '%s', '%s', '%s', '%s', '%s')
            );
        }
        
        $this->event_queue = array();
        $this->last_flush = time();
        
        // Trigger background sync if needed
        if (isset($this->options['auto_sync']) && $this->options['auto_sync']) {
            wp_schedule_single_event(time() + 60, 'heatmap_analytics_sync_events');
        }
    }
    
    private function get_anonymized_ip() {
        if (!isset($this->options['anonymize_ip']) || !$this->options['anonymize_ip']) {
            return $_SERVER['REMOTE_ADDR'] ?? '';
        }
        
        $security = new HeatmapAnalyticsSecurityManager();
        return $security->anonymize_ip($security->get_user_ip());
    }
    
    public function handle_batch_events() {
        // Verify request
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'heatmap_batch_nonce')) {
            wp_send_json_error('Invalid nonce');
            return;
        }
        
        $events = json_decode(stripslashes($_POST['events'] ?? '[]'), true);
        if (!is_array($events)) {
            wp_send_json_error('Invalid events data');
            return;
        }
        
        foreach ($events as $event) {
            $this->queue_event($event);
        }
        
        $this->flush_events();
        
        wp_send_json_success(array(
            'processed' => count($events),
            'timestamp' => time()
        ));
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}
