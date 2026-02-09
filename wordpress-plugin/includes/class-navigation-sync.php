<?php
/**
 * Navigation Sync Manager - WordPress Menu Integration
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsNavigationSync {
    
    private $options;
    private $supabase_sync;
    
    public function __construct($options, $supabase_sync = null) {
        $this->options = $options;
        $this->supabase_sync = $supabase_sync;
        
        $this->init_hooks();
    }
    
    private function init_hooks() {
        // Sync navigation when menu is updated
        add_action('wp_update_nav_menu', array($this, 'sync_navigation_menu'), 10, 2);
        add_action('wp_create_nav_menu', array($this, 'sync_navigation_menu'), 10, 2);
        
        // Sync on theme changes (menu locations might change)
        add_action('after_switch_theme', array($this, 'sync_all_navigation_menus'));
        
        // AJAX endpoint for manual sync
        add_action('wp_ajax_sync_navigation_menus', array($this, 'manual_sync_navigation'));
        
        // Add to WordPress tracking script
        add_action('wp_footer', array($this, 'add_navigation_tracking'), 15);
    }
    
    public function sync_navigation_menu($menu_id, $menu_data = null) {
        try {
            // Get all menu locations
            $locations = get_nav_menu_locations();
            
            foreach ($locations as $location => $assigned_menu_id) {
                if ($assigned_menu_id == $menu_id) {
                    $this->sync_menu_structure($menu_id, $location);
                }
            }
            
            heatmap_log("Navigation menu synced: {$menu_id}", 'info');
        } catch (Exception $e) {
            heatmap_log("Error syncing navigation menu: " . $e->getMessage(), 'error');
        }
    }
    
    public function sync_all_navigation_menus() {
        $locations = get_nav_menu_locations();
        
        foreach ($locations as $location => $menu_id) {
            if ($menu_id) {
                $this->sync_menu_structure($menu_id, $location);
            }
        }
    }
    
    private function sync_menu_structure($menu_id, $location) {
        // Get menu items with proper ordering
        $menu_items = wp_get_nav_menu_items($menu_id, array(
            'order' => 'ASC',
            'orderby' => 'menu_order'
        ));
        
        if (!$menu_items) {
            heatmap_log("No menu items found for menu ID: {$menu_id}", 'warning');
            return;
        }
        
        $navigation_data = array();
        
        // Enhanced menu item processing
        foreach ($menu_items as $item) {
            // Get all classes including custom ones
            $css_classes = array();
            if (!empty($item->classes)) {
                $css_classes = is_array($item->classes) ? $item->classes : explode(' ', $item->classes);
                // Remove empty classes
                $css_classes = array_filter($css_classes);
            }
            
            // Determine menu item type
            $item_type = 'custom';
            if ($item->type === 'post_type') {
                $item_type = 'page';
            } elseif ($item->type === 'taxonomy') {
                $item_type = 'category';
            } elseif ($item->type === 'custom') {
                $item_type = 'custom_link';
            }
            
            // Build menu item data with enhanced metadata
            $menu_item_data = array(
                'menu_item_id' => intval($item->ID),
                'menu_title' => sanitize_text_field($item->title),
                'menu_url' => esc_url($item->url),
                'menu_order' => intval($item->menu_order),
                'parent_id' => intval($item->menu_item_parent),
                'css_classes' => $css_classes,
                'menu_location' => sanitize_text_field($location),
                'is_active' => true,
                // Enhanced metadata
                'item_type' => $item_type,
                'target' => sanitize_text_field($item->target ?: '_self'),
                'description' => sanitize_text_field($item->description ?: ''),
                'object_type' => sanitize_text_field($item->type ?: ''),
                'object_id' => intval($item->object_id ?: 0),
                'sync_timestamp' => current_time('mysql')
            );
            
            $navigation_data[] = $menu_item_data;
        }
        
        // Send to Supabase if sync manager is available
        if ($this->supabase_sync) {
            $sync_result = $this->supabase_sync->sync_navigation_data($navigation_data);
            if ($sync_result) {
                heatmap_log("Navigation data successfully synced to Supabase for location: {$location}", 'info');
            } else {
                heatmap_log("Failed to sync navigation data to Supabase for location: {$location}", 'error');
            }
        }
        
        // Store locally as backup with timestamp
        $local_data = array(
            'navigation_items' => $navigation_data,
            'last_sync' => current_time('mysql'),
            'menu_id' => $menu_id,
            'menu_location' => $location,
            'item_count' => count($navigation_data)
        );
        
        update_option('heatmap_navigation_' . $location, $local_data);
        
        heatmap_log("Menu structure synced for location: {$location} ({$local_data['item_count']} items)", 'info');
    }
    
    public function manual_sync_navigation() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        if (!wp_verify_nonce($_POST['nonce'], 'heatmap_sync_navigation')) {
            wp_send_json_error('Invalid nonce');
            return;
        }
        
        try {
            $this->sync_all_navigation_menus();
            wp_send_json_success('Navigation menus synced successfully');
        } catch (Exception $e) {
            wp_send_json_error('Sync failed: ' . $e->getMessage());
        }
    }
    
    public function add_navigation_tracking() {
        // Only add tracking if enabled and conditions are met
        if (!$this->should_track_navigation()) {
            return;
        }
        
        ?>
        <script type="text/javascript">
        (function() {
            'use strict';
            
            // Enhanced navigation tracking for WordPress menus
            function initNavigationTracking() {
                console.log('🧭 Initializing enhanced WordPress navigation tracking');
                
                // Track all menu item clicks
                document.addEventListener('click', function(e) {
                    const menuItem = e.target.closest('.menu-item, .menu-item a, [class*="menu-item"]');
                    
                    if (menuItem) {
                        const menuData = extractMenuData(menuItem, e.target);
                        
                        if (menuData) {
                            console.log('📍 Navigation click detected:', menuData);
                            trackNavigationClick(menuData);
                        }
                    }
                });
                
                // Also track dropdown/submenu interactions
                document.addEventListener('mouseenter', function(e) {
                    const submenu = e.target.closest('.sub-menu, .dropdown-menu, [class*="submenu"]');
                    if (submenu) {
                        trackSubmenuInteraction('hover', submenu);
                    }
                });
            }
            
            function extractMenuData(menuItem, clickedElement) {
                // Try to find the actual link element
                const link = clickedElement.tagName === 'A' ? clickedElement : menuItem.querySelector('a');
                
                if (!link) return null;
                
                // Extract WordPress menu item data with enhanced detection
                const classList = Array.from(menuItem.classList);
                const menuItemId = extractMenuItemId(classList);
                const menuTitle = link.textContent?.trim() || link.getAttribute('aria-label') || '';
                const menuUrl = link.href || '';
                
                // Enhanced menu location and level detection
                const menuLocation = determineMenuLocation(menuItem);
                const menuLevel = determineMenuLevel(menuItem);
                const menuPosition = determineMenuPosition(menuItem);
                
                // Get additional metadata
                const isExternalLink = link.hostname !== window.location.hostname;
                const hasSubmenu = menuItem.querySelector('.sub-menu, .dropdown-menu, [class*="submenu"]') !== null;
                
                return {
                    menu_item_id: menuItemId,
                    menu_title: menuTitle,
                    menu_url: menuUrl,
                    menu_location: menuLocation,
                    menu_level: menuLevel,
                    menu_position: menuPosition,
                    css_classes: classList,
                    is_external: isExternalLink,
                    has_submenu: hasSubmenu,
                    click_position: {
                        x: event.clientX,
                        y: event.clientY
                    },
                    timestamp: Date.now()
                };
            }
            
            function extractMenuItemId(classList) {
                // WordPress adds classes like 'menu-item-123'
                for (const className of classList) {
                    const match = className.match(/menu-item-(\d+)/);
                    if (match) {
                        return parseInt(match[1]);
                    }
                }
                return null;
            }
            
            function determineMenuLocation(menuItem) {
                // Check parent containers for menu location indicators
                const container = menuItem.closest('[class*="nav"], [id*="nav"], [class*="menu"], [id*="menu"]');
                
                if (!container) return 'unknown';
                
                const containerClasses = container.className.toLowerCase();
                const containerId = container.id.toLowerCase();
                
                // Common WordPress menu location patterns
                if (containerClasses.includes('primary') || containerId.includes('primary')) return 'primary';
                if (containerClasses.includes('secondary') || containerId.includes('secondary')) return 'secondary';
                if (containerClasses.includes('footer') || containerId.includes('footer')) return 'footer';
                if (containerClasses.includes('header') || containerId.includes('header')) return 'header';
                if (containerClasses.includes('top') || containerId.includes('top')) return 'top';
                if (containerClasses.includes('main') || containerId.includes('main')) return 'main';
                
                return 'primary'; // Default assumption
            }
            
            function determineMenuLevel(menuItem) {
                // Count how deep we are in submenus
                let level = 1;
                let parent = menuItem.parentElement;
                
                while (parent) {
                    if (parent.classList.contains('sub-menu') || 
                        parent.classList.contains('dropdown-menu') ||
                        parent.className.includes('submenu')) {
                        level++;
                    }
                    parent = parent.parentElement;
                }
                
                return level;
            }
            
            function determineMenuPosition(menuItem) {
                // Determine position within the menu
                const parentMenu = menuItem.closest('ul, .menu');
                if (!parentMenu) return 0;
                
                const siblings = Array.from(parentMenu.children).filter(
                    child => child.classList.contains('menu-item') || child.className.includes('menu-item')
                );
                
                return siblings.indexOf(menuItem) + 1; // 1-indexed position
            }
            
            function trackNavigationClick(menuData) {
                // Send to our tracking system
                if (window.heatmapAnalytics && window.heatmapAnalytics.trackEvent) {
                    window.heatmapAnalytics.trackEvent({
                        type: 'navigation_click',
                        data: menuData,
                        timestamp: Date.now()
                    });
                }
                
                // Also track as heatmap point for compatibility
                if (window.heatmapAnalytics && window.heatmapAnalytics.trackInteraction) {
                    window.heatmapAnalytics.trackInteraction({
                        type: 'click_navigation_menu',
                        x: menuData.click_position.x,
                        y: menuData.click_position.y,
                        element_text: menuData.menu_title,
                        element_selector: `menu-item-${menuData.menu_item_id}`,
                        menu_data: menuData
                    });
                }
            }
            
            function trackSubmenuInteraction(type, submenu) {
                // Track submenu reveals/interactions
                if (window.heatmapAnalytics && window.heatmapAnalytics.trackEvent) {
                    window.heatmapAnalytics.trackEvent({
                        type: 'submenu_interaction',
                        interaction_type: type,
                        timestamp: Date.now()
                    });
                }
            }
            
            // Initialize when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initNavigationTracking);
            } else {
                initNavigationTracking();
            }
        })();
        </script>
        <?php
    }
    
    private function should_track_navigation() {
        // Don't track for admin users
        if (current_user_can('manage_options')) {
            return false;
        }
        
        // Don't track in admin area
        if (is_admin()) {
            return false;
        }
        
        // Check if tracking is enabled
        if (!isset($this->options['tracking_enabled']) || !$this->options['tracking_enabled']) {
            return false;
        }
        
        return true;
    }
    
    public function get_navigation_data($location = null) {
        if ($location) {
            return get_option('heatmap_navigation_' . $location, array());
        }
        
        // Get all navigation data
        $locations = get_nav_menu_locations();
        $all_navigation = array();
        
        foreach ($locations as $loc => $menu_id) {
            $all_navigation[$loc] = get_option('heatmap_navigation_' . $loc, array());
        }
        
        return $all_navigation;
    }
    
    public function update_options($new_options) {
        $this->options = $new_options;
    }
}