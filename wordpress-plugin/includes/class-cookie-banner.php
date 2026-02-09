<?php
/**
 * GDPR Cookie Banner Implementation
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsCookieBanner {
    
    private $options;
    private $detected_tools = [];
    
    public function __construct($options) {
        $this->options = $options;
        $this->detect_tracking_tools();
        $this->init_hooks();
    }
    
    private function init_hooks() {
        if ($this->should_show_banner()) {
            add_action('wp_footer', array($this, 'render_cookie_banner'));
            add_action('wp_enqueue_scripts', array($this, 'enqueue_banner_scripts'));
            add_action('wp_ajax_heatmap_cookie_consent', array($this, 'handle_consent'));
            add_action('wp_ajax_nopriv_heatmap_cookie_consent', array($this, 'handle_consent'));
        }
    }
    
    private function detect_tracking_tools() {
        $this->detected_tools = [
            'necessary' => [
                'wordpress_core' => [
                    'name' => 'WordPress Grundfunktioner',
                    'description' => 'Nödvändiga cookies för inloggning, kommentarer och säkerhet',
                    'detected' => true,
                    'purposes' => ['session', 'security', 'functionality']
                ]
            ],
            'analytics' => [
                'heatmap_tracking' => [
                    'name' => 'Heatmap Analytics',
                    'description' => 'Anonymiserad analys av användarinteraktion via heatmaps',
                    'detected' => true,
                    'purposes' => ['heatmap', 'user_experience'],
                    'vendor' => 'Denna webbplats'
                ]
            ],
            'marketing' => [],
            'functional' => []
        ];
        
        // Detect Google Analytics
        if ($this->is_google_analytics_present()) {
            $this->detected_tools['analytics']['google_analytics'] = [
                'name' => 'Google Analytics',
                'description' => 'Analyserar besökarstatistik och användarbeteende',
                'detected' => true,
                'purposes' => ['measurement', 'analytics'],
                'vendor' => 'Google LLC'
            ];
        }
    }
    
    private function should_show_banner() {
        $cookie_banner_enabled = isset($this->options['cookie_banner_enabled']) ? $this->options['cookie_banner_enabled'] : true;
        
        // Kontrollera om användaren redan har samtyckt (både nya och gamla cookie-namnet)
        $has_consent = isset($_COOKIE['gdpr_consent']) || isset($_COOKIE['heatmap_cookie_consent']);
        
        // Visa banner om den är aktiverad OCH användaren inte redan har samtyckt
        return $cookie_banner_enabled && !$has_consent;
    }
    
    public function enqueue_banner_scripts() {
        wp_enqueue_script('jquery');
        wp_enqueue_style('wp-block-library');
        
        // Register and enqueue banner script
        wp_register_script('heatmap-banner-script', '', array('jquery'), '1.0.0', true);
        wp_enqueue_script('heatmap-banner-script');
        
        wp_add_inline_script('heatmap-banner-script', $this->get_banner_js());
        wp_add_inline_style('wp-block-library', $this->get_banner_css());
    }
    
    private function is_google_analytics_present() {
        // Check for GA4, Universal Analytics, gtag
        $content = $this->get_page_content();
        return (
            strpos($content, 'gtag(') !== false ||
            strpos($content, 'ga(') !== false ||
            strpos($content, 'GoogleAnalyticsObject') !== false ||
            strpos($content, 'gtm.js') !== false ||
            strpos($content, 'analytics.js') !== false ||
            !empty($this->options['ga_measurement_id'])
        );
    }
    
    private function get_page_content() {
        if (!function_exists('wp_remote_get')) {
            return '';
        }
        
        $response = wp_remote_get(home_url(), ['timeout' => 5]);
        if (is_wp_error($response)) {
            return '';
        }
        
        return wp_remote_retrieve_body($response);
    }

    public function render_cookie_banner() {
        $categories = $this->build_dynamic_categories();
        $is_mobile = wp_is_mobile();
        ?>
        <!-- Mobile-First Responsive Cookie Banner -->
        <div id="heatmap-cookie-banner" style="display: block;" data-consent-integrity="<?php echo $this->generate_consent_hash(); ?>">
            <div class="heatmap-cookie-content <?php echo $is_mobile ? 'mobile' : 'desktop'; ?>">
                <h3 style="margin: 0 0 15px 0; font-size: <?php echo $is_mobile ? '18px' : '20px'; ?>; color: #333; font-weight: bold;">Vi använder kakor</h3>
                
                <div style="margin-bottom: 20px; color: #666; line-height: 1.6; font-size: 14px;">
                    <p style="margin: 0 0 12px 0;">För att du ska få en så bra upplevelse som möjligt på webbplatsen använder vi kakor och liknande tekniker som innebär att vi lagrar och/eller får tillgång till viss information på din enhet.</p>
                    
                    <p style="margin: 0 0 12px 0;">Vi har detekterat <strong><?php echo count($this->get_all_detected_tools()); ?> verktyg</strong> på denna webbplats som använder cookies. Du kan välja vilka kategorier du vill tillåta nedan.</p>
                    
                    <p style="margin: 0;">Du kan närsomhelst ändra dina val genom att klicka på "Hantera kakor" på webbplatsen.</p>
                </div>

                <div class="heatmap-cookie-buttons">
                    <button id="heatmap-settings-cookies" class="heatmap-btn heatmap-btn-settings">
                        Inställningar (<?php echo count($this->get_all_detected_tools()); ?> verktyg)
                    </button>
                    <button id="heatmap-accept-cookies" class="heatmap-btn heatmap-btn-accept">
                        Acceptera alla
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Dynamic Cookie Settings Modal -->
        <div id="heatmap-cookie-settings" style="display: none;">
            <div class="heatmap-settings-content">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">Hantera cookies och verktyg</h3>
                
                <?php foreach ($categories as $category_id => $category): ?>
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e1e1e1; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0; color: #333; font-size: 16px; font-weight: bold;">
                            <?php echo esc_html($category['name']); ?>
                            <span style="color: #666; font-size: 14px; font-weight: normal;">(<?php echo count($category['tools']); ?> verktyg)</span>
                        </h4>
                        <?php if ($category_id === 'necessary'): ?>
                            <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 12px; font-size: 12px; color: #666;">Alltid Aktiv</span>
                        <?php else: ?>
                            <div style="display: flex; gap: 8px;">
                                <button class="cookie-category-option" data-category="<?php echo $category_id; ?>" data-value="reject" style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Neka</button>
                                <button class="cookie-category-option active" data-category="<?php echo $category_id; ?>" data-value="accept" style="background: #007cba; color: white; border: 1px solid #007cba; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Godkänn</button>
                            </div>
                        <?php endif; ?>
                    </div>
                    
                    <p style="margin: 0 0 12px 0; color: #666; font-size: 13px;"><?php echo esc_html($category['description']); ?></p>
                    
                    <!-- List detected tools -->
                    <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                        <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #333;">Upptäckta verktyg:</h5>
                        <?php foreach ($category['tools'] as $tool_id => $tool): ?>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 6px; background: white; border-radius: 3px; border-left: 3px solid #007cba;">
                            <div>
                                <strong style="font-size: 12px; color: #333;"><?php echo esc_html($tool['name']); ?></strong>
                                <?php if (isset($tool['vendor'])): ?>
                                    <span style="font-size: 11px; color: #666;"> - <?php echo esc_html($tool['vendor']); ?></span>
                                <?php endif; ?>
                                <br>
                                <span style="font-size: 11px; color: #666;"><?php echo esc_html($tool['description']); ?></span>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endforeach; ?>
                
                <div class="heatmap-settings-buttons">
                    <button id="save-cookie-settings-reject" class="heatmap-btn heatmap-btn-decline">
                        Neka alla valfria
                    </button>
                    <button id="save-cookie-settings-accept" class="heatmap-btn heatmap-btn-accept">
                        Acceptera alla
                    </button>
                    <button id="save-cookie-settings" class="heatmap-btn heatmap-btn-primary">
                        Spara mina val
                    </button>
                </div>
            </div>
        </div>
        <?php
    }
    
    private function build_dynamic_categories() {
        return [
            'necessary' => [
                'name' => 'Nödvändiga kakor och tekniker',
                'description' => 'Dessa verktyg är nödvändiga för webbplatsens grundläggande funktioner och kan inte stängas av.',
                'tools' => $this->detected_tools['necessary']
            ],
            'functional' => [
                'name' => 'Funktionella kakor',
                'description' => 'Förbättrar webbplatsens funktionalitet och användarupplevelse.',
                'tools' => $this->detected_tools['functional']
            ],
            'analytics' => [
                'name' => 'Analys och utveckling',
                'description' => 'Hjälper oss förstå hur besökare använder webbplatsen för att förbättra den.',
                'tools' => $this->detected_tools['analytics']
            ],
            'marketing' => [
                'name' => 'Marknadsföring och annonser',
                'description' => 'Används för reklam, målgruppsbyggande och marknadsföringsanalys.',
                'tools' => $this->detected_tools['marketing']
            ]
        ];
    }
    
    private function get_all_detected_tools() {
        $all_tools = [];
        foreach ($this->detected_tools as $category => $tools) {
            $all_tools = array_merge($all_tools, $tools);
        }
        return $all_tools;
    }
    
    private function generate_consent_hash() {
        $data = [
            'timestamp' => time(),
            'tools' => array_keys($this->get_all_detected_tools()),
            'version' => '3.0.0'
        ];
        return hash('sha256', serialize($data));
    }
    
    private function get_banner_css() {
        return '
        #heatmap-cookie-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #fff;
            color: #333;
            z-index: 999999;
            padding: 20px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            border-top: 1px solid #ddd;
        }
        
        .heatmap-cookie-content {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .heatmap-cookie-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 20px;
        }
        
        .heatmap-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            font-size: 14px;
        }
        
        .heatmap-btn-accept {
            background: #27ae60;
            color: white;
        }
        
        .heatmap-btn-accept:hover {
            background: #2ecc71;
        }
        
        .heatmap-btn-decline {
            background: #e74c3c;
            color: white;
        }
        
        .heatmap-btn-decline:hover {
            background: #c0392b;
        }
        
        .heatmap-btn-settings {
            background: #34495e;
            color: white;
        }
        
        .heatmap-btn-settings:hover {
            background: #2c3e50;
        }
        
        .heatmap-btn-primary {
            background: #28a745;
            color: white;
        }
        
        .heatmap-btn-primary:hover {
            background: #218838;
        }
        
        #heatmap-cookie-settings {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .heatmap-settings-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .heatmap-settings-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        
        @media (max-width: 768px) {
            .heatmap-cookie-content {
                flex-direction: column;
                text-align: center;
            }
            
            .heatmap-cookie-buttons {
                justify-content: center;
                flex-wrap: wrap;
            }
        }
        ';
    }
    
    private function get_banner_js() {
        return '
        jQuery(document).ready(function($) {
            // Always show cookie banner initially to test
            $("#heatmap-cookie-banner").show();
            
            // Check if user has already made a choice (check both old and new cookie names)
            if (!getCookie("gdpr_consent") && !getCookie("heatmap_consent")) {
                $("#heatmap-cookie-banner").show();
            }
            
            // Accept cookies (use new GDPR-compliant name)
            $("#heatmap-accept-cookies").click(function() {
                var fullConsent = {
                    necessary: true,
                    analytics: true,
                    marketing: true,
                    preferences: true
                };
                setCookie("gdpr_consent", JSON.stringify(fullConsent), 365);
                // Remove old cookie if it exists
                deleteCookie("heatmap_consent");
                $("#heatmap-cookie-banner").hide();
                
                // Initialize tracking if consent given
                if (window.HeatmapAnalytics) {
                    window.HeatmapAnalytics.consent(true);
                }
            });
            
            // Show settings
            $("#heatmap-settings-cookies").click(function() {
                $("#heatmap-cookie-settings").show();
            });
            
            // Save settings
            $("#save-cookie-settings").click(function() {
                var settings = {
                    necessary: true,
                    analytics: true
                };
                
                setCookie("gdpr_consent", JSON.stringify(settings), 365);
                deleteCookie("heatmap_consent");
                $("#heatmap-cookie-banner").hide();
                $("#heatmap-cookie-settings").hide();
                
                if (window.HeatmapAnalytics) {
                    window.HeatmapAnalytics.consent(true);
                }
            });
            
            // Accept all in modal
            $("#save-cookie-settings-accept").click(function() {
                var settings = {
                    necessary: true,
                    functional: true,
                    analytics: true,
                    marketing: true
                };
                
                setCookie("gdpr_consent", JSON.stringify(settings), 365);
                deleteCookie("heatmap_consent");
                $("#heatmap-cookie-banner").hide();
                $("#heatmap-cookie-settings").hide();
                
                if (window.HeatmapAnalytics) {
                    window.HeatmapAnalytics.consent(true);
                }
            });
            
            // Reject all optional in modal
            $("#save-cookie-settings-reject").click(function() {
                var settings = {
                    necessary: true,
                    functional: false,
                    analytics: false,
                    marketing: false
                };
                
                setCookie("gdpr_consent", JSON.stringify(settings), 365);
                deleteCookie("heatmap_consent");
                $("#heatmap-cookie-banner").hide();
                $("#heatmap-cookie-settings").hide();
                
                if (window.HeatmapAnalytics) {
                    window.HeatmapAnalytics.consent(false);
                }
            });
            
            // Utility functions
            function setCookie(name, value, days) {
                var expires = "";
                if (days) {
                    var date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = name + "=" + (value || "") + expires + "; path=/";
            }
            
            function getCookie(name) {
                var nameEQ = name + "=";
                var ca = document.cookie.split(";");
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == " ") c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
                }
                return null;
            }
            
            function deleteCookie(name) {
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
            }
        });
        ';
    }
    
    public function handle_consent() {
        // Handle AJAX consent requests
        wp_die();
    }
    
    public function add_manual_cookie() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'heatmap_add_cookie')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $cookie_data = $_POST['cookie_data'];
        
        // Validate required fields
        if (empty($cookie_data['name']) || empty($cookie_data['purpose'])) {
            wp_send_json_error(['message' => 'Cookie namn och syfte är obligatoriska']);
        }
        
        // Add cookie via cookie manager
        $result = $this->cookie_manager->add_manual_cookie($cookie_data);
        
        if ($result) {
            wp_send_json_success([
                'message' => 'Cookie tillagd framgångsrikt',
                'html' => $this->cookie_manager->get_cookies_list_html()
            ]);
        } else {
            wp_send_json_error(['message' => 'Kunde inte lägga till cookie']);
        }
    }
    
    public function delete_manual_cookie() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'heatmap_delete_cookie')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $cookie_id = $_POST['cookie_id'];
        
        // Delete cookie via cookie manager
        $result = $this->cookie_manager->delete_manual_cookie($cookie_id);
        
        if ($result) {
            wp_send_json_success(['message' => 'Cookie borttagen framgångsrikt']);
        } else {
            wp_send_json_error(['message' => 'Kunde inte ta bort cookie']);
        }
    }
    
    public function update_manual_cookie() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'heatmap_update_cookie')) {
            wp_send_json_error(['message' => 'Invalid nonce']);
        }
        
        $cookie_id = $_POST['cookie_id'];
        $cookie_data = $_POST['cookie_data'];
        
        // Update cookie via cookie manager
        $result = $this->cookie_manager->update_manual_cookie($cookie_id, $cookie_data);
        
        if ($result) {
            wp_send_json_success([
                'message' => 'Cookie uppdaterad framgångsrikt',
                'html' => $this->cookie_manager->get_cookies_list_html()
            ]);
        } else {
            wp_send_json_error(['message' => 'Kunde inte uppdatera cookie']);
        }
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
        if ($this->cookie_manager) {
            $this->cookie_manager->update_options($new_options);
        }
    }
}