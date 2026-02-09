<?php
/**
 * Pixel Detector Class
 * Auto-detects tracking pixels on the website
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsPixelDetector {
    private $options;
    
    public function __construct($options = array()) {
        $this->options = $options;
        
        if (isset($options['auto_detect_pixels']) && $options['auto_detect_pixels']) {
            add_action('wp_head', array($this, 'detect_pixels'), 1);
        }
    }
    
    /**
     * Detect existing pixels on the page
     */
    public function detect_pixels() {
        ob_start(array($this, 'scan_html_for_pixels'));
    }
    
    /**
     * Scan HTML content for pixel codes
     */
    public function scan_html_for_pixels($html) {
        $detected_pixels = array();
        
        // Facebook Pixel detection - FIXED regex
        if (preg_match('/fbq\([\'"]init[\'"]\s*,\s*[\'"](\d+)[\'"]/', $html, $matches)) {
            $detected_pixels[] = array(
                'type' => 'facebook',
                'id' => $matches[1],
                'name' => 'Facebook Pixel'
            );
        }
        
        // Google Ads detection - FIXED regex
        if (preg_match('/gtag\([\'"]config[\'"]\s*,\s*[\'"]AW-(\d+)[\'"]/', $html, $matches)) {
            $detected_pixels[] = array(
                'type' => 'google_ads',
                'id' => 'AW-' . $matches[1],
                'name' => 'Google Ads'
            );
        }
        
        // Google Analytics detection - FIXED regex
        if (preg_match('/gtag\([\'"]config[\'"]\s*,\s*[\'"]G-([A-Z0-9]+)[\'"]/', $html, $matches)) {
            $detected_pixels[] = array(
                'type' => 'google_analytics',
                'id' => 'G-' . $matches[1],
                'name' => 'Google Analytics 4'
            );
        }
        
        // Universal Analytics detection (UA-)
        if (preg_match('/gtag\([\'"]config[\'"]\s*,\s*[\'"]UA-(\d+-\d+)[\'"]/', $html, $matches)) {
            $detected_pixels[] = array(
                'type' => 'google_analytics_ua',
                'id' => 'UA-' . $matches[1],
                'name' => 'Google Analytics (Universal)'
            );
        }
        
        // LinkedIn Insight Tag detection
        if (preg_match('/_linkedin_partner_id\s*=\s*[\'"](\d+)[\'"]/', $html, $matches)) {
            $detected_pixels[] = array(
                'type' => 'linkedin',
                'id' => $matches[1],
                'name' => 'LinkedIn Insight Tag'
            );
        }
        
        // Twitter/X Pixel detection
        if (preg_match('/twq\([\'"]init[\'"]\s*,\s*[\'"]([a-z0-9]+)[\'"]/', $html, $matches)) {
            $detected_pixels[] = array(
                'type' => 'twitter',
                'id' => $matches[1],
                'name' => 'Twitter/X Pixel'
            );
        }
        
        // Pinterest Tag detection
        if (preg_match('/pintrk\([\'"]load[\'"]\s*,\s*[\'"](\d+)[\'"]/', $html, $matches)) {
            $detected_pixels[] = array(
                'type' => 'pinterest',
                'id' => $matches[1],
                'name' => 'Pinterest Tag'
            );
        }
        
        // TikTok Pixel detection
        if (preg_match('/ttq\.load\([\'"]([A-Z0-9]+)[\'"]/', $html, $matches)) {
            $detected_pixels[] = array(
                'type' => 'tiktok',
                'id' => $matches[1],
                'name' => 'TikTok Pixel'
            );
        }
        
        // Snapchat Pixel detection
        if (preg_match('/snaptr\([\'"]init[\'"]\s*,\s*[\'"]([a-f0-9-]+)[\'"]/', $html, $matches)) {
            $detected_pixels[] = array(
                'type' => 'snapchat',
                'id' => $matches[1],
                'name' => 'Snapchat Pixel'
            );
        }
        
        // Save detected pixels to options
        if (!empty($detected_pixels)) {
            $current_options = get_option('heatmap_analytics_options', array());
            $current_options['detected_pixels'] = $detected_pixels;
            $current_options['last_pixel_scan'] = current_time('mysql');
            update_option('heatmap_analytics_options', $current_options);
            
            // Log detected pixels
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Heatmap Analytics: Detected ' . count($detected_pixels) . ' tracking pixels');
            }
        }
        
        return $html;
    }
    
    /**
     * Get all configured pixels (detected + manual)
     */
    public function get_all_pixels() {
        $options = get_option('heatmap_analytics_options', array());
        $detected = isset($options['detected_pixels']) ? $options['detected_pixels'] : array();
        return $detected;
    }
    
    /**
     * Get pixel info by type
     */
    public function get_pixel_by_type($type) {
        $pixels = $this->get_all_pixels();
        foreach ($pixels as $pixel) {
            if ($pixel['type'] === $type) {
                return $pixel;
            }
        }
        return null;
    }
    
    /**
     * Check if a specific pixel type exists
     */
    public function has_pixel($type) {
        return $this->get_pixel_by_type($type) !== null;
    }
    
    /**
     * Manually add a pixel
     */
    public function add_pixel($type, $id, $name = '') {
        $options = get_option('heatmap_analytics_options', array());
        $pixels = isset($options['detected_pixels']) ? $options['detected_pixels'] : array();
        
        // Check if pixel already exists
        foreach ($pixels as $pixel) {
            if ($pixel['type'] === $type && $pixel['id'] === $id) {
                return false; // Already exists
            }
        }
        
        // Add new pixel
        $pixels[] = array(
            'type' => $type,
            'id' => $id,
            'name' => $name ?: ucfirst($type) . ' Pixel',
            'added_manually' => true,
            'added_at' => current_time('mysql')
        );
        
        $options['detected_pixels'] = $pixels;
        update_option('heatmap_analytics_options', $options);
        
        return true;
    }
    
    /**
     * Remove a pixel
     */
    public function remove_pixel($type, $id) {
        $options = get_option('heatmap_analytics_options', array());
        $pixels = isset($options['detected_pixels']) ? $options['detected_pixels'] : array();
        
        $filtered = array_filter($pixels, function($pixel) use ($type, $id) {
            return !($pixel['type'] === $type && $pixel['id'] === $id);
        });
        
        $options['detected_pixels'] = array_values($filtered);
        update_option('heatmap_analytics_options', $options);
        
        return count($pixels) !== count($filtered);
    }
    
    /**
     * Update options
     */
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}
?>
