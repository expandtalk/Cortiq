<?php
/**
 * Admin Settings - Enhanced Security & GDPR Compliant Version
 * Version: 2.0.1
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsAdminSettings {
    
    private $options;
    private $cookie_manager;
    private $security_manager;
    
    public function __construct($options, $cookie_manager = null, $security_manager = null) {
        $this->options = $options;
        $this->cookie_manager = $cookie_manager;
        $this->security_manager = $security_manager;
        
        add_action('admin_menu', array($this, 'admin_menu'));
        add_action('wp_ajax_detect_ip', array($this, 'detect_current_ip'));
        add_action('wp_ajax_scan_cookies', array($this, 'scan_website_cookies'));
        add_action('wp_ajax_import_cookie_settings', array($this, 'import_cookie_settings'));
        add_action('wp_ajax_add_manual_cookie', array($this, 'add_manual_cookie'));
        add_action('wp_ajax_delete_manual_cookie', array($this, 'delete_manual_cookie'));
        add_action('wp_ajax_update_manual_cookie', array($this, 'update_manual_cookie'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // Schedule GDPR cleanup
        if (!wp_next_scheduled('heatmap_gdpr_cleanup')) {
            wp_schedule_event(time(), 'daily', 'heatmap_gdpr_cleanup');
        }
        add_action('heatmap_gdpr_cleanup', array($this, 'gdpr_data_cleanup'));
    }
    
    public function admin_menu() {
        add_options_page(
            'Heatmap Analytics Settings',
            'Heatmap Analytics',
            'manage_options',
            'heatmap-analytics',
            array($this, 'admin_page')
        );
    }
    
    public function enqueue_admin_scripts($hook) {
        if ($hook === 'settings_page_heatmap-analytics') {
            wp_enqueue_script('jquery');
            wp_enqueue_style('wp-admin');
            
            // Add custom admin styles
            wp_add_inline_style('wp-admin', '
                .heatmap-tabs { margin: 20px 0; }
                .heatmap-tab-content { display: none; background: #fff; padding: 20px; border: 1px solid #ccd0d4; border-top: none; }
                .heatmap-tab-content.active { display: block; }
                .heatmap-card { background: #fff; border: 1px solid #ccd0d4; margin: 20px 0; border-radius: 6px; overflow: hidden; }
                .heatmap-card-header { background: #f8f9fa; padding: 15px 20px; border-bottom: 1px solid #e9ecef; font-weight: 600; }
                .heatmap-card-body { padding: 20px; }
                .heatmap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
                .status-active { background: #46b450; }
                .status-inactive { background: #dc3232; }
                .status-pending { background: #ffb900; }
                .cookie-category { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background: #fafafa; }
                .notice { margin: 10px 0 20px 0 !important; }
                .gdpr-notice { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin: 10px 0; }
                .security-info { background: #f3e5f5; border-left: 4px solid #9c27b0; padding: 12px; margin: 10px 0; }
                .error-message { background: #ffebee; border-left: 4px solid #f44336; padding: 12px; margin: 10px 0; }
                @media (max-width: 768px) {
                    .heatmap-grid { grid-template-columns: 1fr; }
                }
            ');
            
            // Register and enqueue admin script
            wp_register_script('heatmap-admin-script', '', array('jquery'), '2.0.0', true);
            wp_enqueue_script('heatmap-admin-script');
            
            // Add inline JavaScript for tab functionality and other features
            wp_add_inline_script('heatmap-admin-script', $this->get_admin_js());
        }
    }
    
    private function get_admin_js() {
        $nonce_detect_ip = wp_create_nonce("heatmap_detect_ip");
        $nonce_scan_cookies = wp_create_nonce("heatmap_scan_cookies");
        $nonce_add_cookie = wp_create_nonce("heatmap_add_cookie");
        $nonce_delete_cookie = wp_create_nonce("heatmap_delete_cookie");
        
        return <<<JS
        jQuery(document).ready(function($) {
            // Tab switching functionality
            $(".nav-tab").on("click", function(e) {
                e.preventDefault();
                
                var tabName = $(this).attr("href").replace("#tab-", "");
                
                // Remove active class from all tabs and contents
                $(".nav-tab").removeClass("nav-tab-active");
                $(".heatmap-tab-content").removeClass("active");
                
                // Add active class to clicked tab and corresponding content
                $(this).addClass("nav-tab-active");
                $("#tab-" + tabName).addClass("active");
                
                // Save current tab to localStorage
                localStorage.setItem("heatmap_active_tab", tabName);
            });
            
            // Restore last active tab
            var lastTab = localStorage.getItem("heatmap_active_tab");
            if (lastTab) {
                $('.nav-tab[href="#tab-' + lastTab + '"]').click();
            }
            
            // IP detection functionality with GDPR notice
            $("#detect-ip").on("click", function() {
                var \$button = $(this);
                var originalText = \$button.text();
                \$button.prop("disabled", true).text("Identifierar...");
                
                $.post(ajaxurl, {
                    action: "detect_ip",
                    nonce: "{$nonce_detect_ip}"
                }, function(response) {
                    if (response.success) {
                        var ipDisplay = response.data.is_anonymized ? 
                            response.data.ip + " (anonymiserad)" : 
                            response.data.ip;
                            
                        $("#detected-ip").html(
                            "→ Din IP: <strong>" + ipDisplay + "</strong>" +
                            '<div class="gdpr-notice" style="margin-top: 10px; font-size: 12px;">' +
                            '<strong>GDPR-information:</strong> ' + response.data.gdpr_notice +
                            '</div>'
                        );
                        
                        // Ask for confirmation before adding
                        if (confirm("Vill du lägga till denna IP-adress i exkluderingslistan? IP:n kommer att hashas för din integritet.")) {
                            var currentIPs = $("#excluded_ips").val();
                            if (currentIPs && !currentIPs.includes(response.data.ip)) {
                                $("#excluded_ips").val(currentIPs + "\\n" + response.data.ip);
                            } else if (!currentIPs) {
                                $("#excluded_ips").val(response.data.ip);
                            }
                        }
                    } else {
                        alert("Fel: " + response.data.message);
                    }
                    \$button.prop("disabled", false).text(originalText);
                }).fail(function() {
                    alert("Ett fel uppstod vid identifiering av IP-adress.");
                    \$button.prop("disabled", false).text(originalText);
                });
            });
            
            // Show/hide IP exclusion section
            $('input[name="ip_exclusion_enabled"]').on("change", function() {
                $("#ip-exclusion-section").toggle(this.checked);
            });
            
            // Character counters for text fields
            function addCharCounter(selector, maxLength) {
                var \$field = $(selector);
                if (\$field.length) {
                    var counterId = selector.replace('#', '') + '_counter';
                    \$field.after('<div id="' + counterId + '" style="text-align: right; font-size: 12px; color: #666; margin-top: 2px;">0 / ' + maxLength + ' tecken</div>');
                    
                    function updateCounter() {
                        var length = \$field.val().length;
                        var \$counter = $('#' + counterId);
                        \$counter.text(length + ' / ' + maxLength + ' tecken');
                        if (length > maxLength * 0.9) {
                            \$counter.css('color', '#e74c3c');
                        } else {
                            \$counter.css('color', '#666');
                        }
                    }
                    
                    \$field.on('input', updateCounter);
                    updateCounter();
                }
            }
            
            // Add character counters
            addCharCounter('#banner_text', 500);
            addCharCounter('#accept_button_text', 50);
            addCharCounter('#decline_button_text', 50);
            
            // Live preview updates for cookie banner
            $("#banner_text").on("input", function() {
                $("#preview-text").text($(this).val());
            });
            
            $("#accept_button_text").on("input", function() {
                $("#preview-accept").text($(this).val());
            });
            
            $("#decline_button_text").on("input", function() {
                $("#preview-decline").text($(this).val());
            });
            
            // Cookie Management functionality
            $("#scan-cookies-btn").on("click", function() {
                var \$button = $(this);
                \$button.prop("disabled", true).html('<span class="dashicons dashicons-update spin"></span> Scannar...');
                
                $.post(ajaxurl, {
                    action: "scan_cookies",
                    nonce: "{$nonce_scan_cookies}"
                }, function(response) {
                    if (response.success) {
                        $("#scan-results").show();
                        $("#detected-cookies-list").html(response.data.html);
                    } else {
                        alert("Fel vid scanning: " + response.data.message);
                    }
                    \$button.prop("disabled", false).html('<span class="dashicons dashicons-search"></span> Scanna Webbplats för Cookies');
                });
            });
            
            // Add manual cookie with validation
            $("#add-cookie-btn").on("click", function() {
                var cookieData = {
                    name: $("#cookie_name").val().trim(),
                    category: $("#cookie_category").val(),
                    purpose: $("#cookie_purpose").val().trim(),
                    provider: $("#cookie_provider").val().trim(),
                    expiry: $("#cookie_expiry").val().trim()
                };
                
                // Client-side validation
                if (!cookieData.name || cookieData.name.length > 50) {
                    alert("Cookie namn är obligatoriskt och får max vara 50 tecken");
                    return;
                }
                
                if (!cookieData.purpose || cookieData.purpose.length > 200) {
                    alert("Cookie syfte är obligatoriskt och får max vara 200 tecken");
                    return;
                }
                
                if (cookieData.provider.length > 100) {
                    alert("Leverantör får max vara 100 tecken");
                    return;
                }
                
                var \$button = $(this);
                \$button.prop("disabled", true).text("Lägger till...");
                
                $.post(ajaxurl, {
                    action: "add_manual_cookie",
                    nonce: "{$nonce_add_cookie}",
                    cookie_data: cookieData
                }, function(response) {
                    if (response.success) {
                        // Clear form
                        $("#add-cookie-form input, #add-cookie-form select").val("");
                        $("#cookie_category").val("necessary");
                        
                        // Refresh cookie list
                        $("#current-cookies-list").html(response.data.html);
                        
                        alert("Cookie tillagd framgångsrikt!");
                    } else {
                        alert("Fel vid tillägg: " + response.data.message);
                    }
                    \$button.prop("disabled", false).text("Lägg till Cookie");
                });
            });
            
            // Delete cookie
            $(document).on("click", ".delete-cookie", function() {
                if (!confirm("Är du säker på att du vill ta bort denna cookie?")) {
                    return;
                }
                
                var cookieId = $(this).data("cookie-id");
                var \$row = $(this).closest("tr");
                
                $.post(ajaxurl, {
                    action: "delete_manual_cookie",
                    nonce: "{$nonce_delete_cookie}",
                    cookie_id: cookieId
                }, function(response) {
                    if (response.success) {
                        \$row.fadeOut(function() {
                            \$row.remove();
                        });
                    } else {
                        alert("Fel vid borttagning: " + response.data.message);
                    }
                });
            });
            
            // Form validation on submit
            $("form").on("submit", function() {
                var isValid = true;
                
                // Validate tracking ID format
                var trackingId = $("#tracking_id").val().trim();
                if (trackingId && !/^[a-zA-Z0-9-_]{1,50}$/.test(trackingId)) {
                    alert("Tracking ID får endast innehålla bokstäver, siffror, bindestreck och understreck (max 50 tecken)");
                    isValid = false;
                }
                
                // Validate email
                var email = $("#controller_email").val().trim();
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    alert("Ange en giltig e-postadress");
                    isValid = false;
                }
                
                return isValid;
            });
        });
JS;
    }
    
    public function admin_page() {
        // Handle form submission
        $settings_saved = false;
        $error_message = '';
        
        if (isset($_POST['submit']) && isset($_POST['heatmap_analytics_nonce'])) {
            $result = $this->save_settings();
            if ($result === true) {
                $settings_saved = true;
            } else {
                $error_message = $result;
            }
        }
        
        // Get fresh options after potential save
        $this->options = get_option('heatmap_analytics_options', array());
        
        ?>
        <div class="wrap">
            <h1>🔥 Heatmap Analytics Pro - Expandtalk.se</h1>
            <p class="description">Professionell heatmap och användaranalys med GDPR-kompatibilitet</p>
            
            <?php
            // Show save confirmation message
            if ($settings_saved || get_transient('heatmap_settings_saved')) {
                delete_transient('heatmap_settings_saved');
                echo '<div class="notice notice-success is-dismissible"><p><strong>Inställningar sparade!</strong> Dina ändringar har sparats.</p></div>';
            }
            
            // Show error message if any
            if ($error_message || get_transient('heatmap_settings_error')) {
                $error = $error_message ?: get_transient('heatmap_settings_error');
                delete_transient('heatmap_settings_error');
                echo '<div class="notice notice-error is-dismissible"><p><strong>Fel:</strong> ' . esc_html($error) . '</p></div>';
            }
            ?>
            
            <!-- GDPR Compliance Notice -->
            <div class="gdpr-notice">
                <h3>🔒 GDPR-Efterlevnad</h3>
                <p>Detta plugin är designat med integritet i fokus:</p>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li>IP-adresser anonymiseras som standard</li>
                    <li>Exkluderade IP-adresser lagras hashat, inte i klartext</li>
                    <li>Automatisk datarensning enligt inställd bevarandeperiod</li>
                    <li>Full transparens och användarkontroll över data</li>
                </ul>
            </div>
            
            <!-- Navigation Tabs -->
            <div class="nav-tab-wrapper heatmap-tabs">
                <a href="#tab-tracking" class="nav-tab nav-tab-active">📊 Heatmap Tracking</a>
                <a href="#tab-cookies" class="nav-tab">🍪 Cookie Management</a>
                <a href="#tab-gdpr" class="nav-tab">🔒 GDPR & Privacy</a>
                <a href="#tab-analytics" class="nav-tab">📈 Google Analytics</a>
                <a href="#tab-forms" class="nav-tab">📝 Form Analytics</a>
            </div>
            
            <form method="post" action="">
                <?php wp_nonce_field('heatmap_analytics_settings', 'heatmap_analytics_nonce'); ?>
                
                <!-- Heatmap Tracking Tab -->
                <div id="tab-tracking" class="heatmap-tab-content active">
                    <?php $this->render_tracking_tab(); ?>
                </div>
                
                <!-- Cookie Management Tab -->
                <div id="tab-cookies" class="heatmap-tab-content">
                    <?php $this->render_cookies_tab(); ?>
                </div>
                
                <!-- GDPR & Privacy Tab -->
                <div id="tab-gdpr" class="heatmap-tab-content">
                    <?php $this->render_gdpr_tab(); ?>
                </div>
                
                <!-- Google Analytics Tab -->
                <div id="tab-analytics" class="heatmap-tab-content">
                    <?php $this->render_analytics_tab(); ?>
                </div>
                
                <!-- Form Analytics Tab -->
                <div id="tab-forms" class="heatmap-tab-content">
                    <?php $this->render_forms_tab(); ?>
                </div>
                
                <?php submit_button('Spara alla inställningar', 'primary', 'submit', true, array('style' => 'margin-top: 30px; padding: 15px 30px; font-size: 16px;')); ?>
            </form>
        </div>
        <?php
    }
    
    private function render_tracking_tab() {
        $tracking_enabled = isset($this->options['tracking_enabled']) ? $this->options['tracking_enabled'] : false;
        $tracking_id = isset($this->options['tracking_id']) ? $this->options['tracking_id'] : '';
        $track_mobile = isset($this->options['track_mobile']) ? $this->options['track_mobile'] : true;
        $excluded_roles = isset($this->options['excluded_roles']) ? $this->options['excluded_roles'] : array();
        $sampling_rate = isset($this->options['sampling_rate']) ? $this->options['sampling_rate'] : 100;
        $ip_exclusion_enabled = isset($this->options['ip_exclusion_enabled']) ? $this->options['ip_exclusion_enabled'] : false;
        $excluded_ips = isset($this->options['excluded_ips']) ? $this->options['excluded_ips'] : array();
        
        ?>
        <div class="heatmap-card">
            <div class="heatmap-card-header">
                <span class="status-indicator <?php echo $tracking_enabled ? 'status-active' : 'status-inactive'; ?>"></span>
                Grundinställningar för Heatmap Tracking
            </div>
            <div class="heatmap-card-body">
                <div class="heatmap-grid">
                    <div>
                        <h4>🔧 Grundkonfiguration</h4>
                        
                        <p><label>
                            <input type="checkbox" name="tracking_enabled" value="1" <?php checked($tracking_enabled); ?>>
                            <strong>Aktivera heatmap tracking</strong>
                        </label></p>
                        
                        <p>
                            <label for="tracking_id"><strong>Tracking ID:</strong></label><br>
                            <input type="text" id="tracking_id" name="tracking_id" value="<?php echo esc_attr($tracking_id); ?>" 
                                   style="width: 100%; padding: 8px;" placeholder="Din tracking ID från Expandtalk.se dashboard"
                                   pattern="[a-zA-Z0-9-_]{1,50}" maxlength="50">
                            <small>Hämta ditt tracking ID från <a href="https://web-focus-analyzer.lovable.app/dashboard" target="_blank">Expandtalk.se Dashboard</a></small>
                            <small style="display: block; color: #666;">Format: endast bokstäver, siffror, bindestreck och understreck (max 50 tecken)</small>
                        </p>
                        
                        <p><label>
                            <input type="checkbox" name="track_mobile" value="1" <?php checked($track_mobile); ?>>
                            Spåra mobila enheter
                        </label></p>
                        
                        <p>
                            <label for="sampling_rate"><strong>Sampling Rate (%):</strong></label><br>
                            <input type="number" id="sampling_rate" name="sampling_rate" value="<?php echo esc_attr($sampling_rate); ?>" 
                                   min="1" max="100" style="width: 100px;">
                            <small>Spåra bara X% av besökare för att minska belastning</small>
                        </p>
                    </div>
                    
                    <div>
                        <h4>👥 Användarexkludering</h4>
                        
                        <p><strong>Uteslut användarroller:</strong></p>
                        <?php
                        $roles = get_editable_roles();
                        foreach ($roles as $role_name => $role_info) {
                            $checked = in_array($role_name, $excluded_roles) ? 'checked' : '';
                            echo '<label><input type="checkbox" name="excluded_roles[]" value="' . esc_attr($role_name) . '" ' . $checked . '> ' . esc_html($role_info['name']) . '</label><br>';
    
    /**
     * Google Consent Mode v2 Section Callback
     */
    public function gcm_section_callback() {
        echo '<div class="notice notice-info inline">';
        echo '<p><strong>Om Google Consent Mode v2:</strong></p>';
        echo '<ul>';
        echo '<li>• <strong>Syfte:</strong> Förbättrar konverteringsmätning i Google Ads även när cookies nekas</li>';
        echo '<li>• <strong>Hur det fungerar:</strong> Skickar anonymiserad data till Google även i "denied" läge</li>';
        echo '<li>• <strong>Juridisk risk:</strong> Vissa legal avdelningar godkänner inte detta</li>';
        echo '</ul>';
        echo '</div>';
    }

    /**
     * GCM v2 Enabled Callback
     */
    public function gcm_v2_enabled_callback() {
        $options = get_option('heatmap_analytics_options');
        $checked = isset($options['gcm_v2_enabled']) ? $options['gcm_v2_enabled'] : false;
        
        echo '<label>';
        echo '<input type="checkbox" name="heatmap_analytics_options[gcm_v2_enabled]" value="1" ' . checked(1, $checked, false) . ' />';
        echo ' Aktivera Google Consent Mode v2';
        echo '</label>';
        
        echo '<div class="notice notice-warning inline" style="margin-top: 10px;">';
        echo '<p><strong>⚠️ Viktigt att förstå:</strong></p>';
        echo '<ul>';
        echo '<li>• <strong>Aktiverad:</strong> Google scripts laddas i "denied" läge och skickar viss anonymiserad data</li>';
        echo '<li>• <strong>Inaktiverad:</strong> Inga Google scripts laddas förrän användaren ger explicit samtycke (strikt GDPR)</li>';
        echo '<li>• <strong>Rekommendation:</strong> Rådfråga juridisk avdelning innan aktivering</li>';
        echo '</ul>';
        echo '</div>';
    }

    /**
     * GCM Measurement ID Callback
     */
    public function gcm_measurement_id_callback() {
        $options = get_option('heatmap_analytics_options');
        $value = isset($options['gcm_measurement_id']) ? $options['gcm_measurement_id'] : '';
        
        echo '<input type="text" name="heatmap_analytics_options[gcm_measurement_id]" value="' . esc_attr($value) . '" placeholder="G-XXXXXXXXXX" class="regular-text" />';
        echo '<p class="description">Google Analytics 4 Measurement ID (krävs endast om GCM v2 är aktiverat)</p>';
    }

    /**
     * GCM Container ID Callback
     */
    public function gcm_container_id_callback() {
        $options = get_option('heatmap_analytics_options');
        $value = isset($options['gcm_container_id']) ? $options['gcm_container_id'] : '';
        
        echo '<input type="text" name="heatmap_analytics_options[gcm_container_id]" value="' . esc_attr($value) . '" placeholder="GTM-XXXXXXX" class="regular-text" />';
        echo '<p class="description">Google Tag Manager Container ID (valfritt)</p>';
    }
                        ?>
                    </div>
                </div>
                
                <hr style="margin: 30px 0;">
                
                <div>
                    <h4>🌐 IP-adress Exkludering (GDPR-säker)</h4>
                    
                    <div class="security-info">
                        <strong>Säkerhetsinformation:</strong> IP-adresser lagras hashat med unik salt för maximal integritet. 
                        Endast hash-värden sparas i databasen, aldrig IP-adresser i klartext.
                    </div>
                    
                    <p><label>
                        <input type="checkbox" name="ip_exclusion_enabled" value="1" <?php checked($ip_exclusion_enabled); ?>>
                        <strong>Aktivera IP-exkludering</strong>
                    </label></p>
                    
                    <div id="ip-exclusion-section" style="<?php echo $ip_exclusion_enabled ? '' : 'display:none;'; ?>">
                        <p>
                            <label for="excluded_ips"><strong>IP-adresser att exkludera:</strong></label><br>
                            <textarea id="excluded_ips" name="excluded_ips" rows="3" style="width: 100%;" 
                                      placeholder="192.168.1.1&#10;10.0.0.1&#10;2001:db8::1"><?php echo esc_textarea(implode("\n", $excluded_ips)); ?></textarea>
                            <small>En IP-adress per rad. Stöder både IPv4 och IPv6. CIDR-notation stöds (t.ex. 192.168.1.0/24).</small>
                        </p>
                        
                        <p>
                            <button type="button" id="detect-ip" class="button">🔍 Identifiera min IP</button>
                            <span id="detected-ip"></span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    private function render_cookies_tab() {
        $cookie_banner_enabled = isset($this->options['cookie_banner_enabled']) ? $this->options['cookie_banner_enabled'] : false;
        $cookie_widget_enabled = isset($this->options['cookie_widget_enabled']) ? $this->options['cookie_widget_enabled'] : false;
        $banner_position = isset($this->options['banner_position']) ? $this->options['banner_position'] : 'bottom';
        $banner_text = isset($this->options['banner_text']) ? $this->options['banner_text'] : 'Vi använder cookies för att förbättra din upplevelse.';
        $accept_button_text = isset($this->options['accept_button_text']) ? $this->options['accept_button_text'] : 'Acceptera';
        $decline_button_text = isset($this->options['decline_button_text']) ? $this->options['decline_button_text'] : 'Avböj';
        
        ?>
        <!-- Cookie Banner Configuration -->
        <div class="heatmap-card">
            <div class="heatmap-card-header">
                <span class="status-indicator <?php echo $cookie_banner_enabled ? 'status-active' : 'status-inactive'; ?>"></span>
                Cookie Banner Konfiguration
            </div>
            <div class="heatmap-card-body">
                <div class="heatmap-grid">
                    <div>
                        <h4>🍪 Banner Inställningar</h4>
                        
                        <p><label>
                            <input type="checkbox" name="cookie_banner_enabled" value="1" <?php checked($cookie_banner_enabled); ?>>
                            <strong>Aktivera cookie banner</strong>
                        </label></p>
                        
                        <p><label>
                            <input type="checkbox" name="cookie_widget_enabled" value="1" <?php checked($cookie_widget_enabled); ?>>
                            <strong>Aktivera cookie widget</strong>
                            <br><small>Visar en flytande ikon i nedre högra hörnet för cookie-inställningar</small>
                        </label></p>
                        
                        <p>
                            <label for="banner_position"><strong>Banner Position:</strong></label><br>
                            <select id="banner_position" name="banner_position" style="width: 100%;">
                                <option value="top" <?php selected($banner_position, 'top'); ?>>Toppen av sidan</option>
                                <option value="bottom" <?php selected($banner_position, 'bottom'); ?>>Botten av sidan</option>
                                <option value="center" <?php selected($banner_position, 'center'); ?>>Centrerad overlay</option>
                            </select>
                        </p>
                        
                        <p>
                            <label for="banner_text"><strong>Banner Text:</strong></label><br>
                            <textarea id="banner_text" name="banner_text" rows="3" style="width: 100%;" maxlength="500"><?php echo esc_textarea($banner_text); ?></textarea>
                        </p>
                    </div>
                    
                    <div>
                        <h4>🔘 Knapp Inställningar</h4>
                        
                        <p>
                            <label for="accept_button_text"><strong>Acceptera Knapp Text:</strong></label><br>
                            <input type="text" id="accept_button_text" name="accept_button_text" 
                                   value="<?php echo esc_attr($accept_button_text); ?>" style="width: 100%;" maxlength="50">
                        </p>
                        
                        <p>
                            <label for="decline_button_text"><strong>Avböj Knapp Text:</strong></label><br>
                            <input type="text" id="decline_button_text" name="decline_button_text" 
                                   value="<?php echo esc_attr($decline_button_text); ?>" style="width: 100%;" maxlength="50">
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Manual Cookie Management -->
        <div class="heatmap-card" style="margin-top: 20px;">
            <div class="heatmap-card-header">
                <span class="status-indicator status-active"></span>
                Manuell Cookie Hantering
            </div>
            <div class="heatmap-card-body">
                <div class="heatmap-grid">
                    <div>
                        <h4>🔍 Automatisk Scanning</h4>
                        
                        <button type="button" id="scan-cookies-btn" class="button button-secondary" style="margin-bottom: 15px;">
                            <span class="dashicons dashicons-search" style="vertical-align: middle;"></span>
                            Scanna Webbplats för Cookies
                        </button>
                        
                        <div id="scan-results" style="display: none;">
                            <p><strong>Scanningsresultat:</strong></p>
                            <div id="detected-cookies-list"></div>
                        </div>
                    </div>
                    
                    <div>
                        <h4>➕ Lägg till Cookie Manuellt</h4>
                        
                        <div id="add-cookie-form">
                            <p>
                                <label for="cookie_name"><strong>Cookie Namn:</strong></label><br>
                                <input type="text" id="cookie_name" style="width: 100%;" placeholder="_ga, fbp, etc." maxlength="50">
                            </p>
                            
                            <p>
                                <label for="cookie_category"><strong>Kategori:</strong></label><br>
                                <select id="cookie_category" style="width: 100%;">
                                    <option value="necessary">Nödvändiga</option>
                                    <option value="analytics">Analytics</option>
                                    <option value="marketing">Marknadsföring</option>
                                    <option value="preferences">Preferenser</option>
                                </select>
                            </p>
                            
                            <p>
                                <label for="cookie_purpose"><strong>Syfte:</strong></label><br>
                                <input type="text" id="cookie_purpose" style="width: 100%;" placeholder="Spåra användarinteraktioner" maxlength="200">
                            </p>
                            
                            <p>
                                <label for="cookie_provider"><strong>Leverantör:</strong></label><br>
                                <input type="text" id="cookie_provider" style="width: 100%;" placeholder="Google, Facebook, etc." maxlength="100">
                            </p>
                            
                            <p>
                                <label for="cookie_expiry"><strong>Utgångstid:</strong></label><br>
                                <input type="text" id="cookie_expiry" style="width: 100%;" placeholder="2 år, Session, etc." maxlength="50">
                            </p>
                            
                            <button type="button" id="add-cookie-btn" class="button button-primary">
                                Lägg till Cookie
                            </button>
                        </div>
                    </div>
                </div>
                
                <hr style="margin: 30px 0;">
                
                <!-- Current Cookies List -->
                <div>
                    <h4>📋 Nuvarande Cookies</h4>
                    <div id="current-cookies-list">
                        <?php 
                        if ($this->cookie_manager && method_exists($this->cookie_manager, 'render_cookies_list')) {
                            $this->cookie_manager->render_cookies_list(); 
                        } else {
                            echo '<p style="color: #666; font-style: italic;">Cookie manager är inte tillgänglig.</p>';
                        }
                        ?>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    private function render_gdpr_tab() {
        $gdpr_enabled = isset($this->options['gdpr_enabled']) ? $this->options['gdpr_enabled'] : false;
        $anonymize_ip = isset($this->options['anonymize_ip']) ? $this->options['anonymize_ip'] : true;
        $data_retention_days = isset($this->options['data_retention_days']) ? $this->options['data_retention_days'] : 90;
        $privacy_policy_url = isset($this->options['privacy_policy_url']) ? $this->options['privacy_policy_url'] : '';
        $controller_email = isset($this->options['controller_email']) ? $this->options['controller_email'] : '';
        
        ?>
        <div class="heatmap-card">
            <div class="heatmap-card-header">
                <span class="status-indicator <?php echo $gdpr_enabled ? 'status-active' : 'status-inactive'; ?>"></span>
                GDPR Kompatibilitet & Dataskydd
            </div>
            <div class="heatmap-card-body">
                <!-- GDPR MASTER CHECKBOX -->
                <p><label>
                    <input type="checkbox" name="gdpr_enabled" value="1" <?php checked($gdpr_enabled); ?>>
                    <strong>Aktivera GDPR-efterlevnad</strong>
                    <br><small>Måste vara aktiverat för att cookie banner och widget ska visas</small>
                </label></p>
                
                <hr style="margin: 20px 0;">
                
                <div class="gdpr-notice" style="margin-bottom: 20px;">
                    <strong>Privacy by Design:</strong> Detta plugin följer GDPR:s principer för inbyggt dataskydd. 
                    All känslig data krypteras eller hashas, och dataminimering tillämpas genomgående.
                </div>
                
                <p><label>
                    <input type="checkbox" name="anonymize_ip" value="1" <?php checked($anonymize_ip); ?>>
                    <strong>Anonymisera IP-adresser</strong> (Rekommenderat)
                    <br><small>Tar bort sista oktetten från IPv4 (xxx.xxx.xxx.0) och de sista 80 bitarna från IPv6</small>
                </label></p>
                
                <p>
                    <label for="data_retention_days"><strong>Databevarande (dagar):</strong></label><br>
                    <input type="number" id="data_retention_days" name="data_retention_days" 
                           value="<?php echo esc_attr($data_retention_days); ?>" min="1" max="365" style="width: 100px;">
                    <br><small>GDPR rekommenderar kortast möjliga bevarandetid. Standard: 90 dagar</small>
                </p>
                
                <p>
                    <label for="privacy_policy_url"><strong>Integritetspolicy URL:</strong></label><br>
                    <input type="url" id="privacy_policy_url" name="privacy_policy_url" 
                           value="<?php echo esc_attr($privacy_policy_url); ?>" style="width: 100%;" maxlength="255">
                    <small>Länk till din integritetspolicy där du beskriver hur data hanteras</small>
                </p>
                
                <p>
                    <label for="controller_email"><strong>Personuppgiftsansvarig Email:</strong></label><br>
                    <input type="email" id="controller_email" name="controller_email" 
                           value="<?php echo esc_attr($controller_email); ?>" style="width: 100%;" maxlength="100">
                    <small>Kontaktuppgift för GDPR-förfrågningar</small>
                </p>
                
                <hr style="margin: 20px 0;">
                
                <h4>📊 GDPR Data Hantering</h4>
                <?php
                $last_cleanup = get_option('heatmap_last_cleanup', false);
                $next_cleanup = wp_next_scheduled('heatmap_gdpr_cleanup');
                ?>
                <p>
                    <strong>Automatisk datarensning:</strong> 
                    <?php if ($last_cleanup): ?>
                        Senast körd: <?php echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($last_cleanup)); ?>
                    <?php else: ?>
                        Ingen rensning utförd ännu
                    <?php endif; ?>
                </p>
                <?php if ($next_cleanup): ?>
                <p>
                    <strong>Nästa schemalagda rensning:</strong> 
                    <?php echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $next_cleanup); ?>
                </p>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
    
    private function render_analytics_tab() {
        $ga_integration_enabled = isset($this->options['ga_integration_enabled']) ? $this->options['ga_integration_enabled'] : false;
        $ga_measurement_id = isset($this->options['ga_measurement_id']) ? $this->options['ga_measurement_id'] : '';
        
        ?>
        <div class="heatmap-card">
            <div class="heatmap-card-header">
                <span class="status-indicator <?php echo $ga_integration_enabled ? 'status-active' : 'status-inactive'; ?>"></span>
                Google Analytics 4 Integration
            </div>
            <div class="heatmap-card-body">
                <p><label>
                    <input type="checkbox" name="ga_integration_enabled" value="1" <?php checked($ga_integration_enabled); ?>>
                    <strong>Aktivera Google Analytics integration</strong>
                </label></p>
                
                <p>
                    <label for="ga_measurement_id"><strong>GA4 Measurement ID:</strong></label><br>
                    <input type="text" id="ga_measurement_id" name="ga_measurement_id" 
                           value="<?php echo esc_attr($ga_measurement_id); ?>" style="width: 100%;" 
                           placeholder="G-XXXXXXXXXX" pattern="G-[A-Z0-9]{10}" maxlength="20">
                    <small>Format: G-XXXXXXXXXX (10 tecken efter G-)</small>
                </p>
            </div>
        </div>
        <?php
    }
    
    private function render_forms_tab() {
        $form_tracking_enabled = isset($this->options['form_tracking_enabled']) ? $this->options['form_tracking_enabled'] : false;
        
        ?>
        <div class="heatmap-card">
            <div class="heatmap-card-header">
                <span class="status-indicator <?php echo $form_tracking_enabled ? 'status-active' : 'status-inactive'; ?>"></span>
                Formulär Analytics & Tracking
            </div>
            <div class="heatmap-card-body">
                <p><label>
                    <input type="checkbox" name="form_tracking_enabled" value="1" <?php checked($form_tracking_enabled); ?>>
                    <strong>Aktivera formulär tracking</strong>
                </label></p>
                
                <div class="gdpr-notice" style="margin-top: 15px;">
                    <strong>GDPR-varning:</strong> Formulärspårning kan samla in känslig data. 
                    Säkerställ att du har användares samtycke och undvik att spåra lösenordsfält eller känslig personlig information.
                </div>
            </div>
        </div>
        <?php
    }
    
    private function save_settings() {
        if (!isset($_POST['heatmap_analytics_nonce']) || !wp_verify_nonce($_POST['heatmap_analytics_nonce'], 'heatmap_analytics_settings')) {
            return 'Säkerhetskontroll misslyckades';
        }
        
        if (!current_user_can('manage_options')) {
            return 'Otillräckliga behörigheter';
        }
        
        $updated_options = array();
        
        // Validate and sanitize tracking ID
        $tracking_id = sanitize_text_field($_POST['tracking_id']);
        if (!empty($tracking_id)) {
            if (!preg_match('/^[a-zA-Z0-9-_]{1,50}$/', $tracking_id)) {
                return 'Ogiltigt tracking ID format. Använd endast bokstäver, siffror, bindestreck och understreck (max 50 tecken).';
            }
        }
        $updated_options['tracking_id'] = $tracking_id;
        
        // Validate and hash excluded IPs
        $excluded_ips = array();
        $excluded_ip_hashes = array();
        
        if (!empty($_POST['excluded_ips'])) {
            $ips = array_filter(array_map('trim', explode("\n", $_POST['excluded_ips'])));
            foreach ($ips as $ip) {
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    $excluded_ips[] = $ip;
                    // Hash IP for GDPR-safe storage
                    $excluded_ip_hashes[] = wp_hash($ip);
                }
            }
        }
        
        $updated_options['excluded_ips'] = $excluded_ips;
        update_option('heatmap_excluded_ip_hashes', $excluded_ip_hashes);
        
        // Boolean fields
        $updated_options['tracking_enabled'] = isset($_POST['tracking_enabled']) ? 1 : 0;
        $updated_options['gdpr_enabled'] = isset($_POST['gdpr_enabled']) ? 1 : 0;
        $updated_options['track_mobile'] = isset($_POST['track_mobile']) ? 1 : 0;
        $updated_options['ip_exclusion_enabled'] = isset($_POST['ip_exclusion_enabled']) ? 1 : 0;
        $updated_options['cookie_banner_enabled'] = isset($_POST['cookie_banner_enabled']) ? 1 : 0;
        $updated_options['cookie_widget_enabled'] = isset($_POST['cookie_widget_enabled']) ? 1 : 0;
        $updated_options['anonymize_ip'] = isset($_POST['anonymize_ip']) ? 1 : 0;
        $updated_options['ga_integration_enabled'] = isset($_POST['ga_integration_enabled']) ? 1 : 0;
        $updated_options['form_tracking_enabled'] = isset($_POST['form_tracking_enabled']) ? 1 : 0;
        
        // Text fields with length limits
        $updated_options['banner_text'] = substr(sanitize_textarea_field($_POST['banner_text']), 0, 500);
        $updated_options['accept_button_text'] = substr(sanitize_text_field($_POST['accept_button_text']), 0, 50);
        $updated_options['decline_button_text'] = substr(sanitize_text_field($_POST['decline_button_text']), 0, 50);
        
        // GA Measurement ID validation
        $ga_measurement_id = sanitize_text_field($_POST['ga_measurement_id']);
        if (!empty($ga_measurement_id) && !preg_match('/^G-[A-Z0-9]{10}$/', $ga_measurement_id)) {
            return 'Ogiltigt GA4 Measurement ID format. Ska vara G-XXXXXXXXXX';
        }
        $updated_options['ga_measurement_id'] = $ga_measurement_id;
        
        // URL validation
        $privacy_policy_url = esc_url_raw($_POST['privacy_policy_url']);
        $updated_options['privacy_policy_url'] = substr($privacy_policy_url, 0, 255);
        
        // Email validation
        $controller_email = sanitize_email($_POST['controller_email']);
        if (!empty($controller_email) && !is_email($controller_email)) {
            return 'Ogiltig e-postadress';
        }
        $updated_options['controller_email'] = substr($controller_email, 0, 100);
        
        // Select field validation
        $banner_position = sanitize_text_field($_POST['banner_position']);
        if (!in_array($banner_position, ['top', 'bottom', 'center'])) {
            $banner_position = 'bottom';
        }
        $updated_options['banner_position'] = $banner_position;
        
        // Numeric fields with min/max validation
        $sampling_rate = intval($_POST['sampling_rate']);
        $updated_options['sampling_rate'] = max(1, min(100, $sampling_rate));
        
        $data_retention_days = intval($_POST['data_retention_days']);
        $updated_options['data_retention_days'] = max(1, min(365, $data_retention_days));
        
        // Array fields with validation
        $allowed_roles = array_keys(get_editable_roles());
        $updated_options['excluded_roles'] = isset($_POST['excluded_roles']) ? 
            array_intersect($_POST['excluded_roles'], $allowed_roles) : array();
        
        // Merge with existing options to preserve any fields not in form
        $existing_options = get_option('heatmap_analytics_options', array());
        $final_options = array_merge($existing_options, $updated_options);
        
        // Save options
        update_option('heatmap_analytics_options', $final_options);
        $this->options = $final_options;
        
        // Update all managers if core plugin is available
        global $heatmap_core;
        if ($heatmap_core && method_exists($heatmap_core, 'update_options')) {
            $heatmap_core->update_options($final_options);
        }
        
        set_transient('heatmap_settings_saved', true, 5);
        update_option('heatmap_last_settings_update', current_time('mysql'));
        
        return true;
    }
    
    public function detect_current_ip() {
        check_ajax_referer('heatmap_detect_ip', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Otillräckliga behörigheter']);
        }
        
        $ip = $_SERVER['REMOTE_ADDR'];
        
        if (!$ip) {
            wp_send_json_error(['message' => 'Kunde inte identifiera en giltig IP-adress']);
        }
        
        // Check if IP anonymization is enabled
        $display_ip = $ip;
        $is_anonymized = false;
        
        if (isset($this->options['anonymize_ip']) && $this->options['anonymize_ip']) {
            // Simple anonymization for display
            $parts = explode('.', $ip);
            if (count($parts) == 4) {
                $parts[3] = '0';
                $display_ip = implode('.', $parts);
                $is_anonymized = true;
            }
        }
        
        wp_send_json_success([
            'ip' => $display_ip,
            'is_anonymized' => $is_anonymized,
            'gdpr_notice' => 'IP-adressen används endast för exkludering från spårning. Den lagras hashat med en unik salt för maximal integritet och kan inte återställas till ursprunglig form.'
        ]);
    }
    
    public function scan_website_cookies() {
        check_ajax_referer('heatmap_scan_cookies', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Otillräckliga behörigheter']);
        }
        
        // This would perform actual cookie scanning
        // For now, return mock results
        $html = '<p>Scanning pågår... (denna funktion är under utveckling)</p>';
        
        wp_send_json_success(['html' => $html]);
    }
    
    public function import_cookie_settings() {
        // Placeholder for import functionality
        wp_send_json_error(['message' => 'Import funktion är under utveckling']);
    }
    
    public function add_manual_cookie() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Otillräckliga behörigheter']);
        }
        
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'heatmap_add_cookie')) {
            wp_send_json_error(['message' => 'Säkerhetskontroll misslyckades']);
        }
        
        $cookie_data = $_POST['cookie_data'];
        
        // Validate and sanitize with length limits
        $cookie_data['name'] = substr(sanitize_text_field($cookie_data['name']), 0, 50);
        $cookie_data['purpose'] = substr(sanitize_textarea_field($cookie_data['purpose']), 0, 200);
        $cookie_data['provider'] = substr(sanitize_text_field($cookie_data['provider']), 0, 100);
        $cookie_data['expiry'] = substr(sanitize_text_field($cookie_data['expiry']), 0, 50);
        
        // Validate required fields
        if (empty($cookie_data['name']) || empty($cookie_data['purpose'])) {
            wp_send_json_error(['message' => 'Cookie namn och syfte är obligatoriska']);
        }
        
        // Validate category
        $allowed_categories = ['necessary', 'analytics', 'marketing', 'preferences'];
        if (!in_array($cookie_data['category'], $allowed_categories)) {
            wp_send_json_error(['message' => 'Ogiltig kategori']);
        }
        
        // Add cookie via cookie manager
        if ($this->cookie_manager && method_exists($this->cookie_manager, 'add_manual_cookie')) {
            $result = $this->cookie_manager->add_manual_cookie($cookie_data);
            
            if ($result) {
                wp_send_json_success([
                    'message' => 'Cookie tillagd framgångsrikt',
                    'html' => $this->cookie_manager->get_cookies_list_html()
                ]);
            }
        }
        
        wp_send_json_error(['message' => 'Kunde inte lägga till cookie']);
    }
    
    public function delete_manual_cookie() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Otillräckliga behörigheter']);
        }
        
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'heatmap_delete_cookie')) {
            wp_send_json_error(['message' => 'Säkerhetskontroll misslyckades']);
        }
        
        $cookie_id = sanitize_text_field($_POST['cookie_id']);
        
        // Delete cookie via cookie manager
        if ($this->cookie_manager && method_exists($this->cookie_manager, 'delete_manual_cookie')) {
            $result = $this->cookie_manager->delete_manual_cookie($cookie_id);
            
            if ($result) {
                wp_send_json_success(['message' => 'Cookie borttagen framgångsrikt']);
            }
        }
        
        wp_send_json_error(['message' => 'Kunde inte ta bort cookie']);
    }
    
    public function update_manual_cookie() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Otillräckliga behörigheter']);
        }
        
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'heatmap_update_cookie')) {
            wp_send_json_error(['message' => 'Säkerhetskontroll misslyckades']);
        }
        
        $cookie_id = sanitize_text_field($_POST['cookie_id']);
        $cookie_data = $_POST['cookie_data'];
        
        // Update cookie via cookie manager
        if ($this->cookie_manager && method_exists($this->cookie_manager, 'update_manual_cookie')) {
            $result = $this->cookie_manager->update_manual_cookie($cookie_id, $cookie_data);
            
            if ($result) {
                wp_send_json_success([
                    'message' => 'Cookie uppdaterad framgångsrikt',
                    'html' => $this->cookie_manager->get_cookies_list_html()
                ]);
            }
        }
        
        wp_send_json_error(['message' => 'Kunde inte uppdatera cookie']);
    }
    
    public function gdpr_data_cleanup() {
        $retention_days = isset($this->options['data_retention_days']) ? 
            intval($this->options['data_retention_days']) : 90;
        
        // Log cleanup
        heatmap_log('GDPR data cleanup executed with retention: ' . $retention_days . ' days', 'info');
        
        update_option('heatmap_last_cleanup', current_time('mysql'));
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
        
        // Update dependencies
        if ($this->cookie_manager && method_exists($this->cookie_manager, 'update_options')) {
            $this->cookie_manager->update_options($new_options);
        }
    }
}
