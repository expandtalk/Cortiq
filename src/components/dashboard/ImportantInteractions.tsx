import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface InteractionData {
  interaction_type: string;
  element_text: string;
  element_id: string;
  element_class: string;
  count: number;
  category: string;
  importance: number;
  url: string;
}

interface CategoryGroup {
  category: string;
  importance: number;
  totalCount: number;
  interactions: InteractionData[];
}

interface ImportantInteractionsProps {
  siteId: string;
  dateRange?: { from: Date; to: Date };
}

export function ImportantInteractions({ siteId, dateRange }: ImportantInteractionsProps) {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchImportantInteractions();
  }, [siteId, dateRange]);

  const fetchImportantInteractions = async () => {
    try {
      setLoading(true);
      
      // Get date range (default to last 30 days)
      const endDate = dateRange?.to || new Date();
      const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
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

      // Process and group interactions by category
      const processedInteractions = processInteractionData(data || []);
      const groupedByCategory = groupInteractionsByCategory(processedInteractions);
      setTotalCount(processedInteractions.length);
      setCategoryGroups(groupedByCategory);
      setVisibleCount(10);
      
    } catch (error) {
      console.error('Error fetching important interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const processInteractionData = (data: any[]): InteractionData[] => {
    const grouped = new Map<string, InteractionData>();
    
    // Filter out admin-related interactions
    const filteredData = data.filter((interaction) => {
      const elementText = interaction.element_text?.toLowerCase() || '';
      const adminKeywords = [
        'adminpanel', 'admin panel', 'redigera', 'edit', 'dashboard',
        'admin', 'backend', 'wp-admin', 'login', 'logout', 'logga ut',
        'redigera inlägg', 'edit post', 'add new', 'lägg till',
        'delete', 'ta bort', 'publish', 'publicera', 'draft', 'utkast',
        'preview', 'förhandsgranska', 'settings', 'inställningar',
        'users', 'användare', 'comments', 'kommentarer', 'media',
        'plugins', 'themes', 'tools', 'verktyg'
      ];
      
      const isAdminElement = adminKeywords.some(keyword => 
        elementText.includes(keyword)
      );
      
      const url = interaction.page_views?.url || '';
      const isAdminUrl = url.includes('/wp-admin/') || 
                        url.includes('/admin/') || 
                        url.includes('/dashboard/');
      
      if (isAdminElement || isAdminUrl) {
        return false;
      }
      
      const hasText = interaction.element_text && interaction.element_text.trim().length > 0;
      const hasId = interaction.element_id && interaction.element_id.trim().length > 0;
      const hasUsefulClass = interaction.element_class && 
        interaction.element_class.trim().length > 0 && 
        !interaction.element_class.includes('elementor') && 
        !interaction.element_class.includes('wp-') && 
        interaction.element_class.split(' ').some(cls => cls.length > 2);
      
      return hasText || hasId || hasUsefulClass;
    });
    
    filteredData.forEach((interaction) => {
      // Determine category based on interaction patterns
      const elementText = interaction.element_text?.toLowerCase() || '';
      const elementId = interaction.element_id?.toLowerCase() || '';
      const elementClass = interaction.element_class?.toLowerCase() || '';
      const interactionType = interaction.interaction_type?.toLowerCase() || '';
      
      let category = 'general';
      let importance = 3;
      
      // Add debug logging
      console.log('Processing interaction:', {
        text: elementText,
        id: elementId,
        class: elementClass,
        type: interactionType
      });
      
      // Cookie banner category (highest priority)
      if (elementText.includes('acceptera') || elementText.includes('accept') ||
          elementText.includes('anpassa') || elementText.includes('customize') ||
          elementText.includes('samtycke') || elementText.includes('consent') ||
          elementText.includes('cookies') || elementText.includes('cookie') ||
          elementId.includes('consent') || elementId.includes('cookie') ||
          elementClass.includes('consent') || elementClass.includes('cookie') ||
          elementClass.includes('heatmap-consent') || elementClass.includes('marketing-consent')) {
        category = 'cookie';
        importance = 9;
      }
      // Navigation & Discovery - SKIP, moved to NavigationAnalytics
      else if (elementClass.includes('menu') || elementClass.includes('nav') ||
               elementClass.includes('col-') || elementClass.includes('main-wrap') ||
               elementClass.includes('ab-item') || // WordPress admin bar items
               elementText.includes('meny') || elementText.includes('menu') ||
               elementText.includes('wordpress') || elementText.includes('om ') ||
               interactionType.includes('navigation') || interactionType.includes('focus_navigation')) {
        // Skip navigation - handled in NavigationAnalytics section
        return;
      }
      // Conversion & Search (high priority)
      else if (elementText.includes('kontakt') || elementText.includes('contact') ||
               elementText.includes('sök') || elementText.includes('search') ||
               elementText.includes('ring') || elementText.includes('call') ||
               elementText.includes('offert') || elementText.includes('quote') ||
               elementId.includes('search') || elementId.includes('contact') ||
               elementClass.includes('search') || elementClass.includes('contact')) {
        category = 'conversion';
        importance = 8;
      }
      // Forms
      else if (elementClass.includes('form') || elementId.includes('form') ||
               interactionType.includes('form') || 
               elementText.includes('formulär') || elementText.includes('form')) {
        category = 'form';
        importance = 6;
      }
      // Filter out general mousemove and scroll unless they're meaningful
      else if (interactionType.includes('mousemove_general') || 
               interactionType.includes('scroll_general')) {
        // Skip these low-value interactions
        return;
      }
      
      console.log('Categorized as:', category, 'with importance:', importance);
      
      const elementKey = interaction.element_text ? 
        interaction.element_text.substring(0, 30) : 
        (interaction.element_id || interaction.element_class || 'unknown');
      const key = `${category}_${elementKey}_${interaction.page_views.url}`;
      
      if (grouped.has(key)) {
        grouped.get(key)!.count++;
      } else {
        grouped.set(key, {
          interaction_type: interaction.interaction_type,
          element_text: interaction.element_text || '',
          element_id: interaction.element_id || '',
          element_class: interaction.element_class || '',
          count: 1,
          category,
          importance,
          url: interaction.page_views.url
        });
      }
    });
    
    return Array.from(grouped.values())
      .sort((a, b) => {
        if (a.importance !== b.importance) {
          return b.importance - a.importance;
        }
        return b.count - a.count;
      });
  };

  const groupInteractionsByCategory = (interactions: InteractionData[]): CategoryGroup[] => {
    const categoryMap = new Map<string, CategoryGroup>();
    
    interactions.forEach((interaction) => {
      if (!categoryMap.has(interaction.category)) {
        categoryMap.set(interaction.category, {
          category: interaction.category,
          importance: interaction.importance,
          totalCount: 0,
          interactions: []
        });
      }
      
      const group = categoryMap.get(interaction.category)!;
      group.totalCount += interaction.count;
      group.interactions.push(interaction);
      // Use highest importance for the category
      group.importance = Math.max(group.importance, interaction.importance);
    });
    
    // Sort interactions within each category by count
    categoryMap.forEach(group => {
      group.interactions.sort((a, b) => b.count - a.count);
    });
    
    // Sort categories by importance then by total count
    return Array.from(categoryMap.values()).sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      return b.totalCount - a.totalCount;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cookie': return '🍪';
      case 'conversion': return '🎯';
      case 'form': return '📝';
      case 'general': return '👆';
      default: return '👆';
    }
  };

  const getCategoryColor = (category: string, importance: number) => {
    if (importance >= 9) return 'destructive'; // Cookie banner (critical)
    if (importance >= 8) return 'default'; // Conversion & Search (high)
    return 'secondary'; // Forms & General
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'cookie': return 'Cookie banner';
      case 'conversion': return 'Conversion & Search';
      case 'form': return 'Forms';
      case 'general': return 'General';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const formatElementInfo = (interaction: InteractionData) => {
    if (interaction.element_text) {
      const text = interaction.element_text.trim();
      // If text is very long, try to extract meaningful part
      if (text.length > 60) {
        // Split by common separators and take the first meaningful part
        const parts = text.split(/[.\n\t]/);
        const meaningfulPart = parts[0].trim();
        if (meaningfulPart.length > 10 && meaningfulPart.length < 60) {
          return meaningfulPart + '...';
        }
        return text.substring(0, 60) + '...';
      }
      return text;
    }
    if (interaction.element_id) {
      return `Element: #${interaction.element_id}`;
    }
    if (interaction.element_class) {
      // Show the most meaningful class name
      const classes = interaction.element_class.split(' ');
      const meaningfulClass = classes.find(cls => 
        cls.length > 3 && 
        !cls.includes('elementor') && 
        !cls.includes('wp-')
      ) || classes[0];
      return `Element: .${meaningfulClass}`;
    }
    return 'Identified element';
  };

  const getUrlPath = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Interactions</CardTitle>
          <CardDescription>Loading interaction data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categoryGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Interactions</CardTitle>
          <CardDescription>No meaningful interactions to display for this period</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This may be because:
          </p>
          <ul className="text-muted-foreground text-sm mt-2 space-y-1 list-disc list-inside">
            <li>The tracking code may need improvement for your website</li>
            <li>There may not be enough visitors yet</li>
            <li>The elements on the website lack identifiable information</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> For navigation analysis, go to the Heatmap tab → Navigation Analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 3, categoryGroups.length));
  };

  const handleShowAll = () => {
    setCategoryGroups(categoryGroups);
  };

  const visibleGroups = categoryGroups.slice(0, visibleCount);
  const hasMore = visibleCount < categoryGroups.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Interactions</CardTitle>
        <CardDescription>
          Most significant clicks and interactions for your business
          {totalCount > 0 && ` (${totalCount} total)`}
          <br />
          <span className="text-xs text-muted-foreground">
            For navigation analysis, see Heatmap → Navigation Analysis
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleGroups.map((group, groupIndex) => (
            <Card key={groupIndex} className="border-l-4 border-l-primary/20">
              <CardContent className="p-4">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getCategoryIcon(group.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getCategoryColor(group.category, group.importance)}
                          className="text-xs"
                        >
                          {getCategoryDisplayName(group.category)}
                        </Badge>
                        {group.importance >= 9 && (
                          <Badge variant="outline" className="text-xs">
                            🔥 Critical
                          </Badge>
                        )}
                        {group.importance === 8 && (
                          <Badge variant="outline" className="text-xs">
                            ⭐ High priority
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mt-1">
                        {getCategoryDisplayName(group.category)}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {group.totalCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      total clicks
                    </div>
                  </div>
                </div>

                {/* Individual Interactions */}
                <div className="space-y-2 ml-10">
                  {group.interactions.map((interaction, interactionIndex) => (
                    <div 
                      key={interactionIndex}
                      className="flex items-center justify-between py-2 px-3 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {formatElementInfo(interaction)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getUrlPath(interaction.url)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-semibold">
                          {interaction.count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          clicks
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Pagination Controls */}
        {categoryGroups.length > 3 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min(visibleCount, categoryGroups.length)} of {categoryGroups.length} categories
              </div>
              
              <div className="flex gap-2">
                {hasMore && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      className="text-xs"
                    >
                      Show more
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShowAll}
                      className="text-xs"
                    >
                      Show all ({categoryGroups.length})
                    </Button>
                  </>
                )}
                {!hasMore && categoryGroups.length > 3 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setVisibleCount(3)}
                    className="text-xs"
                  >
                    Show less
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {categoryGroups.length > 0 && (
          <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                <p className="mb-2">Focused categories (Navigation moved to Heatmap → Navigation Analytics):</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="destructive" className="text-xs">🍪 Cookie banner</Badge>
                  <Badge variant="default" className="text-xs">🎯 Conversion & Search</Badge>
                  <Badge variant="secondary" className="text-xs">📝 Forms</Badge>
                </div>
                <p className="mt-2 text-xs">
                  💡 <strong>Navigation:</strong> All navigation data is now under Heatmap → Navigation Analytics
                </p>
              </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}