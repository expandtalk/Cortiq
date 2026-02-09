import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  bannerLoadTime: number;
  cookieLoadTime: number;
  consentSaveTime: number;
  cacheHitRate: number;
  averageResponseTime: number;
  errorRate: number;
}

interface ServiceWorkerPerformanceData {
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  lastUpdated: number | null;
}

export function useCookiePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    bannerLoadTime: 0,
    cookieLoadTime: 0,
    consentSaveTime: 0,
    cacheHitRate: 0,
    averageResponseTime: 0,
    errorRate: 0
  });

  const [isServiceWorkerActive, setIsServiceWorkerActive] = useState(false);

  useEffect(() => {
    // Register service worker for cookie performance optimization
    registerCookieServiceWorker();
    
    // Listen for service worker performance messages
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    
    // Load stored performance data
    loadStoredPerformanceData();

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const registerCookieServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          '/cookie-performance-sw.js',
          { scope: '/' }
        );
        
        console.log('🍪 Cookie Performance SW registered:', registration);
        setIsServiceWorkerActive(true);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          console.log('🍪 Cookie Performance SW update found');
        });

      } catch (error) {
        console.warn('🍪 Failed to register Cookie Performance SW:', error);
      }
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data?.type === 'COOKIE_SW_PERFORMANCE') {
      const swData: ServiceWorkerPerformanceData = event.data.data;
      updateMetricsFromServiceWorker(swData);
    }
  };

  const updateMetricsFromServiceWorker = (swData: ServiceWorkerPerformanceData) => {
    const totalRequests = swData.cacheHits + swData.cacheMisses;
    const cacheHitRate = totalRequests > 0 ? (swData.cacheHits / totalRequests) * 100 : 0;

    setMetrics(prev => ({
      ...prev,
      cacheHitRate,
      averageResponseTime: swData.averageResponseTime
    }));
  };

  const loadStoredPerformanceData = () => {
    try {
      const stored = localStorage.getItem('cookie_performance_metrics');
      if (stored) {
        const data = JSON.parse(stored);
        setMetrics(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.warn('Failed to load stored performance data:', error);
    }
  };

  const trackBannerLoadTime = useCallback((loadTime: number) => {
    setMetrics(prev => {
      const updated = { ...prev, bannerLoadTime: loadTime };
      
      // Store in localStorage
      localStorage.setItem('cookie_performance_metrics', JSON.stringify(updated));
      
      // Send to analytics if available
      if (window.gtag) {
        window.gtag('event', 'cookie_banner_performance', {
          event_category: 'Performance',
          event_label: 'Banner Load Time',
          value: Math.round(loadTime),
          custom_map: {
            metric_type: 'load_time'
          }
        });
      }
      
      return updated;
    });
  }, []);

  const trackCookieLoadTime = useCallback((loadTime: number) => {
    setMetrics(prev => {
      const updated = { ...prev, cookieLoadTime: loadTime };
      localStorage.setItem('cookie_performance_metrics', JSON.stringify(updated));
      
      if (window.gtag) {
        window.gtag('event', 'cookie_data_performance', {
          event_category: 'Performance',
          event_label: 'Cookie Data Load',
          value: Math.round(loadTime)
        });
      }
      
      return updated;
    });
  }, []);

  const trackConsentSaveTime = useCallback((saveTime: number) => {
    setMetrics(prev => {
      const updated = { ...prev, consentSaveTime: saveTime };
      localStorage.setItem('cookie_performance_metrics', JSON.stringify(updated));
      
      if (window.gtag) {
        window.gtag('event', 'consent_save_performance', {
          event_category: 'Performance',
          event_label: 'Consent Save Time',
          value: Math.round(saveTime)
        });
      }
      
      return updated;
    });
  }, []);

  const trackError = useCallback((errorType: string, errorMessage: string) => {
    setMetrics(prev => {
      const updated = { 
        ...prev, 
        errorRate: prev.errorRate + 1 
      };
      localStorage.setItem('cookie_performance_metrics', JSON.stringify(updated));
      
      if (window.gtag) {
        window.gtag('event', 'cookie_error', {
          event_category: 'Error',
          event_label: errorType,
          value: 1,
          custom_map: {
            error_message: errorMessage
          }
        });
      }
      
      return updated;
    });
  }, []);

  const getPerformanceReport = useCallback(async () => {
    // Get service worker performance data
    if (navigator.serviceWorker?.controller) {
      const channel = new MessageChannel();
      
      return new Promise<PerformanceMetrics>((resolve) => {
        channel.port1.onmessage = (event) => {
          const swData = event.data;
          resolve({
            ...metrics,
            cacheHitRate: swData.cacheHits / (swData.cacheHits + swData.cacheMisses) * 100,
            averageResponseTime: swData.averageResponseTime
          });
        };
        
        navigator.serviceWorker.controller?.postMessage(
          { type: 'GET_PERFORMANCE_DATA' },
          [channel.port2]
        );
      });
    }
    
    return metrics;
  }, [metrics]);

  const resetMetrics = useCallback(() => {
    const resetData: PerformanceMetrics = {
      bannerLoadTime: 0,
      cookieLoadTime: 0,
      consentSaveTime: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
    
    setMetrics(resetData);
    localStorage.removeItem('cookie_performance_metrics');
  }, []);

  return {
    metrics,
    isServiceWorkerActive,
    trackBannerLoadTime,
    trackCookieLoadTime,
    trackConsentSaveTime,
    trackError,
    getPerformanceReport,
    resetMetrics
  };
}