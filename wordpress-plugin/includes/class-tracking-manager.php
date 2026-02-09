<?php
/**
 * Tracking Manager Class - GDPR Compliant Version
 * Version: 2.0.1
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsTrackingManager {
    
    private $options;
    private $tracking_id;
    private $security_manager = null;
    private $site_id = null;
    
    public function __construct($options, $tracking_id) {
        $this->options = $options;
        $this->tracking_id = $tracking_id;
        
        // Load security manager only if the file exists
        $security_file = plugin_dir_path(__FILE__) . 'class-security-manager.php';
        if (file_exists($security_file)) {
            require_once $security_file;
            $this->security_manager = new HeatmapAnalyticsSecurityManager();
        }
        
        // Only initialize hooks when WordPress is ready
        if (did_action('init')) {
            $this->init_hooks();
        } else {
            add_action('init', array($this, 'init_hooks'));
        }
    }
    
    public function init_hooks() {
        // Don't initialize if we're in admin, REST API, or AJAX context
        if (is_admin() || (defined('REST_REQUEST') && REST_REQUEST) || wp_doing_ajax()) {
            return;
        }
        
        if ($this->is_tracking_enabled()) {
            add_action('wp_enqueue_scripts', array($this, 'enqueue_tracking_script'));
            add_action('wp_footer', array($this, 'add_tracking_config'));
        }
    }
    
    private function is_tracking_enabled() {
        // Check if tracking is enabled and we have a valid tracking ID
        if (empty($this->tracking_id)) {
            return false;
        }
        
        // Check if tracking is explicitly disabled
        if (isset($this->options['tracking_enabled']) && !$this->options['tracking_enabled']) {
            return false;
        }
        
        // Check if current user should be excluded
        if ($this->should_exclude_current_user()) {
            return false;
        }
        
        // Check if current IP should be excluded (GDPR-safe)
        if ($this->should_exclude_current_ip_gdpr()) {
            return false;
        }
        
        // Check sampling rate
        if (!$this->should_track_based_on_sampling()) {
            return false;
        }
        
        return true;
    }
    
    private function should_exclude_current_user() {
        // Only check user exclusion on frontend and when WordPress is fully loaded
        if (is_admin() || !did_action('wp_loaded')) {
            return false;
        }
        
        // Ensure WordPress functions are available
        if (!function_exists('is_user_logged_in') || !function_exists('wp_get_current_user')) {
            return false;
        }
        
        if (!is_user_logged_in()) {
            return false;
        }
        
        $excluded_roles = isset($this->options['excluded_roles']) ? $this->options['excluded_roles'] : array('administrator');
        $user = wp_get_current_user();
        
        foreach ($user->roles as $role) {
            if (in_array($role, $excluded_roles)) {
                return true;
            }
        }
        
        return false;
    }
    
    private function should_exclude_current_ip_gdpr() {
        if (!isset($this->options['ip_exclusion_enabled']) || !$this->options['ip_exclusion_enabled']) {
            return false;
        }
        
        // Get hashed IPs from secure storage
        $excluded_ip_hashes = get_option('heatmap_excluded_ip_hashes', array());
        
        if (empty($excluded_ip_hashes)) {
            return false;
        }
        
        // If security manager is not available, we can't check IP exclusion
        if (!$this->security_manager) {
            return false;
        }
        
        // Check if current IP is excluded using secure comparison
        return $this->security_manager->is_ip_excluded($excluded_ip_hashes);
    }
    
    private function should_track_based_on_sampling() {
        $sampling_rate = isset($this->options['sampling_rate']) ? intval($this->options['sampling_rate']) : 100;
        
        if ($sampling_rate >= 100) {
            return true;
        }
        
        if ($sampling_rate <= 0) {
            return false;
        }
        
        // Use a consistent hash based on anonymized IP to ensure same visitor always gets same result
        $visitor_ip = $this->get_user_ip();
        
        // Anonymize IP before using for sampling decision
        if (isset($this->options['anonymize_ip']) && $this->options['anonymize_ip']) {
            $visitor_ip = $this->anonymize_ip($visitor_ip);
        }
        
        $hash = crc32($visitor_ip . date('Y-m-d'));
        $random = ($hash % 100) + 1;
        
        return $random <= $sampling_rate;
    }
    
    // Fallback methods if security manager is not available
    private function get_user_ip() {
        if ($this->security_manager && method_exists($this->security_manager, 'get_user_ip')) {
            return $this->security_manager->get_user_ip();
        }
        
        // Fallback IP detection
        $ip_keys = array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR');
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
        return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
    }
    
    private function anonymize_ip($ip) {
        if ($this->security_manager && method_exists($this->security_manager, 'anonymize_ip')) {
            return $this->security_manager->anonymize_ip($ip);
        }
        
        // Fallback anonymization
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);
            $parts[3] = '0';
            return implode('.', $parts);
        } elseif (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $parts = explode(':', $ip);
            $parts = array_slice($parts, 0, 4);
            return implode(':', $parts) . '::';
        }
        return $ip;
    }
    
    public function enqueue_tracking_script() {
        // Kontrollera att filen finns
        $script_path = plugin_dir_path(HEATMAP_ANALYTICS_PLUGIN_FILE) . 'assets/tracking-script.js';
        
        if (!file_exists($script_path)) {
            heatmap_log('Tracking script file missing: ' . $script_path, 'error');
            return;
        }
        
        wp_enqueue_script(
            'heatmap-analytics-tracking',
            plugin_dir_url(HEATMAP_ANALYTICS_PLUGIN_FILE) . 'assets/tracking-script.js',
            array(),
            HEATMAP_ANALYTICS_VERSION,
            true
        );
        
        // Also enqueue external consent script if needed
        if (isset($this->options['detect_external_consent']) && $this->options['detect_external_consent']) {
            $external_script_path = plugin_dir_path(HEATMAP_ANALYTICS_PLUGIN_FILE) . 'assets/external-consent.js';
            if (file_exists($external_script_path)) {
                wp_enqueue_script(
                    'heatmap-external-consent',
                    plugin_dir_url(HEATMAP_ANALYTICS_PLUGIN_FILE) . 'assets/external-consent.js',
                    array('jquery'),
                    HEATMAP_ANALYTICS_VERSION,
                    true
                );
            }
        }
        
        // Debug info
        if (defined('WP_DEBUG') && WP_DEBUG) {
            heatmap_log('Tracking script enqueued: ' . plugin_dir_url(HEATMAP_ANALYTICS_PLUGIN_FILE) . 'assets/tracking-script.js', 'info');
        }
    }
    
    public function add_tracking_config() {
        // Get GDPR settings
        $gdpr_enabled = isset($this->options['cookie_banner_enabled']) ? $this->options['cookie_banner_enabled'] : true;
        $anonymize_ip = isset($this->options['anonymize_ip']) ? $this->options['anonymize_ip'] : true;
        
        // Check if mobile tracking is enabled
        $track_mobile = isset($this->options['track_mobile']) ? $this->options['track_mobile'] : true;
        if (!$track_mobile && wp_is_mobile()) {
            return; // Don't output config if mobile tracking is disabled and user is on mobile
        }
        
        // Get user's IP (for client-side anonymization if needed)
        $user_ip = '';
        if ($anonymize_ip) {
            $user_ip = $this->anonymize_ip($this->get_user_ip());
        }
        
        $config = array(
            'trackingId' => $this->tracking_id,
            'siteId' => $this->get_site_id(),
            'performanceMode' => isset($this->options['performance_mode']) ? $this->options['performance_mode'] : true,
            'trackMobile' => $track_mobile,
            'apiEndpoint' => 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/pixel-tracking',
            'cookiefreeEndpoint' => 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/cookiefree-analytics',
            'gdprEnabled' => $gdpr_enabled,
            'cookiefreeMode' => true, // Always track basic cookiefree analytics
            'enhancedWithConsent' => true, // Upgrade to enhanced tracking with consent
            'anonymizeIp' => $anonymize_ip,
            'anonymizeUserAgent' => isset($this->options['anonymize_user_agents']) ? $this->options['anonymize_user_agents'] : true,
            'dataRetentionDays' => isset($this->options['data_retention_days']) ? intval($this->options['data_retention_days']) : 90,
            'debug' => (defined('WP_DEBUG') && WP_DEBUG),
            'siteUrl' => get_site_url(),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'privacyPolicyUrl' => isset($this->options['privacy_policy_url']) ? $this->options['privacy_policy_url'] : '',
            'consentRequired' => false, // Cookiefree doesn't require consent
            'cookiePrefix' => 'heatmap_',
            'sessionTimeout' => 30 * 60 * 1000, // 30 minutes in milliseconds
        );
        
        // Add form tracking config if enabled
        if (isset($this->options['form_tracking_enabled']) && $this->options['form_tracking_enabled']) {
            $config['formTracking'] = array(
                'enabled' => true,
                'events' => isset($this->options['track_form_events']) ? $this->options['track_form_events'] : array('submit', 'abandon'),
                'excludedFields' => array('password', 'pass', 'pwd', 'credit_card', 'cvv', 'ssn'), // Always exclude sensitive fields
                'customExcludedFields' => isset($this->options['excluded_form_fields']) ? $this->options['excluded_form_fields'] : array(),
                'abandonmentThreshold' => isset($this->options['abandonment_time_threshold']) ? intval($this->options['abandonment_time_threshold']) : 30,
                'anonymizeFormData' => true
            );
        }
        
        // Add Google Analytics integration config if enabled
        if (isset($this->options['ga_integration_enabled']) && $this->options['ga_integration_enabled'] && !empty($this->options['ga_measurement_id'])) {
            $config['gaIntegration'] = array(
                'enabled' => true,
                'measurementId' => $this->options['ga_measurement_id'],
                'syncEvents' => isset($this->options['ga_sync_events']) ? $this->options['ga_sync_events'] : array(),
                'enhancedEcommerce' => isset($this->options['ga_enhanced_ecommerce']) ? $this->options['ga_enhanced_ecommerce'] : false,
                'anonymizeIp' => $anonymize_ip
            );
        }
        
        // Add security headers
        $config['security'] = array(
            'nonce' => wp_create_nonce('heatmap_tracking'),
            'encryptionEnabled' => true,
            'integrityCheck' => $this->generate_integrity_hash()
        );
        
        ?>
        <script>
        // Heatmap Analytics Configuration with GDPR Compliance
        window.heatmapAnalyticsConfig = <?php echo json_encode($config); ?>;
        
        // Privacy-first initialization
        (function() {
            // Check for Do Not Track
            if (navigator.doNotTrack === "1" || window.doNotTrack === "1") {
                console.log('Heatmap Analytics: Respecting Do Not Track preference');
                return;
            }
            
            // Initialize cookiefree tracking immediately (no consent needed)
            function initCookiefreeTracking() {
                if (window.heatmapAnalyticsConfig && window.heatmapAnalyticsConfig.cookiefreeMode) {
                    console.log('Heatmap Analytics: Starting cookiefree tracking (GDPR-compliant, no cookies)');
                    
                    // Send cookiefree page view
                    fetch(window.heatmapAnalyticsConfig.cookiefreeEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'pageview',
                            url: window.location.href,
                            referrer: document.referrer,
                            viewport: { width: window.innerWidth, height: window.innerHeight },
                            timestamp: new Date().toISOString()
                        })
                    });
                }
            }
            
            // Initialize enhanced tracker with consent
            function initEnhancedTracking() {
                if (window.HeatmapAnalyticsTracker && window.heatmapAnalyticsConfig) {
                    // Check for consent before initializing enhanced tracking
                    if (window.heatmapAnalyticsConfig.gdprEnabled) {
                        // Check for consent in new JSON format
                        function hasAnalyticsConsent() {
                            const consentCookie = document.cookie
                                .split('; ')
                                .find(row => row.startsWith('heatmap_consent='));
                            
                            if (consentCookie) {
                                try {
                                    const consentValue = consentCookie.split('=')[1];
                                    const consent = JSON.parse(decodeURIComponent(consentValue));
                                    return consent.analytics === true;
                                } catch (e) {
                                    // Fallback to old format
                                    return consentCookie.includes('true');
                                }
                            }
                            
                            // Fallback to localStorage
                            return localStorage.getItem('heatmap_consent') === 'true';
                        }
                        
                        if (hasAnalyticsConsent()) {
                            console.log('Heatmap Analytics: Upgrading to enhanced tracking with user consent');
                            window.HeatmapAnalyticsTracker.init(window.heatmapAnalyticsConfig);
                        } else {
                            // Listen for consent event to upgrade
                            document.addEventListener('consentUpdated', function(event) {
                                if (event.detail && event.detail.analytics) {
                                    console.log('Heatmap Analytics: User consented, upgrading to enhanced tracking');
                                    window.HeatmapAnalyticsTracker.init(window.heatmapAnalyticsConfig);
                                }
                            });
                            
                            // Fallback for old event
                            document.addEventListener('heatmap_consent_granted', function() {
                                console.log('Heatmap Analytics: User consented, upgrading to enhanced tracking');
                                window.HeatmapAnalyticsTracker.init(window.heatmapAnalyticsConfig);
                            });
                        }
                    } else {
                        // No GDPR requirement, initialize enhanced tracking directly
                        window.HeatmapAnalyticsTracker.init(window.heatmapAnalyticsConfig);
                    }
                }
            }
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    initCookiefreeTracking(); // Always start cookiefree
                    initEnhancedTracking();   // Upgrade with consent
                });
            } else {
                initCookiefreeTracking(); // Always start cookiefree
                initEnhancedTracking();   // Upgrade with consent
            }
        })();
        
        // GDPR Data Subject Rights
        window.HeatmapAnalytics = window.HeatmapAnalytics || {};
        
        // Allow users to opt-out
        window.HeatmapAnalytics.optOut = function() {
            localStorage.setItem('heatmap_optout', 'true');
            document.cookie = 'heatmap_optout=true; path=/; max-age=31536000'; // 1 year
            if (window.HeatmapAnalyticsTracker && window.HeatmapAnalyticsTracker.destroy) {
                window.HeatmapAnalyticsTracker.destroy();
            }
            console.log('Heatmap Analytics: You have been opted out of tracking');
        };
        
        // Allow users to request data deletion
        window.HeatmapAnalytics.requestDataDeletion = function() {
            if (confirm('This will request deletion of all your tracking data. Continue?')) {
                fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'action=heatmap_request_data_deletion&nonce=<?php echo wp_create_nonce('heatmap_data_deletion'); ?>'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Your data deletion request has been submitted.');
                    }
                });
            }
        };
        </script>
        
        <?php
        // Add custom CSS for cookie banner if enabled
        if ($gdpr_enabled) {
            $this->add_cookie_banner_styles();
        }
        
        // Add structured data for privacy transparency
        $this->add_privacy_structured_data();
    }
    
    private function add_cookie_banner_styles() {
        ?>
        <style>
        /* Heatmap Analytics Cookie Banner Styles - GDPR Compliant */
        #heatmap-consent-banner {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
            line-height: 1.5;
            color: #333;
        }
        
        .heatmap-consent-required {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }
        
        .heatmap-privacy-link {
            color: #007cba;
            text-decoration: underline;
            cursor: pointer;
        }
        
        .heatmap-privacy-link:hover {
            color: #005a87;
        }
        
        @media (max-width: 768px) {
            #heatmap-consent-banner > div {
                flex-direction: column;
                text-align: center;
            }
            
            #heatmap-consent-banner button {
                width: 100%;
                margin: 5px 0 !important;
            }
        }
        
        /* Accessibility improvements */
        #heatmap-consent-banner button:focus {
            outline: 2px solid #007cba;
            outline-offset: 2px;
        }
        
        #heatmap-consent-banner[aria-hidden="true"] {
            display: none;
        }
        </style>
        <?php
    }
    
    private function add_privacy_structured_data() {
        $privacy_policy_url = isset($this->options['privacy_policy_url']) ? $this->options['privacy_policy_url'] : get_privacy_policy_url();
        
        if ($privacy_policy_url) {
            ?>
            <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "mainEntity": {
                    "@type": "PrivacyPolicy",
                    "url": "<?php echo esc_url($privacy_policy_url); ?>",
                    "dateModified": "<?php echo get_option('heatmap_last_settings_update', current_time('c')); ?>"
                }
            }
            </script>
            <?php
        }
    }
    
    /**
     * Get or generate persistent site ID in GDPR-compliant way
     * Site ID is functional data, not personal data - no consent required
     */
    public function get_site_id() {
        if ($this->site_id !== null) {
            return $this->site_id;
        }
        
        // Check WordPress options first (persistent across all visitors)
        $site_id = get_option('heatmap_analytics_site_id', '');
        
        if (empty($site_id) || !$this->is_valid_site_id($site_id)) {
            // Generate new UUID in tk_xxx format (same as Supabase function)
            $site_id = 'tk_' . str_replace('-', '', wp_generate_uuid4());
            
            // Store in WordPress options (persistent, no cookie consent needed)
            update_option('heatmap_analytics_site_id', $site_id, true); // autoload = true
            
            heatmap_log('Generated new site ID: ' . $site_id, 'info');
        }
        
        $this->site_id = $site_id;
        
        // Don't set cookie here - let JavaScript handle it based on consent
        // This prevents GDPR violations by not setting tracking cookies without consent
        
        return $site_id;
    }
    
    /**
     * Validate site ID format (must start with tk_ and be 35 chars total)
     */
    private function is_valid_site_id($site_id) {
        return preg_match('/^tk_[a-f0-9]{32}$/', $site_id);
    }
    
    private function generate_integrity_hash() {
        // Generate a hash of critical settings for integrity checking
        $critical_settings = array(
            'tracking_id' => $this->tracking_id,
            'anonymize_ip' => isset($this->options['anonymize_ip']) ? $this->options['anonymize_ip'] : true,
            'data_retention_days' => isset($this->options['data_retention_days']) ? $this->options['data_retention_days'] : 90
        );
        
        return hash('sha256', json_encode($critical_settings) . wp_salt('nonce'));
    }
    
    public function update_options($new_options, $new_tracking_id = null) {
        $this->options = $new_options;
        
        // Om tracking_id skickas som andra parameter, använd det
        if ($new_tracking_id !== null) {
            $this->tracking_id = $new_tracking_id;
        } else if (isset($new_options['tracking_id'])) {
            // Annars försök hämta från options array
            $this->tracking_id = $new_options['tracking_id'];
        }
        
        // Reset site_id to force re-validation on next access
        $this->site_id = null;
    }
}
