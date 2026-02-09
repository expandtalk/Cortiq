<?php
/**
 * Google Site Kit Integration
 * 
 * Detects and integrates with Google Site Kit plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsSiteKitIntegration {
    
    private $options;
    private $supabase_url;
    private $tracking_id;
    
    public function __construct($options, $supabase_url, $tracking_id) {
        $this->options = $options;
        $this->supabase_url = $supabase_url;
        $this->tracking_id = $tracking_id;
        
        // Hooks för Site Kit integration - DELAYED to avoid activation conflicts
        add_action('plugins_loaded', array($this, 'delayed_init'), 20); // Later priority
        add_action('wp_ajax_heatmap_sync_sitekit', array($this, 'handle_sitekit_sync'));
        add_action('wp_ajax_nopriv_heatmap_sync_sitekit', array($this, 'handle_sitekit_sync'));
        
        // Schemalägg automatisk synkronisering - ONLY if not in activation
        if (!defined('WP_ACTIVATING') || !WP_ACTIVATING) {
            if (!wp_next_scheduled('heatmap_sitekit_auto_sync')) {
                wp_schedule_event(time(), 'hourly', 'heatmap_sitekit_auto_sync');
            }
            add_action('heatmap_sitekit_auto_sync', array($this, 'auto_sync_sitekit'));
        }
    }
    
    /**
     * Delayed initialization to avoid conflicts during plugin activation
     */
    public function delayed_init() {
        // Only run if Site Kit is fully loaded and we're not activating
        if (class_exists('Google\Site_Kit\Plugin') && !defined('WP_ACTIVATING')) {
            $this->detect_sitekit();
        }
    }
    
    /**
     * Detektera om Google Site Kit är installerat och aktivt
     */
    public function detect_sitekit() {
        // Safety checks to prevent conflicts
        if (defined('WP_ACTIVATING') && WP_ACTIVATING) {
            return false; // Don't run during plugin activation
        }
        
        if (!class_exists('Google\Site_Kit\Plugin')) {
            return false;
        }
        
        // Additional safety: ensure Site Kit is fully initialized
        if (!did_action('googlesitekit_init')) {
            // Site Kit not fully loaded yet, schedule for later
            add_action('googlesitekit_init', array($this, 'detect_sitekit'));
            return false;
        }
        
        $sitekit_active = true;
        
        // Hämta Site Kit-konfiguration
        $sitekit_settings = $this->get_sitekit_settings();
        
        if ($sitekit_settings && $sitekit_active) {
            // Registrera Site Kit som upptäckt
            update_option('heatmap_analytics_sitekit_detected', true);
            update_option('heatmap_analytics_sitekit_settings', $sitekit_settings);
            
            // Automatisk synkronisering om aktiverad
            if (isset($this->options['sitekit_auto_sync']) && $this->options['sitekit_auto_sync']) {
                $this->schedule_sync();
            }
        }
        
        return $sitekit_active;
    }
    
    /**
     * Hämta Site Kit-inställningar
     */
    private function get_sitekit_settings() {
        if (!class_exists('Google\Site_Kit\Core\Storage\Options')) {
            return false;
        }
        
        try {
            $analytics_settings = get_option('googlesitekit_analytics_settings', []);
            $search_console_settings = get_option('googlesitekit_search-console_settings', []);
            $pagespeed_settings = get_option('googlesitekit_pagespeed-insights_settings', []);
            $adsense_settings = get_option('googlesitekit_adsense_settings', []);
            
            return [
                'analytics' => [
                    'propertyId' => $analytics_settings['propertyID'] ?? null,
                    'measurementId' => $analytics_settings['measurementID'] ?? null,
                    'webDataStreamID' => $analytics_settings['webDataStreamID'] ?? null,
                    'connected' => !empty($analytics_settings['propertyID'])
                ],
                'searchConsole' => [
                    'propertyId' => $search_console_settings['propertyID'] ?? null,
                    'connected' => !empty($search_console_settings['propertyID'])
                ],
                'pageSpeed' => [
                    'connected' => !empty($pagespeed_settings)
                ],
                'adsense' => [
                    'clientId' => $adsense_settings['clientID'] ?? null,
                    'connected' => !empty($adsense_settings['clientID'])
                ],
                'site_url' => home_url(),
                'site_id' => $this->get_or_create_site_id(),
                'api_key' => $this->get_google_api_key()
            ];
        } catch (Exception $e) {
            error_log('Heatmap Analytics: Error getting Site Kit settings - ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Hämta eller skapa site ID för Supabase
     */
    private function get_or_create_site_id() {
        $site_id = get_option('heatmap_analytics_site_id');
        
        if (!$site_id) {
            // Skapa nytt site ID baserat på domain
            $domain = parse_url(home_url(), PHP_URL_HOST);
            $site_id = wp_generate_uuid4();
            
            // Registrera site i Supabase
            $this->register_site_in_supabase($site_id, $domain);
            
            update_option('heatmap_analytics_site_id', $site_id);
        }
        
        return $site_id;
    }
    
    /**
     * Registrera site i Supabase-databasen
     */
    private function register_site_in_supabase($site_id, $domain) {
        $site_data = [
            'id' => $site_id,
            'domain' => $domain,
            'name' => get_bloginfo('name'),
            'tracking_id' => $this->tracking_id,
            'wordpress_integration' => true,
            'sitekit_detected' => true,
            'created_at' => current_time('mysql', true)
        ];
        
        // Skicka till Supabase via REST API
        $response = wp_remote_post($this->supabase_url . '/rest/v1/sites', [
            'headers' => [
                'Content-Type' => 'application/json',
                'apikey' => $this->options['supabase_anon_key'] ?? '',
                'Authorization' => 'Bearer ' . ($this->options['supabase_anon_key'] ?? '')
            ],
            'body' => json_encode($site_data)
        ]);
        
        if (is_wp_error($response)) {
            error_log('Heatmap Analytics: Failed to register site in Supabase - ' . $response->get_error_message());
        }
    }
    
    /**
     * Hämta Google API-nyckel (kan komma från Site Kit eller separat konfiguration)
     */
    private function get_google_api_key() {
        // Först försök hämta från Site Kit
        if (class_exists('Google\Site_Kit\Core\Authentication\Authentication')) {
            // Site Kit använder OAuth, inte API-nyckel
            // Vi behöver en separat API-nyckel för server-to-server calls
        }
        
        // Fallback till separat konfiguration
        return $this->options['google_api_key'] ?? '';
    }
    
    /**
     * Hantera AJAX-förfrågan för Site Kit-synkronisering
     */
    public function handle_sitekit_sync() {
        // Kontrollera nonce för säkerhet
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heatmap_sitekit_sync')) {
            wp_die('Security check failed');
        }
        
        $sync_type = sanitize_text_field($_POST['sync_type'] ?? 'full');
        $result = $this->sync_with_supabase($sync_type);
        
        wp_send_json($result);
    }
    
    /**
     * Synkronisera Site Kit-data med Supabase
     */
    public function sync_with_supabase($sync_type = 'full') {
        $sitekit_settings = get_option('heatmap_analytics_sitekit_settings');
        
        if (!$sitekit_settings || empty($sitekit_settings['api_key'])) {
            return [
                'success' => false,
                'message' => 'Site Kit settings not found or missing API key'
            ];
        }
        
        $sync_data = [
            'siteId' => $sitekit_settings['site_id'],
            'siteUrl' => $sitekit_settings['site_url'],
            'googleApiKey' => $sitekit_settings['api_key'],
            'siteKitSettings' => $sitekit_settings,
            'syncType' => $sync_type
        ];
        
        // Skicka till Supabase Edge Function
        $response = wp_remote_post($this->supabase_url . '/functions/v1/sitekit-sync', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . ($this->options['supabase_anon_key'] ?? '')
            ],
            'body' => json_encode($sync_data),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => 'Sync failed: ' . $response->get_error_message()
            ];
        }
        
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);
        
        if ($result && $result['success']) {
            // Uppdatera lokal cache
            update_option('heatmap_analytics_last_sitekit_sync', current_time('mysql'));
            update_option('heatmap_analytics_sitekit_data', $result['syncedData']);
        }
        
        return $result;
    }
    
    /**
     * Automatisk synkronisering (körs via cron)
     */
    public function auto_sync_sitekit() {
        if (!isset($this->options['sitekit_auto_sync']) || !$this->options['sitekit_auto_sync']) {
            return;
        }
        
        $last_sync = get_option('heatmap_analytics_last_sitekit_sync');
        $sync_interval = $this->options['sitekit_sync_interval'] ?? 3600; // 1 timme default
        
        if ($last_sync && (time() - strtotime($last_sync)) < $sync_interval) {
            return; // För tidigt för ny synkronisering
        }
        
        $this->sync_with_supabase('full');
    }
    
    /**
     * Schemalägg synkronisering
     */
    private function schedule_sync() {
        if (!wp_next_scheduled('heatmap_sitekit_scheduled_sync')) {
            $interval = $this->options['sitekit_sync_interval'] ?? 3600;
            wp_schedule_event(time() + $interval, 'hourly', 'heatmap_sitekit_scheduled_sync');
        }
    }
    
    /**
     * Hämta senaste synkroniserade data
     */
    public function get_synced_data() {
        return get_option('heatmap_analytics_sitekit_data', []);
    }
    
    /**
     * Kontrollera om Site Kit är konfigurerat
     */
    public function is_sitekit_configured() {
        $settings = get_option('heatmap_analytics_sitekit_settings');
        return $settings && !empty($settings['analytics']['connected']);
    }
    
    /**
     * Renropa på avaktivering
     */
    public function deactivate() {
        wp_clear_scheduled_hook('heatmap_sitekit_auto_sync');
        wp_clear_scheduled_hook('heatmap_sitekit_scheduled_sync');
    }
}
?>