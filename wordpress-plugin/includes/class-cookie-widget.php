<?php
/**
 * Cookie Settings Widget
 * Adds a floating cookie icon and settings modal
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsCookieWidget {
    
    private $options;
    private $cookie_categories = array(
        'necessary' => array(
            'name' => 'Nödvändiga',
            'description' => 'Dessa cookies är nödvändiga för att webbplatsen ska fungera korrekt.',
            'locked' => true
        ),
        'analytics' => array(
            'name' => 'Analys & Statistik',
            'description' => 'Hjälper oss förstå hur besökare använder webbplatsen.',
            'locked' => false
        ),
        'marketing' => array(
            'name' => 'Marknadsföring',
            'description' => 'Används för att visa relevanta annonser.',
            'locked' => false
        ),
        'preferences' => array(
            'name' => 'Preferenser',
            'description' => 'Sparar dina inställningar och val.',
            'locked' => false
        )
    );
    
    public function __construct($options) {
        $this->options = $options;
        
        if (isset($options['cookie_widget_enabled']) && $options['cookie_widget_enabled']) {
            add_action('wp_footer', array($this, 'render_widget'), 25);
            add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
            
            // AJAX handlers
            add_action('wp_ajax_update_cookie_preferences', array($this, 'ajax_update_preferences'));
            add_action('wp_ajax_nopriv_update_cookie_preferences', array($this, 'ajax_update_preferences'));
            
            add_action('wp_ajax_get_cookie_details', array($this, 'ajax_get_cookie_details'));
            add_action('wp_ajax_nopriv_get_cookie_details', array($this, 'ajax_get_cookie_details'));
        }
    }
    
    public function enqueue_assets() {
        wp_enqueue_script('jquery');
        wp_add_inline_style('wp-block-library', $this->get_widget_css());
        wp_add_inline_script('jquery', $this->get_widget_js());
    }
    
    public function render_widget() {
        // Check if user has already consented
        $show_icon = isset($_COOKIE['heatmap_consent']);
        
        ?>
        <!-- Cookie Settings Widget -->
        <?php if ($show_icon): ?>
        <div id="cookie-settings-icon" class="cookie-widget-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a10 10 0 0 0-9.95 9h4.95a5 5 0 0 1 5-5V2z"></path>
                <circle cx="7" cy="15" r="1"></circle>
                <circle cx="17" cy="9" r="1"></circle>
                <circle cx="12" cy="9" r="1"></circle>
                <circle cx="17" cy="15" r="1"></circle>
            </svg>
        </div>
        <?php endif; ?>
        
        <!-- Cookie Settings Modal -->
        <div id="cookie-settings-modal" class="cookie-modal" style="display: none;">
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h2>🍪 Cookie-inställningar</h2>
                    <button class="cookie-modal-close">&times;</button>
                </div>
                
                <div class="cookie-modal-body">
                    <div class="cookie-tabs">
                        <button class="cookie-tab active" data-tab="consent">Samtycke</button>
                        <button class="cookie-tab" data-tab="details">Cookie-detaljer</button>
                        <button class="cookie-tab" data-tab="about">Om cookies</button>
                    </div>
                    
                    <!-- Consent Tab -->
                    <div class="cookie-tab-content active" id="tab-consent">
                        <p class="cookie-intro">Vi använder cookies för att förbättra din upplevelse. Du kan anpassa dina inställningar nedan.</p>
                        
                        <div class="cookie-categories">
                            <?php foreach ($this->cookie_categories as $key => $category): ?>
                            <div class="cookie-category">
                                <div class="cookie-category-header">
                                    <div class="cookie-category-info">
                                        <h4><?php echo esc_html($category['name']); ?></h4>
                                        <p><?php echo esc_html($category['description']); ?></p>
                                    </div>
                                    <label class="cookie-switch">
                                        <input type="checkbox" 
                                               id="cookie-<?php echo esc_attr($key); ?>" 
                                               value="<?php echo esc_attr($key); ?>"
                                               <?php echo $category['locked'] ? 'checked disabled' : ''; ?>>
                                        <span class="cookie-slider"></span>
                                    </label>
                                </div>
                                <div class="cookie-category-details" style="display: none;">
                                    <div class="cookie-list" data-category="<?php echo esc_attr($key); ?>">
                                        <!-- Populated by JavaScript -->
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    
                    <!-- Details Tab -->
                    <div class="cookie-tab-content" id="tab-details">
                        <div class="cookie-scanner-status">
                            <h4>🔍 Aktiva cookies på denna webbplats</h4>
                            <button class="btn-scan-cookies">Skanna cookies</button>
                        </div>
                        <div id="cookie-scan-results">
                            <!-- Populated by JavaScript -->
                        </div>
                    </div>
                    
                    <!-- About Tab -->
                    <div class="cookie-tab-content" id="tab-about">
                        <h4>Vad är cookies?</h4>
                        <p>Cookies är små textfiler som lagras på din enhet när du besöker en webbplats. De används för att:</p>
                        <ul>
                            <li>Komma ihåg dina inställningar</li>
                            <li>Hålla dig inloggad</li>
                            <li>Förstå hur du använder webbplatsen</li>
                            <li>Visa relevant innehåll</li>
                        </ul>
                        
                        <h4>Dina rättigheter</h4>
                        <p>Enligt GDPR har du rätt att:</p>
                        <ul>
                            <li>Veta vilka cookies som används</li>
                            <li>Välja vilka cookies du accepterar</li>
                            <li>Ändra dina val när som helst</li>
                            <li>Radera cookies från din enhet</li>
                        </ul>
                        
                        <?php if (!empty($this->options['privacy_policy_url'])): ?>
                        <p><a href="<?php echo esc_url($this->options['privacy_policy_url']); ?>" target="_blank">Läs vår integritetspolicy →</a></p>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="cookie-modal-footer">
                    <button class="cookie-btn cookie-btn-secondary" id="reject-all-cookies">Avvisa alla</button>
                    <button class="cookie-btn cookie-btn-primary" id="save-cookie-preferences">Spara inställningar</button>
                    <button class="cookie-btn cookie-btn-primary" id="accept-all-cookies">Acceptera alla</button>
                </div>
            </div>
        </div>
        <?php
    }
    
    private function get_widget_css() {
        return '
        /* Cookie Widget Icon */
        .cookie-widget-icon {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            z-index: 999998;
            color: white;
        }
        
        .cookie-widget-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        
        /* Cookie Modal */
        .cookie-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .cookie-modal-content {
            background: white;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .cookie-modal-header {
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .cookie-modal-header h2 {
            margin: 0;
            font-size: 24px;
            color: #1f2937;
        }
        
        .cookie-modal-close {
            background: none;
            border: none;
            font-size: 30px;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }
        
        .cookie-modal-close:hover {
            background: #f3f4f6;
            color: #1f2937;
        }
        
        .cookie-modal-body {
            padding: 20px;
            overflow-y: auto;
            max-height: calc(90vh - 180px);
        }
        
        /* Tabs */
        .cookie-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .cookie-tab {
            background: none;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            color: #6b7280;
            font-weight: 500;
            position: relative;
            transition: all 0.2s;
        }
        
        .cookie-tab:hover {
            color: #1f2937;
        }
        
        .cookie-tab.active {
            color: #667eea;
        }
        
        .cookie-tab.active::after {
            content: "";
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: #667eea;
        }
        
        .cookie-tab-content {
            display: none;
        }
        
        .cookie-tab-content.active {
            display: block;
        }
        
        /* Cookie Categories */
        .cookie-category {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
        }
        
        .cookie-category-header {
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f9fafb;
        }
        
        .cookie-category-info h4 {
            margin: 0 0 5px 0;
            font-size: 16px;
            color: #1f2937;
        }
        
        .cookie-category-info p {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
        }
        
        /* Toggle Switch */
        .cookie-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
        }
        
        .cookie-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .cookie-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #cbd5e1;
            transition: 0.4s;
            border-radius: 24px;
        }
        
        .cookie-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: 0.4s;
            border-radius: 50%;
        }
        
        input:checked + .cookie-slider {
            background-color: #667eea;
        }
        
        input:checked + .cookie-slider:before {
            transform: translateX(26px);
        }
        
        input:disabled + .cookie-slider {
            background-color: #94a3b8;
            cursor: not-allowed;
        }
        
        /* Footer */
        .cookie-modal-footer {
            padding: 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .cookie-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .cookie-btn-primary {
            background: #667eea;
            color: white;
        }
        
        .cookie-btn-primary:hover {
            background: #5a67d8;
        }
        
        .cookie-btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }
        
        .cookie-btn-secondary:hover {
            background: #e5e7eb;
        }
        
        /* Cookie Details */
        .cookie-list {
            padding: 15px;
            background: #f9fafb;
        }
        
        .cookie-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 6px;
            margin-bottom: 10px;
        }
        
        .cookie-item-name {
            font-weight: 500;
            color: #1f2937;
        }
        
        .cookie-item-value {
            font-size: 12px;
            color: #6b7280;
            font-family: monospace;
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .cookie-modal-content {
                width: 100%;
                height: 100%;
                max-height: 100vh;
                border-radius: 0;
            }
            
            .cookie-modal-footer {
                flex-direction: column;
            }
            
            .cookie-btn {
                width: 100%;
            }
        }
        ';
    }
    
    private function get_widget_js() {
        return '
        jQuery(document).ready(function($) {
            let cookiePreferences = {};
            
            // Parse existing consent
            const consentCookie = getCookie("heatmap_consent");
            if (consentCookie) {
                try {
                    cookiePreferences = JSON.parse(consentCookie);
                    updateSwitches();
                } catch (e) {
                    console.error("Failed to parse consent cookie");
                }
            }
            
            // Show/hide modal
            $("#cookie-settings-icon").on("click", function() {
                $("#cookie-settings-modal").fadeIn();
                loadCookieDetails();
            });
            
            $(".cookie-modal-close").on("click", function() {
                $("#cookie-settings-modal").fadeOut();
            });
            
            // Tab switching
            $(".cookie-tab").on("click", function() {
                const tabName = $(this).data("tab");
                
                $(".cookie-tab").removeClass("active");
                $(".cookie-tab-content").removeClass("active");
                
                $(this).addClass("active");
                $("#tab-" + tabName).addClass("active");
            });
            
            // Toggle category details
            $(".cookie-category-header").on("click", function(e) {
                if (!$(e.target).closest(".cookie-switch").length) {
                    $(this).next(".cookie-category-details").slideToggle();
                }
            });
            
            // Update preferences from switches
            function updateSwitches() {
                Object.keys(cookiePreferences).forEach(key => {
                    $("#cookie-" + key).prop("checked", cookiePreferences[key]);
                });
            }
            
            // Save preferences
            $("#save-cookie-preferences").on("click", function() {
                const preferences = {
                    necessary: true,
                    analytics: $("#cookie-analytics").is(":checked"),
                    marketing: $("#cookie-marketing").is(":checked"),
                    preferences: $("#cookie-preferences").is(":checked")
                };
                
                saveConsent(preferences);
            });
            
            // Accept all
            $("#accept-all-cookies").on("click", function() {
                const preferences = {
                    necessary: true,
                    analytics: true,
                    marketing: true,
                    preferences: true
                };
                
                saveConsent(preferences);
            });
            
            // Reject all
            $("#reject-all-cookies").on("click", function() {
                const preferences = {
                    necessary: true,
                    analytics: false,
                    marketing: false,
                    preferences: false
                };
                
                saveConsent(preferences);
            });
            
            // Save consent
            function saveConsent(preferences) {
                document.cookie = "heatmap_consent=" + JSON.stringify(preferences) + "; path=/; max-age=" + (365*24*60*60) + "; SameSite=Lax";
                
                // Trigger consent update event
                document.dispatchEvent(new CustomEvent("consentUpdated", { detail: preferences }));
                
                // Update server
                $.post(ajaxurl || "/wp-admin/admin-ajax.php", {
                    action: "update_cookie_preferences",
                    preferences: preferences
                });
                
                $("#cookie-settings-modal").fadeOut();
                
                // Show success message
                showNotification("Cookie-inställningar sparade!");
            }
            
            // Scan cookies
            $(".btn-scan-cookies").on("click", function() {
                const $button = $(this);
                $button.prop("disabled", true).text("Skannar...");
                
                const cookies = document.cookie.split(";").map(c => {
                    const [name, value] = c.trim().split("=");
                    return { name, value };
                }).filter(c => c.name);
                
                // Get detailed cookie info from server
                $.post(ajaxurl || "/wp-admin/admin-ajax.php", {
                    action: "get_cookie_details",
                    cookies: cookies
                }, function(response) {
                    if (response.success) {
                        displayCookieResults(response.data);
                    }
                    $button.prop("disabled", false).text("Skanna cookies");
                });
            });
            
            // Display cookie scan results
            function displayCookieResults(data) {
                let html = "<h4>Hittade " + data.cookies.length + " cookies</h4>";
                
                data.cookies.forEach(cookie => {
                    html += `
                        <div class="cookie-item">
                            <div>
                                <div class="cookie-item-name">${cookie.name}</div>
                                <div style="font-size: 12px; color: #6b7280;">
                                    ${cookie.category} • ${cookie.expiry}
                                </div>
                            </div>
                            <div class="cookie-item-value">${cookie.provider}</div>
                        </div>
                    `;
                });
                
                $("#cookie-scan-results").html(html);
            }
            
            // Load cookie details for categories
            function loadCookieDetails() {
                $(".cookie-list").each(function() {
                    const category = $(this).data("category");
                    // Load cookies for this category
                });
            }
            
            // Helper functions
            function getCookie(name) {
                const value = "; " + document.cookie;
                const parts = value.split("; " + name + "=");
                if (parts.length === 2) {
                    return parts.pop().split(";").shift();
                }
                return null;
            }
            
            function showNotification(message) {
                const $notification = $("<div>").addClass("cookie-notification").text(message);
                $("body").append($notification);
                
                setTimeout(() => {
                    $notification.addClass("show");
                }, 100);
                
                setTimeout(() => {
                    $notification.removeClass("show");
                    setTimeout(() => $notification.remove(), 300);
                }, 3000);
            }
        });
        ';
    }
    
    public function ajax_update_preferences() {
        $preferences = isset($_POST['preferences']) ? $_POST['preferences'] : array();
        
        // Log preference update
        heatmap_log('Cookie preferences updated: ' . json_encode($preferences), 'info');
        
        wp_send_json_success();
    }
    
    public function ajax_get_cookie_details() {
        $cookies = isset($_POST['cookies']) ? $_POST['cookies'] : array();
        $cookie_details = array();
        
        // Known cookie patterns
        $known_cookies = array(
            '_ga' => array('category' => 'analytics', 'provider' => 'Google Analytics', 'expiry' => '2 år'),
            '_gid' => array('category' => 'analytics', 'provider' => 'Google Analytics', 'expiry' => '24 timmar'),
            '_fbp' => array('category' => 'marketing', 'provider' => 'Facebook', 'expiry' => '3 månader'),
            'wordpress_logged_in_' => array('category' => 'necessary', 'provider' => 'WordPress', 'expiry' => 'Session'),
            'wp-settings-' => array('category' => 'preferences', 'provider' => 'WordPress', 'expiry' => '1 år'),
            'heatmap_consent' => array('category' => 'necessary', 'provider' => 'Heatmap Analytics', 'expiry' => '1 år'),
            'heatmap_session' => array('category' => 'analytics', 'provider' => 'Heatmap Analytics', 'expiry' => 'Session')
        );
        
        foreach ($cookies as $cookie) {
            $name = $cookie['name'];
            $details = array(
                'name' => $name,
                'category' => 'other',
                'provider' => 'Unknown',
                'expiry' => 'Unknown'
            );
            
            // Check if it's a known cookie
            foreach ($known_cookies as $pattern => $info) {
                if (strpos($name, $pattern) === 0) {
                    $details = array_merge($details, $info);
                    break;
                }
            }
            
            $cookie_details[] = $details;
        }
        
        wp_send_json_success(array('cookies' => $cookie_details));
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}
