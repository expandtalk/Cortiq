<?php
/**
 * Enhanced Cookie Banner with Edge Functions Integration
 * Version: 4.2.0 - Updated for new consent handling
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsEnhancedCookieBanner {
    
    private $options;
    private $edge_functions;
    
    public function __construct($options) {
        $this->options = $options;
        $this->edge_functions = new HeatmapAnalyticsEdgeFunctions();
        
        add_action('wp_footer', array($this, 'render_cookie_banner'), 100);
        add_action('wp_ajax_store_cookie_consent', array($this, 'ajax_store_consent'));
        add_action('wp_ajax_nopriv_store_cookie_consent', array($this, 'ajax_store_consent'));
    }
    
    /**
     * Render the enhanced cookie banner
     */
    public function render_cookie_banner() {
        if (!$this->options['cookie_banner_enabled']) {
            return;
        }
        
        // Check if consent already given
        if (isset($_COOKIE['heatmap_consent_given'])) {
            return;
        }
        
        ?>
        <div id="heatmap-cookie-banner" class="heatmap-cookie-banner">
            <div class="heatmap-banner-content">
                <div class="heatmap-banner-text">
                    <h3>🍪 Vill du ha en bättre upplevelse?</h3>
                    <p>Vi spårar redan anonymiserad statistik (ingen persondata). Vill du aktivera cookies för förbättrad funktionalitet?</p>
                </div>
                <div class="heatmap-banner-actions">
                    <button id="heatmap-accept-all" class="heatmap-btn heatmap-btn-primary">
                        Ja, förbättra upplevelsen
                    </button>
                    <button id="heatmap-reject-all" class="heatmap-btn heatmap-btn-secondary">
                        Nej tack
                    </button>
                    <button id="heatmap-customize" class="heatmap-btn heatmap-btn-outline">
                        Anpassa
                    </button>
                </div>
            </div>
            
            <!-- Cookie Settings Modal -->
            <div id="heatmap-cookie-settings" class="heatmap-cookie-settings" style="display: none;">
                <div class="heatmap-settings-content">
                    <h3>Cookie-inställningar</h3>
                    <div class="heatmap-cookie-categories">
                        <div class="heatmap-cookie-category">
                            <label>
                                <input type="checkbox" id="necessary-cookies" checked disabled>
                                <strong>Nödvändiga cookies</strong>
                                <span class="description">Krävs för att webbplatsen ska fungera</span>
                            </label>
                        </div>
                        <div class="heatmap-cookie-category">
                            <label>
                                <input type="checkbox" id="analytics-cookies">
                                <strong>Analys cookies</strong>
                                <span class="description">Hjälper oss förstå hur webbplatsen används</span>
                            </label>
                        </div>
                        <div class="heatmap-cookie-category">
                            <label>
                                <input type="checkbox" id="marketing-cookies">
                                <strong>Marknadsföring cookies</strong>
                                <span class="description">Används för personlig annonsering</span>
                            </label>
                        </div>
                        <div class="heatmap-cookie-category">
                            <label>
                                <input type="checkbox" id="preferences-cookies">
                                <strong>Preferens cookies</strong>
                                <span class="description">Sparar dina inställningar</span>
                            </label>
                        </div>
                    </div>
                    <div class="heatmap-settings-actions">
                        <button id="heatmap-save-preferences" class="heatmap-btn heatmap-btn-primary">
                            Spara val
                        </button>
                        <button id="heatmap-close-settings" class="heatmap-btn heatmap-btn-secondary">
                            Stäng
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
        .heatmap-cookie-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #fff;
            border-top: 1px solid #e0e0e0;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            z-index: 950; /* Organized z-index */
            padding: 20px;
            transform: translateY(100%);
            transition: transform 0.3s ease-out;
            contain: layout style;
            will-change: transform;
            max-height: 30vh;
        }
        
        .heatmap-cookie-banner.show {
            transform: translateY(0);
        }
        
        .heatmap-banner-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }
        
        .heatmap-banner-text h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
            color: #333;
        }
        
        .heatmap-banner-text p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        
        .heatmap-banner-actions {
            display: flex;
            gap: 10px;
            flex-shrink: 0;
        }
        
        .heatmap-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .heatmap-btn-primary {
            background: #007cba;
            color: white;
        }
        
        .heatmap-btn-primary:hover {
            background: #005a87;
        }
        
        .heatmap-btn-secondary {
            background: #f0f0f0;
            color: #333;
        }
        
        .heatmap-btn-outline {
            background: transparent;
            color: #007cba;
            border: 1px solid #007cba;
        }
        
        .heatmap-cookie-settings {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000; /* Organized z-index */
            contain: layout style;
        }
        
        .heatmap-settings-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
        }
        
        .heatmap-cookie-category {
            margin: 15px 0;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
        }
        
        .heatmap-cookie-category label {
            display: block;
            cursor: pointer;
        }
        
        .heatmap-cookie-category .description {
            display: block;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        @media (max-width: 768px) {
            .heatmap-banner-content {
                flex-direction: column;
                align-items: stretch;
            }
            
            .heatmap-banner-actions {
                justify-content: center;
            }
            
            .heatmap-btn {
                flex: 1;
                padding: 12px;
            }
        }
        </style>

        <script>
        // Performance monitoring
        const cookiePerformance = {
            startTime: performance.now(),
            metrics: { loadTime: 0, consentSaveTime: 0 }
        };

        // Service Worker registration for offline cookie handling
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/cookie-performance-sw.js')
                .then(reg => console.log('🍪 Cookie SW registered'))
                .catch(err => console.warn('🍪 Cookie SW failed:', err));
        }

        document.addEventListener('DOMContentLoaded', function() {
            const banner = document.getElementById('heatmap-cookie-banner');
            const settings = document.getElementById('heatmap-cookie-settings');
            const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Performance optimized banner display
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => {
                    showBannerWithAnimation();
                }, { timeout: 1000 });
            } else {
                setTimeout(showBannerWithAnimation, 0);
            }
            
            function showBannerWithAnimation() {
                if (banner && !document.cookie.includes('heatmap_consent_given')) {
                    banner.classList.add('show');
                    
                    // Track banner load time
                    cookiePerformance.metrics.loadTime = performance.now() - cookiePerformance.startTime;
                    console.log(`🍪 Banner loaded in ${cookiePerformance.metrics.loadTime.toFixed(2)}ms`);
                }
            }
            
            // Accept all cookies
            document.getElementById('heatmap-accept-all').addEventListener('click', function() {
                saveConsent({
                    necessary: true,
                    analytics: true,
                    marketing: true,
                    preferences: true
                });
            });
            
            // Reject all cookies (except necessary)
            document.getElementById('heatmap-reject-all').addEventListener('click', function() {
                saveConsent({
                    necessary: true,
                    analytics: false,
                    marketing: false,
                    preferences: false
                });
            });
            
            // Show settings
            document.getElementById('heatmap-customize').addEventListener('click', function() {
                settings.style.display = 'block';
            });
            
            // Close settings
            document.getElementById('heatmap-close-settings').addEventListener('click', function() {
                settings.style.display = 'none';
            });
            
            // Save custom preferences
            document.getElementById('heatmap-save-preferences').addEventListener('click', function() {
                const necessary = document.getElementById('necessary-cookies').checked;
                const analytics = document.getElementById('analytics-cookies').checked;
                const marketing = document.getElementById('marketing-cookies').checked;
                const preferences = document.getElementById('preferences-cookies').checked;
                
                saveConsent({
                    necessary: necessary,
                    analytics: analytics,
                    marketing: marketing,
                    preferences: preferences
                });
            });
            
            function saveConsent(consentTypes) {
                const consentStartTime = performance.now();
                
                const consentData = {
                    site_id: '<?php echo esc_js($this->options['tracking_id']); ?>',
                    session_id: sessionId,
                    consent_types: consentTypes,
                    source: 'banner',
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                    language: navigator.language || navigator.userLanguage
                };
                
                // Send to WordPress AJAX endpoint
                fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'store_cookie_consent',
                        nonce: '<?php echo wp_create_nonce('store_consent_nonce'); ?>',
                        consent_data: JSON.stringify(consentData)
                    })
                }).then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Track consent save time
                        cookiePerformance.metrics.consentSaveTime = performance.now() - consentStartTime;
                        console.log(`🍪 Consent saved in ${cookiePerformance.metrics.consentSaveTime.toFixed(2)}ms`);
                        
                        // Set consent cookie
                        const expiryDate = new Date();
                        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                        document.cookie = 'heatmap_consent_given=true; expires=' + expiryDate.toUTCString() + '; path=/';
                        
                        // Hide banner and settings with animation
                        banner.classList.remove('show');
                        settings.style.display = 'none';
                        
                        // Send performance data to analytics
                        if (window.gtag) {
                            window.gtag('event', 'cookie_performance', {
                                event_category: 'Performance',
                                load_time: Math.round(cookiePerformance.metrics.loadTime),
                                save_time: Math.round(cookiePerformance.metrics.consentSaveTime)
                            });
                        }
                        
                        // Trigger consent event
                        window.dispatchEvent(new CustomEvent('heatmapConsentGiven', {
                            detail: consentTypes
                        }));
                    }
                }).catch(error => {
                    console.error('Error saving consent:', error);
                    
                    // Track error
                    if (window.gtag) {
                        window.gtag('event', 'cookie_error', {
                            event_category: 'Error',
                            event_label: 'Consent Save Failed',
                            value: 1
                        });
                    }
                });
            }
        });
        </script>
        <?php
    }
    
    /**
     * AJAX handler to store consent via edge function
     */
    public function ajax_store_consent() {
        check_ajax_referer('store_consent_nonce', 'nonce');
        
        $consent_data = json_decode(stripslashes($_POST['consent_data']), true);
        
        if (!$consent_data) {
            wp_send_json_error('Invalid consent data');
            return;
        }
        
        // Store consent via edge function
        $result = $this->edge_functions->store_consent($consent_data);
        
        if ($result && isset($result['success']) && $result['success']) {
            heatmap_log('Consent stored successfully via edge function', 'info');
            wp_send_json_success('Consent stored successfully');
        } else {
            heatmap_log('Failed to store consent via edge function', 'error');
            wp_send_json_error('Failed to store consent');
        }
    }
}