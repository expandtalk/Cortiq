<?php
/**
 * Manual Cookie Management Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsCookieManager {
    
    private $options;
    private $manual_cookies_key = 'heatmap_manual_cookies';
    
    public function __construct($options) {
        $this->options = $options;
    }
    
    public function add_manual_cookie($cookie_data) {
        $manual_cookies = get_option($this->manual_cookies_key, array());
        
        // Create unique ID for cookie
        $cookie_id = uniqid('cookie_');
        
        $manual_cookies[$cookie_id] = array(
            'id' => $cookie_id,
            'name' => sanitize_text_field($cookie_data['name']),
            'category' => sanitize_text_field($cookie_data['category']),
            'purpose' => sanitize_textarea_field($cookie_data['purpose']),
            'provider' => sanitize_text_field($cookie_data['provider']),
            'expiry' => sanitize_text_field($cookie_data['expiry']),
            'detection_method' => 'manual',
            'created_at' => current_time('mysql'),
            'is_active' => true
        );
        
        return update_option($this->manual_cookies_key, $manual_cookies);
    }
    
    public function delete_manual_cookie($cookie_id) {
        $manual_cookies = get_option($this->manual_cookies_key, array());
        
        if (isset($manual_cookies[$cookie_id])) {
            unset($manual_cookies[$cookie_id]);
            return update_option($this->manual_cookies_key, $manual_cookies);
        }
        
        return false;
    }
    
    public function update_manual_cookie($cookie_id, $cookie_data) {
        $manual_cookies = get_option($this->manual_cookies_key, array());
        
        if (isset($manual_cookies[$cookie_id])) {
            $manual_cookies[$cookie_id] = array_merge($manual_cookies[$cookie_id], array(
                'name' => sanitize_text_field($cookie_data['name']),
                'category' => sanitize_text_field($cookie_data['category']),
                'purpose' => sanitize_textarea_field($cookie_data['purpose']),
                'provider' => sanitize_text_field($cookie_data['provider']),
                'expiry' => sanitize_text_field($cookie_data['expiry']),
                'updated_at' => current_time('mysql')
            ));
            
            return update_option($this->manual_cookies_key, $manual_cookies);
        }
        
        return false;
    }
    
    public function get_manual_cookies() {
        return get_option($this->manual_cookies_key, array());
    }
    
    public function get_cookies_by_category($category = null) {
        $manual_cookies = $this->get_manual_cookies();
        
        if (!$category) {
            return $manual_cookies;
        }
        
        return array_filter($manual_cookies, function($cookie) use ($category) {
            return $cookie['category'] === $category;
        });
    }
    
    public function render_cookies_list() {
        $manual_cookies = $this->get_manual_cookies();
        $categories = array(
            'necessary' => 'Nödvändiga',
            'analytics' => 'Analytics',
            'marketing' => 'Marknadsföring',
            'preferences' => 'Preferenser'
        );
        
        if (empty($manual_cookies)) {
            echo '<p style="color: #666; font-style: italic;">Inga manuella cookies har lagts till än.</p>';
            return;
        }
        
        echo '<table class="wp-list-table widefat fixed striped" style="margin-top: 10px;">';
        echo '<thead><tr>';
        echo '<th>Cookie Namn</th>';
        echo '<th>Kategori</th>';
        echo '<th>Syfte</th>';
        echo '<th>Leverantör</th>';
        echo '<th>Utgångstid</th>';
        echo '<th>Åtgärder</th>';
        echo '</tr></thead>';
        echo '<tbody>';
        
        foreach ($manual_cookies as $cookie_id => $cookie) {
            $category_name = isset($categories[$cookie['category']]) ? $categories[$cookie['category']] : $cookie['category'];
            
            echo '<tr>';
            echo '<td><strong>' . esc_html($cookie['name']) . '</strong></td>';
            echo '<td><span class="cookie-category-badge category-' . esc_attr($cookie['category']) . '">' . esc_html($category_name) . '</span></td>';
            echo '<td>' . esc_html($cookie['purpose']) . '</td>';
            echo '<td>' . esc_html($cookie['provider']) . '</td>';
            echo '<td>' . esc_html($cookie['expiry']) . '</td>';
            echo '<td>';
            echo '<button type="button" class="button button-small edit-cookie" data-cookie-id="' . esc_attr($cookie_id) . '">Redigera</button> ';
            echo '<button type="button" class="button button-small button-link-delete delete-cookie" data-cookie-id="' . esc_attr($cookie_id) . '">Ta bort</button>';
            echo '</td>';
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
        
        // Add CSS for category badges
        echo '<style>
        .cookie-category-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .category-necessary { background: #d4edda; color: #155724; }
        .category-analytics { background: #d1ecf1; color: #0c5460; }
        .category-marketing { background: #f8d7da; color: #721c24; }
        .category-preferences { background: #fff3cd; color: #856404; }
        </style>';
    }
    
    public function get_cookies_list_html() {
        ob_start();
        $this->render_cookies_list();
        return ob_get_clean();
    }
    
    public function get_all_cookies_for_banner() {
        $manual_cookies = $this->get_manual_cookies();
        $auto_detected = $this->get_auto_detected_cookies();
        
        return array_merge($manual_cookies, $auto_detected);
    }
    
    private function get_auto_detected_cookies() {
        // This would integrate with automatic cookie detection
        // For now, return basic detected cookies
        return array(
            'wordpress_core' => array(
                'name' => 'WordPress Sessions',
                'category' => 'necessary',
                'purpose' => 'Nödvändiga för inloggning och säkerhet',
                'provider' => 'WordPress',
                'expiry' => 'Session',
                'detection_method' => 'automatic'
            )
        );
    }
    
    public function sync_to_supabase() {
        // Sync manual cookies to Supabase database
        $manual_cookies = $this->get_manual_cookies();
        $tracking_id = isset($this->options['tracking_id']) ? $this->options['tracking_id'] : '';
        
        if (empty($tracking_id) || empty($manual_cookies)) {
            return false;
        }
        
        // Prepare data for Supabase
        $site_cookies = array();
        foreach ($manual_cookies as $cookie) {
            $site_cookies[] = array(
                'cookie_name' => $cookie['name'],
                'cookie_category' => $cookie['category'],
                'cookie_purpose' => $cookie['purpose'],
                'cookie_provider' => $cookie['provider'],
                'cookie_expiry' => $cookie['expiry'],
                'detection_method' => 'manual',
                'is_active' => true
            );
        }
        
        // Call Supabase edge function to sync cookies
        $response = wp_remote_post('https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/cookie-importer', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . 'YOUR_SUPABASE_ANON_KEY'
            ),
            'body' => json_encode(array(
                'tracking_id' => $tracking_id,
                'cookies' => $site_cookies,
                'source' => 'wordpress_manual'
            )),
            'timeout' => 15
        ));
        
        return !is_wp_error($response);
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}
