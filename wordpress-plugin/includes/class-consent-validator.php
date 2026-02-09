<?php
/**
 * Consent Validation Manager
 * 
 * Validates and tracks GDPR consent for enhanced compliance
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsConsentValidator {
    
    private $options;
    private $tracking_id;
    private $supabase_url;
    
    public function __construct($options, $tracking_id) {
        $this->options = $options;
        $this->tracking_id = $tracking_id;
        $this->supabase_url = $options['supabase_url'] ?? 'https://cxmkdtgfocgbfizawlwa.supabase.co';
        
        add_action('wp_enqueue_scripts', array($this, 'enqueue_consent_validation_scripts'));
        add_action('wp_ajax_validate_consent', array($this, 'validate_consent'));
        add_action('wp_ajax_nopriv_validate_consent', array($this, 'validate_consent'));
        add_action('wp_ajax_log_blocked_call', array($this, 'log_blocked_call'));
        add_action('wp_ajax_nopriv_log_blocked_call', array($this, 'log_blocked_call'));
    }
    
    /**
     * Enqueue consent validation scripts
     */
    public function enqueue_consent_validation_scripts() {
        if (!$this->should_load_consent_validation()) {
            return;
        }
        
        wp_enqueue_script('heatmap-consent-validator', '', array('jquery'), '1.0.0', true);
        wp_add_inline_script('heatmap-consent-validator', $this->get_consent_validation_script());
        
        wp_localize_script('heatmap-consent-validator', 'heatmapConsent', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heatmap_consent_validation'),
            'tracking_id' => $this->tracking_id,
            'site_id' => $this->get_site_id()
        ));
    }
    
    /**
     * Check if consent validation should be loaded
     */
    private function should_load_consent_validation() {
        return isset($this->options['gdpr_enabled']) && $this->options['gdpr_enabled'];
    }
    
    /**
     * Get consent validation JavaScript
     */
    private function get_consent_validation_script() {
        return "
        (function($) {
            var consentValidator = {
                blockedCalls: [],
                allowedCalls: [],
                sessionId: null,
                
                init: function() {
                    this.sessionId = this.getSessionId();
                    this.interceptNetworkCalls();
                    this.monitorConsentChanges();
                },
                
                getSessionId: function() {
                    var sessionId = localStorage.getItem('heatmap_session_id');
                    if (!sessionId) {
                        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        localStorage.setItem('heatmap_session_id', sessionId);
                    }
                    return sessionId;
                },
                
                getConsentStatus: function() {
                    var consent = localStorage.getItem('heatmap_consent');
                    if (consent) {
                        try {
                            return JSON.parse(consent);
                        } catch (e) {
                            return null;
                        }
                    }
                    return null;
                },
                
                interceptNetworkCalls: function() {
                    var self = this;
                    
                    // Intercept fetch calls
                    var originalFetch = window.fetch;
                    window.fetch = function(url, options) {
                        self.validateNetworkCall('fetch', url, options);
                        return originalFetch.apply(this, arguments);
                    };
                    
                    // Intercept XMLHttpRequest
                    var originalXHROpen = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function(method, url) {
                        this._url = url;
                        self.validateNetworkCall('xhr', url, {method: method});
                        return originalXHROpen.apply(this, arguments);
                    };
                    
                    // Monitor script injections
                    var observer = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            mutation.addedNodes.forEach(function(node) {
                                if (node.tagName === 'SCRIPT' && node.src) {
                                    self.validateNetworkCall('script', node.src);
                                }
                            });
                        });
                    });
                    
                    observer.observe(document.head, {childList: true});
                    observer.observe(document.body, {childList: true});
                },
                
                validateNetworkCall: function(type, url, options) {
                    var consent = this.getConsentStatus();
                    var callInfo = {
                        type: type,
                        url: url,
                        timestamp: new Date().toISOString(),
                        consent_status: consent
                    };
                    
                    // Check if call should be blocked
                    if (this.shouldBlockCall(url, consent)) {
                        this.blockedCalls.push(callInfo);
                        this.logBlockedCall(callInfo);
                        
                        // For analytics/marketing calls without consent
                        if (this.isTrackingCall(url) && (!consent || !consent.analytics)) {
                            console.warn('Heatmap Analytics: Blocked tracking call without consent:', url);
                        }
                    } else {
                        this.allowedCalls.push(callInfo);
                    }
                },
                
                shouldBlockCall: function(url, consent) {
                    if (!consent) return false; // No consent system active
                    
                    // Analytics tracking URLs
                    var analyticsPatterns = [
                        'google-analytics.com',
                        'googletagmanager.com',
                        'analytics.tiktok.com',
                        'facebook.com/tr',
                        'doubleclick.net'
                    ];
                    
                    // Marketing/advertising URLs  
                    var marketingPatterns = [
                        'ads.yahoo.com',
                        'adsystem.amazon.com',
                        'googlesyndication.com',
                        'adsense.google.com'
                    ];
                    
                    // Check analytics consent
                    if (!consent.analytics) {
                        for (var i = 0; i < analyticsPatterns.length; i++) {
                            if (url.includes(analyticsPatterns[i])) {
                                return true;
                            }
                        }
                    }
                    
                    // Check marketing consent
                    if (!consent.marketing) {
                        for (var i = 0; i < marketingPatterns.length; i++) {
                            if (url.includes(marketingPatterns[i])) {
                                return true;
                            }
                        }
                    }
                    
                    return false;
                },
                
                isTrackingCall: function(url) {
                    var trackingPatterns = [
                        'analytics', 'track', 'pixel', 'gtm', 'gtag'
                    ];
                    
                    return trackingPatterns.some(function(pattern) {
                        return url.toLowerCase().includes(pattern);
                    });
                },
                
                logBlockedCall: function(callInfo) {
                    $.post(heatmapConsent.ajax_url, {
                        action: 'log_blocked_call',
                        nonce: heatmapConsent.nonce,
                        session_id: this.sessionId,
                        call_info: callInfo
                    });
                },
                
                monitorConsentChanges: function() {
                    var self = this;
                    
                    // Listen for consent updates
                    window.addEventListener('heatmap_consent_updated', function(e) {
                        self.validateCurrentConsent();
                    });
                    
                    // Periodic validation
                    setInterval(function() {
                        self.validateCurrentConsent();
                    }, 30000); // Every 30 seconds
                },
                
                validateCurrentConsent: function() {
                    var consent = this.getConsentStatus();
                    
                    $.post(heatmapConsent.ajax_url, {
                        action: 'validate_consent',
                        nonce: heatmapConsent.nonce,
                        session_id: this.sessionId,
                        consent_status: consent,
                        blocked_calls: this.blockedCalls.slice(-10), // Last 10
                        allowed_calls: this.allowedCalls.slice(-10)
                    });
                }
            };
            
            // Initialize when DOM is ready
            $(document).ready(function() {
                consentValidator.init();
            });
            
        })(jQuery);
        ";
    }
    
    /**
     * Validate consent via AJAX
     */
    public function validate_consent() {
        $session_id = sanitize_text_field($_POST['session_id']);
        $consent_status = $_POST['consent_status'] ? json_decode(stripslashes($_POST['consent_status']), true) : null;
        $blocked_calls = $_POST['blocked_calls'] ? json_decode(stripslashes($_POST['blocked_calls']), true) : array();
        $allowed_calls = $_POST['allowed_calls'] ? json_decode(stripslashes($_POST['allowed_calls']), true) : array();
        
        $validation_data = array(
            'site_id' => $this->get_site_id(),
            'session_id' => $session_id,
            'consent_status' => $consent_status,
            'blocked_calls' => $blocked_calls,
            'allowed_calls' => $allowed_calls,
            'validation_timestamp' => current_time('mysql', true),
            'ip_address' => $this->get_client_ip(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        );
        
        $result = $this->call_supabase_function('consent-check', $validation_data);
        
        wp_send_json($result);
    }
    
    /**
     * Log blocked call
     */
    public function log_blocked_call() {
        $session_id = sanitize_text_field($_POST['session_id']);
        $call_info = json_decode(stripslashes($_POST['call_info']), true);
        
        $log_data = array(
            'site_id' => $this->get_site_id(),
            'session_id' => $session_id,
            'blocked_call' => $call_info,
            'timestamp' => current_time('mysql', true)
        );
        
        // Store locally for batch processing
        $blocked_calls = get_transient('heatmap_blocked_calls_' . $session_id) ?: array();
        $blocked_calls[] = $log_data;
        set_transient('heatmap_blocked_calls_' . $session_id, $blocked_calls, 3600);
        
        wp_send_json_success();
    }
    
    /**
     * Get site ID
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
     * Get client IP address
     */
    private function get_client_ip() {
        $ip_keys = array('HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR');
        
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '';
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
            'timeout' => 15
        ));
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        return json_decode($body, true) ?: array('success' => true);
    }
    
    /**
     * Update options
     */
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}