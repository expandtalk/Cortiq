/**
 * Service Worker for Cookie Banner Performance & Offline Handling
 * Optimizes cookie definitions caching and provides offline capabilities
 */

const CACHE_NAME = 'cookie-definitions-v1';
const CRITICAL_COOKIES_CACHE = 'critical-cookies-v1';

// Critical cookie definitions that must be cached
const CRITICAL_COOKIE_DEFINITIONS = [
  'gdpr_consent',
  'heatmap_analytics', 
  '_ga',
  '_gid',
  '_fbp',
  'PHPSESSID'
];

// Performance monitoring data
let performanceData = {
  cacheHits: 0,
  cacheMisses: 0,
  averageResponseTime: 0,
  lastUpdated: null
};

self.addEventListener('install', (event) => {
  console.log('🍪 Cookie Performance SW: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Preload critical cookie definitions
      caches.open(CRITICAL_COOKIES_CACHE).then(cache => {
        return cache.addAll(
          CRITICAL_COOKIE_DEFINITIONS.map(cookieName => 
            `/api/cookie-definition/${cookieName}`
          )
        );
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('🍪 Cookie Performance SW: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('cookie-definitions-') && 
              cacheName !== CACHE_NAME
            )
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle cookie-related API requests
  if (url.pathname.includes('/cookie-definition') || 
      url.pathname.includes('/active-cookies') ||
      url.pathname.includes('/detected-cookies')) {
    
    event.respondWith(handleCookieRequest(event.request));
  }
});

async function handleCookieRequest(request) {
  const startTime = performance.now();
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Cache hit - return immediately
    performanceData.cacheHits++;
    updatePerformanceMetrics(performance.now() - startTime);
    
    console.log('🍪 SW: Cache hit for', request.url);
    
    // Update cache in background if data is old
    if (isCacheStale(cachedResponse)) {
      updateCacheInBackground(request, cache);
    }
    
    return cachedResponse;
  }
  
  // Cache miss - fetch from network
  performanceData.cacheMisses++;
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      
      updatePerformanceMetrics(performance.now() - startTime);
      console.log('🍪 SW: Network fetch and cached', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('🍪 SW: Network fetch failed', error);
    
    // Return fallback response for critical cookie definitions
    return createFallbackResponse(request);
  }
}

function isCacheStale(response) {
  const cacheDate = new Date(response.headers.get('date') || 0);
  const now = new Date();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  return (now - cacheDate) > maxAge;
}

async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      console.log('🍪 SW: Background cache update completed');
    }
  } catch (error) {
    console.warn('🍪 SW: Background cache update failed', error);
  }
}

function createFallbackResponse(request) {
  const url = new URL(request.url);
  
  // Provide fallback cookie definitions for offline scenarios
  const fallbackData = {
    cookies: {
      necessary: [
        { 
          cookie_name: 'gdpr_consent',
          provider_name: 'Heatmap Analytics',
          category_key: 'necessary',
          purpose: 'Stores GDPR consent preferences',
          expiry: '1 year'
        }
      ],
      analytics: [],
      marketing: [],
      preferences: []
    },
    counts: {
      necessary: 1,
      analytics: 0,
      marketing: 0,
      preferences: 0
    }
  };
  
  return new Response(JSON.stringify(fallbackData), {
    status: 200,
    statusText: 'OK (Offline Fallback)',
    headers: {
      'Content-Type': 'application/json',
      'X-Served-By': 'ServiceWorker-Fallback'
    }
  });
}

function updatePerformanceMetrics(responseTime) {
  const totalRequests = performanceData.cacheHits + performanceData.cacheMisses;
  
  if (totalRequests === 1) {
    performanceData.averageResponseTime = responseTime;
  } else {
    // Calculate rolling average
    performanceData.averageResponseTime = 
      (performanceData.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }
  
  performanceData.lastUpdated = Date.now();
  
  // Send performance data to main thread periodically
  if (totalRequests % 10 === 0) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'COOKIE_SW_PERFORMANCE',
          data: performanceData
        });
      });
    });
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_PERFORMANCE_DATA') {
    event.ports[0].postMessage(performanceData);
  }
});

// Performance monitoring for the service worker itself
self.addEventListener('sync', (event) => {
  if (event.tag === 'cookie-performance-sync') {
    event.waitUntil(syncPerformanceData());
  }
});

async function syncPerformanceData() {
  try {
    // Send performance data to analytics
    const response = await fetch('/api/cookie-performance-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(performanceData)
    });
    
    if (response.ok) {
      console.log('🍪 SW: Performance data synced successfully');
    }
  } catch (error) {
    console.warn('🍪 SW: Failed to sync performance data', error);
  }
}