<?php
/**
 * WordPress Plugin Scanner for Cookie Management
 * Inspired by CookieBot's plugin detection
 */

class HeatmapAnalyticsPluginScanner {
    private $options;
    private $detected_plugins = [];
    private $compliance_score = 0;
    
    public function __construct($options = array()) {
        $this->options = $options;
        
        add_action('admin_menu', array($this, 'add_scanner_page'));
        add_action('wp_ajax_scan_plugins', array($this, 'ajax_scan_plugins'));
        add_action('wp_ajax_toggle_plugin_blocking', array($this, 'ajax_toggle_plugin_blocking'));
        
        $this->scan_wordpress_plugins();
    }
    
    public function add_scanner_page() {
        add_submenu_page(
            'heatmap-analytics',
            'Plugin Scanner',
            'Plugin Scanner',
            'manage_options',
            'heatmap-plugin-scanner',
            array($this, 'render_scanner_page')
        );
    }
    
    public function render_scanner_page() {
        ?>
        <div class="wrap heatmap-scanner">
            <h1>🔍 WordPress Plugin Scanner</h1>
            <p>Skannar efter plugins som kan påverka cookie-kompatibilitet.</p>
        </div>
        <?php
    }
    
    private function scan_wordpress_plugins() {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $all_plugins = get_plugins();
        $active_plugins = get_option('active_plugins');
        
        $this->detected_plugins = [];
        
        foreach ($all_plugins as $plugin_file => $plugin_data) {
            if (in_array($plugin_file, $active_plugins)) {
                $plugin_info = $this->analyze_plugin($plugin_file, $plugin_data);
                if ($plugin_info) {
                    $this->detected_plugins[] = $plugin_info;
                }
            }
        }
    }
    
    private function analyze_plugin($plugin_file, $plugin_data) {
        $slug = dirname($plugin_file);
        $name = $plugin_data['Name'];
        
        return [
            'slug' => $slug,
            'name' => $name,
            'description' => $plugin_data['Description'],
            'status' => 'active'
        ];
    }
    
    public function ajax_scan_plugins() {
        $this->scan_wordpress_plugins();
        wp_die('Success');
    }
    
    public function ajax_toggle_plugin_blocking() {
        // Handle plugin blocking toggle
        wp_die('Success');
    }
}
?>
