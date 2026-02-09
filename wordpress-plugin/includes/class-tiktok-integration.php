<?php
/**
 * TikTok Integration
 * 
 * Handles TikTok Pixel integration with enhanced GDPR compliance
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsTikTokIntegration {
    
    private $options;
    private $tracking_id;
    
    public function __construct($options, $tracking_id) {
        $this->options = $options;
        $this->tracking_id = $tracking_id;
        
        // Only load if TikTok integration is enabled
        if (isset($this->options['tiktok_integration_enabled']) && $this->options['tiktok_integration_enabled']) {
            add_action('wp_enqueue_scripts', array($this, 'enqueue_tiktok_scripts'));
            add_action('wp_footer', array($this, 'render_tiktok_pixel'));
        }
    }
    
    /**
     * Enqueue TikTok scripts with consent management
     */
    public function enqueue_tiktok_scripts() {
        if (!$this->should_load_tiktok()) {
            return;
        }
        
        // Load TikTok pixel with consent blocking
        wp_add_inline_script('jquery', $this->get_tiktok_consent_script(), 'after');
    }
    
    /**
     * Check if TikTok should be loaded
     */
    private function should_load_tiktok() {
        // Don't load for admin users
        if (current_user_can('manage_options')) {
            return false;
        }
        
        // Check if pixel ID is configured
        if (empty($this->options['tiktok_pixel_id'])) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get TikTok consent management script
     */
    private function get_tiktok_consent_script() {
        $pixel_id = esc_js($this->options['tiktok_pixel_id']);
        $age_verification = $this->options['tiktok_age_verification'] ? 'true' : 'false';
        $china_consent = $this->options['tiktok_china_consent'] ? 'true' : 'false';
        
        return "
        (function() {
            var tiktokPixelId = '{$pixel_id}';
            var ageVerificationRequired = {$age_verification};
            var chinaSeparateConsent = {$china_consent};
            
            // Check for existing consent
            function hasMarketingConsent() {
                var consent = localStorage.getItem('heatmap_consent');
                if (consent) {
                    try {
                        var consentData = JSON.parse(consent);
                        return consentData.marketing === true;
                    } catch (e) {
                        return false;
                    }
                }
                return false;
            }
            
            // Check for China-specific consent
            function hasChinaConsent() {
                if (!chinaSeparateConsent) return hasMarketingConsent();
                
                var chinaConsent = localStorage.getItem('heatmap_china_consent');
                return chinaConsent === 'true';
            }
            
            // Age verification check
            function checkAge() {
                if (!ageVerificationRequired) return true;
                
                var ageVerified = localStorage.getItem('heatmap_age_verified');
                return ageVerified === 'true';
            }
            
            // Load TikTok Pixel
            function loadTikTokPixel() {
                if (!hasMarketingConsent() || !hasChinaConsent() || !checkAge()) {
                    return;
                }
                
                !function (w, d, t) {
                    w.TiktokAnalyticsObject=t;
                    var ttq=w[t]=w[t]||[];
                    ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];
                    ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                    ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                    ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js';
                    ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
                    var o=document.createElement('script');
                    o.type='text/javascript',o.async=!0,o.src=i+'?sdkid='+e+'&lib='+t;
                    var a=document.getElementsByTagName('script')[0];
                    a.parentNode.insertBefore(o,a)};
                    
                    ttq.load(tiktokPixelId);
                    ttq.page();
                }(window, document, 'ttq');
                
                // Track page view
                ttq.track('ViewContent');
                
                console.log('TikTok Pixel loaded with consent');
            }
            
            // Listen for consent changes
            window.addEventListener('heatmap_consent_updated', function(e) {
                if (e.detail && e.detail.marketing) {
                    loadTikTokPixel();
                }
            });
            
            // Initial load check
            document.addEventListener('DOMContentLoaded', function() {
                loadTikTokPixel();
            });
        })();
        ";
    }
    
    /**
     * Render TikTok pixel in footer
     */
    public function render_tiktok_pixel() {
        if (!$this->should_load_tiktok()) {
            return;
        }
        
        // Only render noscript fallback - main script is loaded via consent
        $pixel_id = esc_attr($this->options['tiktok_pixel_id']);
        
        echo "<!-- TikTok Pixel Noscript -->\n";
        echo "<noscript>\n";
        echo "<img height=\"1\" width=\"1\" style=\"display:none\" src=\"https://analytics.tiktok.com/i18n/pixel/events.js?noscript=1&partner_name=lovable&partner_id={$pixel_id}\" />\n";
        echo "</noscript>\n";
    }
    
    /**
     * Get TikTok tracking status
     */
    public function get_status() {
        return array(
            'enabled' => isset($this->options['tiktok_integration_enabled']) && $this->options['tiktok_integration_enabled'],
            'pixel_id' => $this->options['tiktok_pixel_id'] ?? '',
            'age_verification' => $this->options['tiktok_age_verification'] ?? true,
            'china_consent' => $this->options['tiktok_china_consent'] ?? false,
            'configured' => !empty($this->options['tiktok_pixel_id'])
        );
    }
    
    /**
     * Update options
     */
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}