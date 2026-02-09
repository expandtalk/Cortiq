<?php
/**
 * Enhanced Supabase Sync Manager with Caching, Retry Logic & Error Handling
 * Version: 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsSupabaseSync {
    
    private $supabase_url = '';
    private $supabase_anon_key = '';
    
    private $cache_group = 'heatmap_analytics';
    private $cache_ttl = 3600; // 1 hour
    private $max_retries = 3;
    private $retry_delay = 1000; // milliseconds
    
    public function __construct() {
        // Schedule sync cron job
        add_action('heatmap_analytics_sync_events', array($this, 'sync_pending_events'));
        
        // AJAX handlers for real-time sync
        add_action('wp_ajax_heatmap_sync_now', array($this, 'ajax_sync_now'));
        add_action('wp_ajax_nopriv_heatmap_sync_now', array($this, 'ajax_sync_now'));
    }
    
    /**
     * Get site data by tracking ID with caching
     */
    public function get_site_by_tracking_id($tracking_id) {
        if (empty($tracking_id)) {
            return false;
        }
        
        // Check cache first
        $cache_key = 'site_' . md5($tracking_id);
        $cached_data = wp_cache_get($cache_key, $this->cache_group);
        
        if ($cached_data !== false) {
            heatmap_log('Site data retrieved from cache', 'debug');
            return $cached_data;
        }
        
        // Make API request with retry logic
        $response = $this->make_request(
            '/rest/v1/sites',
            'GET',
            array('tracking_id' => 'eq.' . $tracking_id)
        );
        
        if ($response && isset($response['data']) && !empty($response['data'])) {
            $site_data = $response['data'][0];
            
            // Cache the result
            wp_cache_set($cache_key, $site_data, $this->cache_group, $this->cache_ttl);
            
            return $site_data;
        }
        
        return false;
    }
    
    /**
     * Create or update site configuration
     */
    public function upsert_site($site_data) {
        $tracking_id = $site_data['tracking_id'];
        
        // Clear cache for this site
        $this->clear_site_cache($tracking_id);
        
        $response = $this->make_request(
            '/rest/v1/sites',
            'POST',
            null,
            $site_data,
            array('Prefer' => 'resolution=merge-duplicates')
        );
        
        if ($response && isset($response['data'])) {
            heatmap_log('Site configuration updated successfully', 'info');
            return $response['data'];
        }
        
        return false;
    }
    
    /**
     * Sync cookie detection data
     */
    public function sync_detected_cookies($tracking_id, $cookies_data) {
        $site = $this->get_site_by_tracking_id($tracking_id);
        
        if (!$site || !isset($site['id'])) {
            heatmap_log('Failed to get site for cookie sync', 'error');
            return false;
        }
        
        $payload = array(
            'site_id' => $site['id'],
            'cookies' => $cookies_data['cookies'],
            'scripts' => $cookies_data['scripts'],
            'detected_at' => current_time('c'),
            'source' => 'wordpress_plugin',
            'plugin_version' => HEATMAP_ANALYTICS_VERSION
        );
        
        $response = $this->make_request(
            '/rest/v1/detected_cookies',
            'POST',
            null,
            $payload
        );
        
        return $response !== false;
    }
    
    /**
     * Sync pending events from local database
     */
    public function sync_navigation_data($navigation_data) {
        try {
            $site_id = $this->get_site_id();
            
            if (!$site_id) {
                heatmap_log('No site ID available for navigation sync', 'error');
                return false;
            }
            
            // Prepare data for Supabase
            $supabase_data = array();
            foreach ($navigation_data as $item) {
                $supabase_data[] = array(
                    'site_id' => $site_id,
                    'menu_item_id' => $item['menu_item_id'],
                    'menu_title' => $item['menu_title'],
                    'menu_url' => $item['menu_url'],
                    'menu_order' => $item['menu_order'],
                    'parent_id' => $item['parent_id'],
                    'css_classes' => $item['css_classes'],
                    'menu_location' => $item['menu_location'],
                    'is_active' => $item['is_active']
                );
            }
            
            // Send to Supabase
            $response = wp_remote_post($this->base_url . '/navigation-sync', array(
                'headers' => $this->get_headers(),
                'body' => json_encode(array(
                    'site_id' => $site_id,
                    'navigation_data' => $supabase_data
                )),
                'timeout' => 30
            ));
            
            if (is_wp_error($response)) {
                heatmap_log('Navigation sync failed: ' . $response->get_error_message(), 'error');
                return false;
            }
            
            $response_code = wp_remote_retrieve_response_code($response);
            if ($response_code === 200) {
                heatmap_log('Navigation data synced successfully', 'info');
                return true;
            } else {
                heatmap_log('Navigation sync failed with code: ' . $response_code, 'error');
                return false;
            }
            
        } catch (Exception $e) {
            heatmap_log('Navigation sync error: ' . $e->getMessage(), 'error');
            return false;
        }
    }
    
    public function sync_pending_events() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'heatmap_analytics_events';
        
        // Get unsynced events
        $events = $wpdb->get_results(
            "SELECT * FROM $table_name WHERE synced = 0 ORDER BY created_at ASC LIMIT 100",
            ARRAY_A
        );
        
        if (empty($events)) {
            return;
        }
        
        heatmap_log('Starting sync of ' . count($events) . ' events', 'info');
        
        $success_count = 0;
        $error_count = 0;
        
        // Group events by tracking_id for batch processing
        $grouped_events = array();
        foreach ($events as $event) {
            $tracking_id = $event['tracking_id'];
            if (!isset($grouped_events[$tracking_id])) {
                $grouped_events[$tracking_id] = array();
            }
            $grouped_events[$tracking_id][] = $event;
        }
        
        // Process each group
        foreach ($grouped_events as $tracking_id => $group_events) {
            $batch_data = array_map(function($event) {
                return array(
                    'tracking_id' => $event['tracking_id'],
                    'session_id' => $event['session_id'],
                    'event_type' => $event['event_type'],
                    'event_data' => json_decode($event['event_data'], true),
                    'user_ip' => $event['user_ip'],
                    'user_agent' => $event['user_agent'],
                    'created_at' => $event['created_at']
                );
            }, $group_events);
            
            // Send batch to Supabase
            $response = $this->make_request(
                '/rest/v1/rpc/process_batch_events',
                'POST',
                null,
                array('events' => $batch_data)
            );
            
            if ($response && isset($response['data']['success']) && $response['data']['success']) {
                // Mark events as synced
                $event_ids = wp_list_pluck($group_events, 'id');
                $ids_string = implode(',', array_map('intval', $event_ids));
                
                $wpdb->query(
                    "UPDATE $table_name SET synced = 1 WHERE id IN ($ids_string)"
                );
                
                $success_count += count($group_events);
            } else {
                $error_count += count($group_events);
                heatmap_log('Failed to sync batch for tracking_id: ' . $tracking_id, 'error');
            }
        }
        
        heatmap_log("Sync completed. Success: $success_count, Errors: $error_count", 'info');
        
        // Clean up old synced events
        $this->cleanup_synced_events();
    }
    
    /**
     * Make HTTP request to Supabase with retry logic
     */
    private function make_request($endpoint, $method = 'GET', $query_params = null, $body = null, $additional_headers = array()) {
        $url = $this->supabase_url . $endpoint;
        
        if ($query_params) {
            $url .= '?' . http_build_query($query_params);
        }
        
        $headers = array_merge(array(
            'Authorization' => 'Bearer ' . $this->supabase_anon_key,
            'apikey' => $this->supabase_anon_key,
            'Content-Type' => 'application/json'
        ), $additional_headers);
        
        $args = array(
            'method' => $method,
            'headers' => $headers,
            'timeout' => 30,
            'sslverify' => true
        );
        
        if ($body) {
            $args['body'] = json_encode($body);
        }
        
        // Retry logic
        for ($i = 0; $i <= $this->max_retries; $i++) {
            $response = wp_remote_request($url, $args);
            
            if (!is_wp_error($response)) {
                $response_code = wp_remote_retrieve_response_code($response);
                $response_body = wp_remote_retrieve_body($response);
                
                if ($response_code >= 200 && $response_code < 300) {
                    return array(
                        'data' => json_decode($response_body, true),
                        'status' => $response_code
                    );
                } elseif ($response_code >= 400 && $response_code < 500) {
                    // Client error, don't retry
                    heatmap_log("Supabase API client error ($response_code): $response_body", 'error');
                    break;
                }
            }
            
            if ($i < $this->max_retries) {
                // Wait before retry with exponential backoff
                usleep($this->retry_delay * pow(2, $i) * 1000);
                heatmap_log("Retrying Supabase request (attempt " . ($i + 2) . ")", 'warning');
            }
        }
        
        // Log final error
        if (is_wp_error($response)) {
            heatmap_log('Supabase API error: ' . $response->get_error_message(), 'error');
        }
        
        return false;
    }
    
    /**
     * Test connection to Supabase
     */
    public function test_connection() {
        $response = $this->make_request('/rest/v1/', 'GET');
        return $response !== false;
    }
    
    /**
     * Get sync status and statistics
     */
    public function get_sync_status() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'heatmap_analytics_events';
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return array(
                'status' => 'error',
                'message' => 'Events table not found'
            );
        }
        
        $total_events = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
        $unsynced_events = $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE synced = 0");
        $oldest_unsynced = $wpdb->get_var("SELECT MIN(created_at) FROM $table_name WHERE synced = 0");
        
        // Test Supabase connection
        $connection_status = $this->test_connection();
        
        return array(
            'status' => $connection_status ? 'connected' : 'disconnected',
            'total_events' => intval($total_events),
            'unsynced_events' => intval($unsynced_events),
            'oldest_unsynced' => $oldest_unsynced,
            'last_sync' => get_option('heatmap_analytics_last_sync', 'Never'),
            'supabase_url' => $this->supabase_url
        );
    }
    
    /**
     * Clear cache for a specific site
     */
    private function clear_site_cache($tracking_id) {
        $cache_key = 'site_' . md5($tracking_id);
        wp_cache_delete($cache_key, $this->cache_group);
    }
    
    /**
     * Clean up old synced events
     */
    private function cleanup_synced_events() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'heatmap_analytics_events';
        
        // Delete synced events older than 7 days
        $wpdb->query(
            "DELETE FROM $table_name 
             WHERE synced = 1 
             AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)"
        );
        
        // Update last sync time
        update_option('heatmap_analytics_last_sync', current_time('mysql'));
    }
    
    /**
     * AJAX handler for manual sync
     */
    public function ajax_sync_now() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $this->sync_pending_events();
        $status = $this->get_sync_status();
        
        wp_send_json_success($status);
    }
    
    /**
     * Get analytics data from Supabase
     */
    public function get_analytics_data($tracking_id, $date_range = '7d') {
        $cache_key = 'analytics_' . md5($tracking_id . '_' . $date_range);
        $cached_data = wp_cache_get($cache_key, $this->cache_group);
        
        if ($cached_data !== false) {
            return $cached_data;
        }
        
        // Calculate date range
        $end_date = current_time('Y-m-d');
        switch ($date_range) {
            case '24h':
                $start_date = date('Y-m-d', strtotime('-1 day'));
                break;
            case '7d':
                $start_date = date('Y-m-d', strtotime('-7 days'));
                break;
            case '30d':
                $start_date = date('Y-m-d', strtotime('-30 days'));
                break;
            default:
                $start_date = date('Y-m-d', strtotime('-7 days'));
        }
        
        $response = $this->make_request(
            '/rest/v1/rpc/get_analytics_summary',
            'POST',
            null,
            array(
                'p_tracking_id' => $tracking_id,
                'p_start_date' => $start_date,
                'p_end_date' => $end_date
            )
        );
        
        if ($response && isset($response['data'])) {
            // Cache for 5 minutes for real-time data
            wp_cache_set($cache_key, $response['data'], $this->cache_group, 300);
            return $response['data'];
        }
        
        return null;
    }
}
