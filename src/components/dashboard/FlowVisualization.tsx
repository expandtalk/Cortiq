import React, { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  MarkerType,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, MousePointer, Navigation, Contact, FormInput } from 'lucide-react';
import { useScreenshots, type SiteScreenshots } from '@/hooks/useScreenshots';
import type { HeatmapPoint } from '@/types/dashboard';

// Custom node component for heatmap points
const HeatPointNode = ({ data }: { data: any }) => (
  <div className="bg-white border-2 border-red-500 rounded-full p-1 shadow-lg min-w-[20px] min-h-[20px] flex items-center justify-center">
    <div className="text-xs font-bold text-red-600">
      {data.intensity}
    </div>
  </div>
);

const nodeTypes = {
  heatPoint: HeatPointNode,
};

interface FlowVisualizationProps {
  heatmapData: HeatmapPoint[];
  selectedUrl: string;
  loading?: boolean;
  siteId: string | null;
  filters?: {
    deviceType?: string;
  };
}

export function FlowVisualization({ 
  heatmapData,
  selectedUrl,
  loading,
  siteId,
  filters
}: FlowVisualizationProps) {
  const [screenshots, setScreenshots] = useState<SiteScreenshots>({});
  const { getScreenshots, getScreenshotForPage } = useScreenshots();

  useEffect(() => {
    if (siteId) {
      loadScreenshots();
    }
  }, [siteId]);

  const loadScreenshots = async () => {
    try {
      const screenshotData = await getScreenshots(siteId!);
      setScreenshots(screenshotData);
    } catch (error) {
      console.error('Failed to load screenshots:', error);
    }
  };

  const currentScreenshot = getScreenshotForPage(screenshots, selectedUrl, filters?.deviceType || 'desktop');
  
  const getViewportSize = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return { width: 375, height: 667 };
      case 'tablet': return { width: 768, height: 1024 };
      case 'desktop': return { width: 1200, height: 800 };
      default: return { width: 1200, height: 800 };
    }
  };

  const viewportSize = getViewportSize(filters?.deviceType || 'desktop');

  // Smart kategorisering baserat på interaction_type och annan data
  const isAdminClick = (point: HeatmapPoint): boolean => {
    // Admin URL patterns
    const adminUrls = ['/admin', '/wp-admin', '/dashboard', '/redigera', '/edit'];
    const hasAdminUrl = adminUrls.some(url => selectedUrl.includes(url));
    
    // Admin element text patterns (case insensitive)
    const adminTexts = ['redigera inlägg', 'admin panel', 'admin', 'edit', 'dashboard', 'login'];
    const hasAdminText = adminTexts.some(text => 
      point.element_text?.toLowerCase().includes(text.toLowerCase())
    );
    
    // Admin IP addresses (konfigurera i sites tabellen för bättre hantering)
    const adminIPs = ['127.0.0.1', 'localhost']; // Temporär lista
    const hasAdminIP = adminIPs.includes(point.ip_address || '');
    
    return hasAdminUrl || hasAdminText || hasAdminIP;
  };

  // Smart kategorisering baserat på interaction_type och data
  const getClickCategory = (point: HeatmapPoint): 'navigation' | 'forms' | 'contact' | 'other' => {
    const interactionType = point.interaction_type?.toLowerCase() || '';
    const elementText = point.element_text?.toLowerCase() || '';
    
    console.log('Smart kategorisering:', {
      point: {
        interaction_type: point.interaction_type,
        element_text: point.element_text,
        x: point.x_coordinate,
        y: point.y_coordinate
      },
      interactionType,
      elementText
    });
    
    // Kategorisering baserad på interaction_type (från tracking data)
    if (interactionType.includes('navigation') || interactionType.includes('nav')) {
      console.log('✅ Navigation detected via interaction_type');
      return 'navigation';
    }
    
    if (interactionType.includes('form') || interactionType.includes('submit')) {
      console.log('✅ Form detected via interaction_type');
      return 'forms';
    }
    
    if (interactionType.includes('contact') || interactionType.includes('phone') || interactionType.includes('call')) {
      console.log('✅ Contact detected via interaction_type');
      return 'contact';
    }
    
    // Backup kategorisering baserad på element_text
    if (elementText) {
      // Navigation patterns
      const navPatterns = ['meny', 'navigation', 'nav', 'hem', 'home', 'about', 'om oss', 'tjänster', 'services'];
      if (navPatterns.some(pattern => elementText.includes(pattern))) {
        console.log('✅ Navigation detected via element_text');
        return 'navigation';
      }
      
      // Form patterns
      const formPatterns = ['formulär', 'form', 'submit', 'skicka', 'input', 'textarea', 'checkbox', 'button'];
      if (formPatterns.some(pattern => elementText.includes(pattern))) {
        console.log('✅ Form detected via element_text');
        return 'forms';
      }
      
      // Contact patterns
      const contactPatterns = ['kontakt', 'contact', 'ring', 'call', 'email', 'mejl', 'telefon', 'phone', 'boka', 'book'];
      if (contactPatterns.some(pattern => elementText.includes(pattern))) {
        console.log('✅ Contact detected via element_text');
        return 'contact';
      }
    }
    
    // Positionsbaserad kategorisering (experimentell)
    // Navigation är ofta i toppen (y < 200) eller i sidbaren
    if (point.y_coordinate < 200 && !elementText.includes('header')) {
      console.log('🔍 Possible navigation detected via position (top area)');
      return 'navigation';
    }
    
    console.log('❓ No pattern matched - categorized as other');
    return 'other';
  };

  // Filter data based on category and exclude admin clicks
  const filterDataByCategory = (category: string): HeatmapPoint[] => {
    const filtered = heatmapData.filter(point => {
      // Always exclude admin clicks
      if (isAdminClick(point)) {
        console.log('🚫 Admin click excluded:', point);
        return false;
      }
      
      if (category === 'all') return true;
      return getClickCategory(point) === category;
    });
    
    console.log(`📊 Category "${category}" has ${filtered.length} points:`, filtered);
    return filtered;
  };

  const [activeTab, setActiveTab] = useState('all');

  const initialNodes: Node[] = [
    {
      id: 'viewport',
      type: 'group',
      position: { x: 50, y: 50 },
      style: {
        width: viewportSize.width,
        height: viewportSize.height,
        backgroundColor: currentScreenshot ? 'transparent' : '#f8f9fa',
        backgroundImage: currentScreenshot ? `url(${currentScreenshot.url})` : 'none',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top left',
        border: '1px solid #d1d5db',
        borderRadius: 8,
        overflow: 'hidden'
      },
      data: {
        label: currentScreenshot ? '' : 'No screenshot available',
      },
    }
  ];
  
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  
  // Get filtered data based on active tab
  const getFilteredData = (): HeatmapPoint[] => {
    return filterDataByCategory(activeTab);
  };

  React.useEffect(() => {
    // Update initial nodes when screenshot changes
    const updatedInitialNodes: Node[] = [
      {
        id: 'viewport',
        type: 'group',
        position: { x: 50, y: 50 },
        style: {
          width: viewportSize.width,
          height: viewportSize.height,
          backgroundColor: currentScreenshot ? 'transparent' : '#f8f9fa',
          backgroundImage: currentScreenshot ? `url(${currentScreenshot.url})` : 'none',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top left',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          overflow: 'hidden'
        },
        data: {
          label: currentScreenshot ? '' : 'No screenshot available',
        },
      }
    ];

    const filteredData = getFilteredData();
    
    if (!filteredData.length) {
      setNodes(updatedInitialNodes);
      return;
    }
    
    // Create nodes for each filtered heatmap point
    const heatmapNodes = filteredData.map((point, index) => {
      const intensity = point.intensity || 1;
      const scale = Math.min(Math.max(intensity / 10, 0.5), 2);
      const color = getIntensityColor(intensity);
      
      // Scale coordinates to match the viewport size
      const scaleX = viewportSize.width / 1200; // Assuming original is 1200px wide
      const scaleY = viewportSize.height / 800; // Assuming original is 800px high
      
      return {
        id: `point-${index}`,
        type: 'heatPoint',
        position: { 
          x: (point.x_coordinate * scaleX) + 50, // Add offset for viewport position
          y: (point.y_coordinate * scaleY) + 50 
        },
        style: {
          width: 20 * scale,
          height: 20 * scale,
          backgroundColor: color,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: intensity,
          opacity: Math.min(intensity * 0.1 + 0.5, 1),
        },
        data: {
          intensity: intensity,
          x: point.x_coordinate,
          y: point.y_coordinate,
          type: point.interaction_type,
          label: point.intensity,
        }
      };
    });
    
    setNodes([...updatedInitialNodes, ...heatmapNodes]);
  }, [heatmapData, currentScreenshot?.url, viewportSize.width, viewportSize.height, activeTab]);
  
  const getIntensityColor = (intensity: number): string => {
    if (intensity > 8) return '#dc2626'; // red-600
    if (intensity > 6) return '#ef4444'; // red-500
    if (intensity > 4) return '#f97316'; // orange-500
    if (intensity > 2) return '#eab308'; // yellow-500
    return '#3b82f6'; // blue-500
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Flow Visualization
          </CardTitle>
          <CardDescription>Loading visualization data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Get counts for each category
  const getCategoryCounts = () => {
    const allData = filterDataByCategory('all');
    const navigation = filterDataByCategory('navigation');
    const forms = filterDataByCategory('forms');
    const contact = filterDataByCategory('contact');
    
    return {
      all: allData.length,
      navigation: navigation.length,
      forms: forms.length,
      contact: contact.length
    };
  };

  const counts = getCategoryCounts();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Flow Visualization
        </CardTitle>
        <CardDescription>
          Visualizing interaction points for {selectedUrl} (exkluderar admin-klick)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Navigation ({counts.navigation})
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              Forms & Leads ({counts.forms})
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Contact className="h-4 w-4" />
              Contact & Conversion ({counts.contact})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            <div style={{ height: 800 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
              >
                <Controls />
                <MiniMap />
                <Background color="#aaa" gap={16} />
              </ReactFlow>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}