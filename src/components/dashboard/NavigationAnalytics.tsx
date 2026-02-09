import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigationAnalytics } from '@/hooks/useNavigationAnalytics';
import { NavigationSync } from '@/components/dashboard/NavigationSync';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Navigation, MousePointer, Smartphone, Monitor, Tablet, TrendingUp, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NavigationAnalyticsProps {
  siteId: string | null;
  selectedSite?: any; // For NavigationSync
}

export function NavigationAnalytics({ siteId, selectedSite }: NavigationAnalyticsProps) {
  console.log('NavigationAnalytics render:', { siteId, selectedSite: !!selectedSite, navigationItemsCount: 0 });
  const [selectedDays, setSelectedDays] = useState(30);
  const [navigationInteractions, setNavigationInteractions] = useState<any[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const { navigationItems, navigationStats, loading, error, loadNavigationData } = useNavigationAnalytics(siteId);

  const handleRefresh = () => {
    loadNavigationData(selectedDays);
    loadNavigationInteractions();
  };

  const handleDaysChange = (value: string) => {
    const days = parseInt(value);
    setSelectedDays(days);
    loadNavigationData(days);
    loadNavigationInteractions(days);
  };

  const loadNavigationInteractions = async (days: number = 30) => {
    if (!siteId) return;
    
    try {
      setInteractionsLoading(true);
      const endDate = new Date();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('user_interactions')
        .select(`
          interaction_type,
          element_text,
          element_id,
          element_class,
          created_at,
          page_view_id,
          page_views!inner (url, site_id)
        `)
        .eq('page_views.site_id', siteId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter for navigation interactions only and exclude admin/editor content
      const navigationData = (data || []).filter((interaction) => {
        const category = interaction.interaction_type.split('_')[1] || 'general';
        const url = interaction.page_views.url.toLowerCase();
        const elementText = (interaction.element_text || '').toLowerCase();
        
        // Skip if not navigation interaction
        if (category !== 'navigation') return false;
        
        // Filter out admin/editor related URLs and elements
        const adminPatterns = [
          '/wp-admin/',
          '/wp-content/themes/',
          '/wp-login.php',
          'edit.php',
          'post.php', 
          'admin.php',
          'options.php',
          'customize.php',
          'themes.php',
          'plugins.php',
          'users.php',
          'tools.php',
          'media.php',
          '/admin/',
          '/dashboard/',
          '/edit/',
          '/settings/'
        ];
        
        const adminTextPatterns = [
          'redigera',
          'edit',
          'admin',
          'dashboard',
          'inställningar', 
          'settings',
          'wp-admin',
          'remove',
          'delete',
          'customize',
          'themes',
          'plugins',
          'media',
          'verktyg',
          'tools'
        ];
        
        // Check URL patterns
        if (adminPatterns.some(pattern => url.includes(pattern))) {
          return false;
        }
        
        // Check element text patterns
        if (adminTextPatterns.some(pattern => elementText.includes(pattern))) {
          return false;
        }
        
        return true;
      });

      // Group and count navigation interactions
      const grouped = new Map();
      navigationData.forEach((interaction) => {
        const key = `${interaction.element_text || interaction.element_id || 'Unknown'}_${interaction.page_views.url}`;
        if (grouped.has(key)) {
          grouped.get(key).count++;
        } else {
          grouped.set(key, {
            element_text: interaction.element_text || interaction.element_id || 'Unknown Element',
            url: interaction.page_views.url,
            count: 1,
            created_at: interaction.created_at
          });
        }
      });

      const processedInteractions = Array.from(grouped.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Show top 20 navigation interactions

      setNavigationInteractions(processedInteractions);
    } catch (error) {
      console.error('Error loading navigation interactions:', error);
    } finally {
      setInteractionsLoading(false);
    }
  };

  // Load data on mount and when dependencies change
  React.useEffect(() => {
    if (siteId) {
      loadNavigationData(selectedDays);
      loadNavigationInteractions(selectedDays);
    }
  }, [siteId, selectedDays]);

  // Group navigation items by location
  const groupedByLocation = navigationItems.reduce((acc, item) => {
    if (!acc[item.menu_location]) {
      acc[item.menu_location] = [];
    }
    acc[item.menu_location].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  // Device breakdown for chart
  const deviceData = [
    { 
      name: 'Desktop', 
      value: navigationStats.reduce((sum, stat) => sum + stat.desktop_clicks, 0),
      color: '#8884d8'
    },
    { 
      name: 'Mobile', 
      value: navigationStats.reduce((sum, stat) => sum + stat.mobile_clicks, 0),
      color: '#82ca9d'
    },
    { 
      name: 'Tablet', 
      value: navigationStats.reduce((sum, stat) => sum + stat.tablet_clicks, 0),
      color: '#ffc658'
    }
  ];

  // Top navigation items for bar chart
  const topNavigationData = navigationStats
    .slice(0, 10)
    .map(stat => ({
      name: stat.menu_title.length > 20 ? stat.menu_title.substring(0, 20) + '...' : stat.menu_title,
      clicks: stat.total_clicks,
      desktop: stat.desktop_clicks,
      mobile: stat.mobile_clicks,
      tablet: stat.tablet_clicks
    }));

  const totalClicks = navigationStats.reduce((sum, stat) => sum + stat.total_clicks, 0);
  const totalInteractionClicks = navigationInteractions.reduce((sum, interaction) => sum + interaction.count, 0);
  const overallTotalClicks = totalClicks + totalInteractionClicks;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>Error loading navigation analytics: {error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!siteId) {
    console.log('NavigationAnalytics: No siteId provided');
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a site to view navigation analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6" />
            Navigation Analytics
          </h2>
          <p className="text-muted-foreground">
            WordPress menu click tracking and analysis
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedDays.toString()} onValueChange={handleDaysChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallTotalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Menyer: {totalClicks.toLocaleString()} + Länkar: {totalInteractionClicks.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Last {selectedDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{navigationItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Active menu items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Item</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">
              {navigationStats[0]?.menu_title || 'No data'}
            </div>
            <p className="text-xs text-muted-foreground">
              {navigationStats[0]?.total_clicks || 0} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedByLocation).length}</div>
            <p className="text-xs text-muted-foreground">
              Menu locations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Navigation Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Navigation Items</CardTitle>
            <p className="text-sm text-muted-foreground">
              Most clicked menu items in the last {selectedDays} days
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topNavigationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="clicks" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Navigation clicks by device type
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Structure & Performance</CardTitle>
          <p className="text-sm text-muted-foreground">
            WordPress menu structure with click analytics
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedByLocation).map(([location, items]) => (
              <div key={location} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {location}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {items.length} items
                  </span>
                </div>
                
                <div className="grid gap-2">
                  {items
                    .sort((a, b) => a.menu_order - b.menu_order)
                    .map((item) => {
                      const stats = navigationStats.find(s => s.menu_item_id === item.menu_item_id);
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{item.menu_title}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {item.menu_url}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              <span>{stats?.desktop_clicks || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              <span>{stats?.mobile_clicks || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Tablet className="h-4 w-4" />
                              <span>{stats?.tablet_clicks || 0}</span>
                            </div>
                            <div className="font-bold min-w-12 text-right">
                              {stats?.total_clicks || 0}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
          
          {Object.keys(groupedByLocation).length === 0 && (
            <div className="space-y-6">
              <div className="text-center py-8 text-muted-foreground">
                <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Ingen navigation-data hittad</p>
                <p className="text-sm">WordPress-menyerna behöver synkroniseras med Supabase för att visa navigationsanalytik.</p>
              </div>
              
              {/* Navigation Sync Component - Always show when no data */}
              <NavigationSync selectedSite={selectedSite} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Interactions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Viktiga Navigationsinteraktioner
          </CardTitle>
           <p className="text-sm text-muted-foreground">
             Mest klickade navigationslement på webbplatsen (exklusive admin/redigeringsverktyg)
           </p>
        </CardHeader>
        <CardContent>
          {interactionsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : navigationInteractions.length > 0 ? (
            <div className="grid gap-3">
              {navigationInteractions.slice(0, 10).map((interaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">🔗</div>
                    <div>
                      <p className="font-medium text-sm">
                        {interaction.element_text.length > 50 
                          ? interaction.element_text.substring(0, 50) + '...'
                          : interaction.element_text
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new URL(interaction.url).pathname}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{interaction.count}</div>
                    <div className="text-xs text-muted-foreground">klick</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inga navigationsinteraktioner att visa för denna period</p>
              <p className="text-xs mt-2">Interaktioner från ImportantInteractions har flyttats hit för bättre organisation</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}