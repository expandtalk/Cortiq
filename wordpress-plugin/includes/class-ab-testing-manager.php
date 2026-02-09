<?php
/**
 * A/B Testing Manager for WordPress Integration
 * 
 * Handles A/B test creation, assignment, and result tracking
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsABTestingManager {
    
    private $options;
    private $tracking_id;
    private $supabase_url;
    
    public function __construct($options, $tracking_id) {
        $this->options = $options;
        $this->tracking_id = $tracking_id;
        $this->supabase_url = $options['supabase_url'] ?? 'https://cxmkdtgfocgbfizawlwa.supabase.co';
        
        add_action('wp_enqueue_scripts', array($this, 'enqueue_ab_testing_scripts'));
        add_action('wp_ajax_create_ab_test', array($this, 'create_ab_test'));
        add_action('wp_ajax_get_ab_test_assignment', array($this, 'get_ab_test_assignment'));
        add_action('wp_ajax_track_ab_conversion', array($this, 'track_ab_conversion'));
        add_action('wp_ajax_nopriv_get_ab_test_assignment', array($this, 'get_ab_test_assignment'));
        add_action('wp_ajax_nopriv_track_ab_conversion', array($this, 'track_ab_conversion'));
    }
    
    /**
     * Enqueue A/B testing scripts
     */
    public function enqueue_ab_testing_scripts() {
        if (!$this->should_load_ab_testing()) {
            return;
        }
        
        wp_enqueue_script('heatmap-ab-testing', '', array('jquery'), '1.0.0', true);
        wp_add_inline_script('heatmap-ab-testing', $this->get_ab_testing_script());
        
        wp_localize_script('heatmap-ab-testing', 'heatmapAB', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heatmap_ab_testing'),
            'tracking_id' => $this->tracking_id
        ));
    }
    
    /**
     * Check if A/B testing should be loaded
     */
    private function should_load_ab_testing() {
        // Don't load for admin users
        if (current_user_can('manage_options')) {
            return false;
        }
        
        // Check if A/B testing is enabled
        if (empty($this->options['ab_testing_enabled'])) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get A/B testing JavaScript
     */
    private function get_ab_testing_script() {
        return "
        (function($) {
            var heatmapABTesting = {
                sessionId: null,
                activeTests: [],
                
                init: function() {
                    this.sessionId = this.getSessionId();
                    this.loadActiveTests();
                },
                
                getSessionId: function() {
                    var sessionId = localStorage.getItem('heatmap_session_id');
                    if (!sessionId) {
                        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        localStorage.setItem('heatmap_session_id', sessionId);
                    }
                    return sessionId;
                },
                
                loadActiveTests: function() {
                    var self = this;
                    $.post(heatmapAB.ajax_url, {
                        action: 'get_ab_test_assignment',
                        nonce: heatmapAB.nonce,
                        session_id: this.sessionId,
                        page_url: window.location.href
                    }, function(response) {
                        if (response.success && response.data.tests) {
                            self.activeTests = response.data.tests;
                            self.applyTestVariations();
                        }
                    });
                },
                
                applyTestVariations: function() {
                    this.activeTests.forEach(function(test) {
                        if (test.variant_config) {
                            heatmapABTesting.applyVariantConfig(test.variant_config);
                        }
                    });
                },
                
                applyVariantConfig: function(config) {
                    // Apply CSS changes
                    if (config.css) {
                        var style = document.createElement('style');
                        style.textContent = config.css;
                        document.head.appendChild(style);
                    }
                    
                    // Apply content changes
                    if (config.content) {
                        for (var selector in config.content) {
                            $(selector).html(config.content[selector]);
                        }
                    }
                    
                    // Apply attribute changes
                    if (config.attributes) {
                        for (var selector in config.attributes) {
                            var attrs = config.attributes[selector];
                            for (var attr in attrs) {
                                $(selector).attr(attr, attrs[attr]);
                            }
                        }
                    }
                },
                
                trackConversion: function(goalType, value) {
                    if (this.activeTests.length === 0) {
                        return;
                    }
                    
                    $.post(heatmapAB.ajax_url, {
                        action: 'track_ab_conversion',
                        nonce: heatmapAB.nonce,
                        session_id: this.sessionId,
                        goal_type: goalType,
                        conversion_value: value || 0
                    });
                }
            };
            
            // Initialize when DOM is ready
            $(document).ready(function() {
                heatmapABTesting.init();
                
                // Track conversions on common events
                $(document).on('submit', 'form', function() {
                    heatmapABTesting.trackConversion('form_submission');
                });
                
                $(document).on('click', 'a[href*=\"checkout\"], a[href*=\"buy\"], .buy-button, .purchase-button', function() {
                    heatmapABTesting.trackConversion('purchase_intent');
                });
            });
            
            // Expose globally for manual tracking
            window.heatmapABTesting = heatmapABTesting;
            
        })(jQuery);
        ";
    }
    
    /**
     * Create A/B test via AJAX
     */
    public function create_ab_test() {
        if (!wp_verify_nonce($_POST['nonce'], 'heatmap_ab_testing')) {
            wp_die('Security check failed');
        }
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        $test_data = array(
            'site_id' => $this->get_site_id(),
            'test_name' => sanitize_text_field($_POST['test_name']),
            'test_description' => sanitize_textarea_field($_POST['test_description']),
            'test_type' => sanitize_text_field($_POST['test_type']),
            'conversion_goal' => sanitize_text_field($_POST['conversion_goal']),
            'conversion_metric' => sanitize_text_field($_POST['conversion_metric']),
            'confidence_level' => intval($_POST['confidence_level']),
            'traffic_allocation' => json_encode($_POST['traffic_allocation']),
            'test_status' => 'draft'
        );
        
        $result = $this->call_supabase_function('ab-test-calculator', $test_data);
        
        wp_send_json($result);
    }
    
    /**
     * Get A/B test assignment for user
     */
    public function get_ab_test_assignment() {
        $session_id = sanitize_text_field($_POST['session_id']);
        $page_url = esc_url_raw($_POST['page_url']);
        
        $assignment_data = array(
            'site_id' => $this->get_site_id(),
            'session_id' => $session_id,
            'page_url' => $page_url,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        );
        
        $result = $this->call_supabase_function('ab-test-assignment', $assignment_data);
        
        wp_send_json($result);
    }
    
    /**
     * Track A/B test conversion
     */
    public function track_ab_conversion() {
        $session_id = sanitize_text_field($_POST['session_id']);
        $goal_type = sanitize_text_field($_POST['goal_type']);
        $conversion_value = floatval($_POST['conversion_value']);
        
        $conversion_data = array(
            'site_id' => $this->get_site_id(),
            'session_id' => $session_id,
            'goal_type' => $goal_type,
            'conversion_value' => $conversion_value,
            'timestamp' => current_time('mysql', true)
        );
        
        $result = $this->call_supabase_function('ab-test-conversion', $conversion_data);
        
        wp_send_json($result);
    }
    
    /**
     * Get site ID from options
     */
    private function get_site_id() {
        $site_id = get_option('heatmap_analytics_site_id');
        if (!$site_id) {
            $site_id = wp_generate_uuid4();
            update_option('heatmap_analytics_site_id', $site_id);
        }
        return $site_id;
    }
    
    /**
     * Call Supabase Edge Function
     */
    private function call_supabase_function($function_name, $data) {
        $response = wp_remote_post($this->supabase_url . '/functions/v1/' . $function_name, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->options['supabase_anon_key']
            ),
            'body' => json_encode($data),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        return json_decode($body, true);
    }
    
    /**
     * Update options
     */
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}