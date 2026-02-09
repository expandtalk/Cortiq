import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NavigationMenuItem {
  id: string;
  menu_item_id: number;
  menu_title: string;
  menu_url: string;
  menu_order: number;
  parent_id: number;
  css_classes: string[];
  menu_location: string;
  is_active: boolean;
}

export interface NavigationAnalytics {
  menu_item_id: number;
  menu_title: string;
  menu_url: string;
  click_count: number;
  device_type: string;
  date: string;
}

export interface NavigationStats {
  menu_item_id: number;
  menu_title: string;
  menu_url: string;
  total_clicks: number;
  desktop_clicks: number;
  mobile_clicks: number;
  tablet_clicks: number;
  menu_location: string;
  menu_order: number;
}

interface UseNavigationAnalyticsReturn {
  navigationItems: NavigationMenuItem[];
  navigationStats: NavigationStats[];
  loading: boolean;
  error: string | null;
  loadNavigationData: (days?: number) => Promise<void>;
}

export function useNavigationAnalytics(siteId: string | null): UseNavigationAnalyticsReturn {
  const [navigationItems, setNavigationItems] = useState<NavigationMenuItem[]>([]);
  const [navigationStats, setNavigationStats] = useState<NavigationStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNavigationData = async (days: number = 30) => {
    if (!siteId) {
      setNavigationItems([]);
      setNavigationStats([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Loading navigation data for site:', siteId);

      // Load navigation menu structure
      const { data: menuItems, error: menuError } = await supabase
        .from('navigation_menus')
        .select('*')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .order('menu_location')
        .order('menu_order');

      if (menuError) {
        throw new Error(`Failed to load navigation menu: ${menuError.message}`);
      }

      setNavigationItems(menuItems || []);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Load navigation analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('navigation_analytics')
        .select('*')
        .eq('site_id', siteId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (analyticsError) {
        throw new Error(`Failed to load navigation analytics: ${analyticsError.message}`);
      }

      // Process analytics data to create stats
      const statsMap = new Map<number, NavigationStats>();

      // Initialize stats for all menu items
      (menuItems || []).forEach(item => {
        statsMap.set(item.menu_item_id, {
          menu_item_id: item.menu_item_id,
          menu_title: item.menu_title,
          menu_url: item.menu_url,
          total_clicks: 0,
          desktop_clicks: 0,
          mobile_clicks: 0,
          tablet_clicks: 0,
          menu_location: item.menu_location,
          menu_order: item.menu_order
        });
      });

      // Aggregate analytics data
      (analyticsData || []).forEach(analytics => {
        const existing = statsMap.get(analytics.menu_item_id);
        if (existing) {
          existing.total_clicks += analytics.click_count;
          
          switch (analytics.device_type.toLowerCase()) {
            case 'mobile':
              existing.mobile_clicks += analytics.click_count;
              break;
            case 'tablet':
              existing.tablet_clicks += analytics.click_count;
              break;
            default:
              existing.desktop_clicks += analytics.click_count;
          }
        } else {
          // Menu item not in current structure, but has analytics
          statsMap.set(analytics.menu_item_id, {
            menu_item_id: analytics.menu_item_id,
            menu_title: analytics.menu_title || 'Removed Menu Item',
            menu_url: analytics.menu_url || '#',
            total_clicks: analytics.click_count,
            desktop_clicks: analytics.device_type === 'desktop' ? analytics.click_count : 0,
            mobile_clicks: analytics.device_type === 'mobile' ? analytics.click_count : 0,
            tablet_clicks: analytics.device_type === 'tablet' ? analytics.click_count : 0,
            menu_location: 'unknown',
            menu_order: 999
          });
        }
      });

      // Convert to array and sort by total clicks
      const stats = Array.from(statsMap.values())
        .sort((a, b) => b.total_clicks - a.total_clicks);

      setNavigationStats(stats);

      console.log(`Loaded ${menuItems?.length || 0} menu items and ${analyticsData?.length || 0} analytics records`);

    } catch (err) {
      console.error('Error loading navigation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load navigation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNavigationData();
  }, [siteId]);

  return {
    navigationItems,
    navigationStats,
    loading,
    error,
    loadNavigationData
  };
}