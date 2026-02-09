<?php
/**
 * Google Analytics integration
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsGoogleAnalytics {
    
    private $options;
    
    public function __construct($options) {
        $this->options = $options;
        
        add_action('wp_head', array($this, 'add_google_analytics'));
    }
    
    public function add_google_analytics() {
        // Prevent conflicts with Site Kit
        if (class_exists('Google\Site_Kit\Plugin') && !$this->should_load_our_ga()) {
            return; // Let Site Kit handle GA loading
        }
        
        // Only add GA if integration is enabled and measurement ID is set
        $ga_integration = isset($this->options['ga_integration']) ? $this->options['ga_integration'] : false;
        $ga_measurement_id = isset($this->options['ga_measurement_id']) ? $this->options['ga_measurement_id'] : '';
        
        if (!$ga_integration || empty($ga_measurement_id)) {
            return;
        }
        
        $measurement_id = $ga_measurement_id;
        ?>
        <!-- Google Analytics 4 -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo esc_attr($measurement_id); ?>"></script>
        <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        
        gtag('config', '<?php echo esc_js($measurement_id); ?>', {
            page_title: document.title,
            page_location: window.location.href,
            custom_map: {
                'custom_parameter_1': 'heatmap_zone',
                'custom_parameter_2': 'click_intensity', 
                'custom_parameter_3': 'scroll_depth'
            }
        });
        
        <?php 
        $ga_enhanced_ecommerce = isset($this->options['ga_enhanced_ecommerce']) ? $this->options['ga_enhanced_ecommerce'] : false;
        if ($ga_enhanced_ecommerce): 
        ?>
        // Enhanced E-commerce setup
        gtag('config', '<?php echo esc_js($measurement_id); ?>', {
            enhanced_ecommerce: true
        });
        <?php endif; ?>
        
        // Custom event for heatmap tracking initialization
        gtag('event', 'heatmap_tracking_init', {
            event_category: 'heatmap',
            event_label: 'tracking_started',
            custom_parameter_1: 'initialization',
            custom_parameter_2: 'wordpress_plugin',
            custom_parameter_3: '<?php echo esc_js(isset($this->options['tracking_id']) ? $this->options['tracking_id'] : 'unknown'); ?>'
        });
        </script>
        <?php
    }
    
    /**
     * Check if we should load our GA script or defer to Site Kit
     */
    private function should_load_our_ga() {
        // If Site Kit is active, check if it's handling Analytics
        if (class_exists('Google\Site_Kit\Plugin')) {
            $sitekit_analytics = get_option('googlesitekit_analytics_settings', []);
            if (!empty($sitekit_analytics['propertyID'])) {
                // Site Kit is handling Analytics, don't load ours unless specifically requested
                return isset($this->options['force_ga_override']) && $this->options['force_ga_override'];
            }
        }
        return true;
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}
?>
