/**
 * Heatmap Analytics Tracking Script - GDPR Compliant
 * Version: 4.0.0
 * Förbättrad för Supabase Edge Functions
 */

(function() {
  'use strict';

  // Vänta på config från WordPress
  function waitForConfig(callback) {
    if (window.heatmapAnalyticsConfig) {
      callback();
    } else {
      setTimeout(() => waitForConfig(callback), 100);
    }
  }

  // Huvudtracker klass
  class HeatmapAnalyticsTracker {
    constructor() {
      this.config = null;
      this.sessionId = null;
      this.userId = null;
      this.eventQueue = [];
      this.isTracking = false;
      this.lastActivity = Date.now();
      this.sessionStartTime = Date.now();
      this.consentGiven = false;
      
      // Throttling för events
      this.throttleDelay = 100;
      this.lastMouseMove = 0;
      this.lastScroll = 0;
    }

    init(config) {
      console.log('Heatmap Analytics: Initialiserar tracker', config);
      
      this.config = config;
      this.sessionId = this.generateSessionId();
      
      // Kontrollera GDPR consent
      if (config.gdprEnabled) {
        if (!this.checkConsent()) {
          console.log('Heatmap Analytics: Väntar på GDPR-samtycke');
          this.waitForConsent();
          return;
        }
      }
      
      this.startTracking();
    }

    checkConsent() {
      // Kolla cookies för samtycke
      const consentCookie = this.getCookie('heatmap_consent');
      const analyticsCookie = this.getCookie('heatmap_analytics');
      
      console.log('Heatmap Analytics: Kollar samtycke', {
        consentCookie: !!consentCookie,
        analyticsCookie: !!analyticsCookie
      });
      
      if (consentCookie) {
        try {
          const consent = JSON.parse(consentCookie);
          if (consent.analytics === true) {
            this.consentGiven = true;
            return true;
          }
        } catch (e) {
          console.error('Fel vid parsing av consent cookie:', e);
        }
      }
      
      return false;
    }

    waitForConsent() {
      // Lyssna på consent events
      document.addEventListener('consentUpdated', (e) => {
        console.log('Heatmap Analytics: Consent uppdaterat', e.detail);
        if (e.detail.analytics) {
          this.consentGiven = true;
          this.startTracking();
        }
      });

      // Kolla också heatmap_consent_granted event
      document.addEventListener('heatmap_consent_granted', () => {
        console.log('Heatmap Analytics: Legacy consent event');
        if (this.checkConsent()) {
          this.startTracking();
        }
      });

      // Polling fallback
      const checkInterval = setInterval(() => {
        if (this.checkConsent()) {
          clearInterval(checkInterval);
          this.startTracking();
        }
      }, 1000);

      // Rensa efter 30 sekunder
      setTimeout(() => clearInterval(checkInterval), 30000);
    }

    startTracking() {
      if (this.isTracking) return;
      
      // Check if session needs rotation for GDPR compliance
      this.rotateSessionIfNeeded();
      
      console.log('📊 Heatmap Analytics: Startar tracking med session:', this.sessionId);
      this.isTracking = true;

      // Skicka session start
      this.trackEvent('session_start', {
        sessionId: this.sessionId,
        startTime: this.sessionStartTime,
        ...this.getDeviceInfo()
      });

      // Skicka page view
      this.trackPageView();

      // Sätt upp event listeners
      this.attachEventListeners();

      // Starta periodisk flush
      setInterval(() => this.flushEvents(), 5000);
      
      // Session updates varje minut med rotation check
      setInterval(() => {
        this.updateSession();
        this.rotateSessionIfNeeded();
      }, 60000);
    }

    generateSessionId() {
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    shouldRotateSession() {
      const lastRotation = localStorage.getItem('heatmap_last_rotation');
      if (!lastRotation) return true;
      
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      return parseInt(lastRotation) < thirtyMinutesAgo;
    }

    rotateSessionIfNeeded() {
      if (this.shouldRotateSession()) {
        const oldSessionId = this.sessionId;
        this.sessionId = this.generateSessionId();
        localStorage.setItem('heatmap_session_id', this.sessionId);
        localStorage.setItem('heatmap_last_rotation', Date.now().toString());
        
        console.log('🔄 Session rotated for GDPR compliance:', oldSessionId, '->', this.sessionId);
        
        // Track session rotation event
        this.trackEvent('session_rotation', {
          old_session_id: oldSessionId,
          new_session_id: this.sessionId,
          timestamp: Date.now()
        });
      }
    }

    getDeviceInfo() {
      return {
        deviceType: this.getDeviceType(),
        screenWidth: screen.width,
        screenHeight: screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        url: window.location.href,
        referrer: document.referrer || null
      };
    }

    getDeviceType() {
      const ua = navigator.userAgent;
      if (/iPad/i.test(ua)) return 'tablet';
      if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
      return 'desktop';
    }

    trackEvent(type, data) {
      if (!this.isTracking || !this.consentGiven) return;

      const event = {
        type: type,
        event_type: type, // Både för kompatibilitet
        data: data,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        tracking_id: this.config.trackingId,
        url: window.location.href,
        ...this.getDeviceInfo()
      };

      this.eventQueue.push(event);
      this.lastActivity = Date.now();

      // Flush direkt för viktiga events
      if (['session_start', 'pageview'].includes(type)) {
        setTimeout(() => this.flushEvents(), 100);
      }
    }

    trackPageView() {
      this.trackEvent('pageview', {
        title: document.title,
        url: window.location.href,
        referrer: document.referrer
      });
    }

    trackClick(event) {
      const element = event.target;
      const rect = element.getBoundingClientRect();
      
      // Check if this is a navigation click
      const menuData = this.extractNavigationData(element, event);
      
      const eventData = {
        type: 'click',
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        elementX: Math.round(rect.left + window.scrollX),
        elementY: Math.round(rect.top + window.scrollY),
        element: this.getElementInfo(element)
      };

      // Add navigation data if this is a menu click
      if (menuData) {
        eventData.navigation = menuData;
        this.trackNavigationClick(menuData);
      }
      
      this.trackEvent('interaction', eventData);
    }

    extractNavigationData(element, event) {
      // Look for WordPress menu item patterns
      const menuItem = element.closest('.menu-item, .menu-item a, [class*="menu-item"]');
      
      if (!menuItem) return null;

      // Try to find the actual link element
      const link = element.tagName === 'A' ? element : menuItem.querySelector('a');
      
      if (!link) return null;

      // Extract WordPress menu item data
      const classList = Array.from(menuItem.classList);
      const menuItemId = this.extractMenuItemId(classList);
      const menuTitle = link.textContent?.trim() || '';
      const menuUrl = link.href || '';
      
      if (!menuItemId) return null;

      // Determine menu location and level
      const menuLocation = this.determineMenuLocation(menuItem);
      const menuLevel = this.determineMenuLevel(menuItem);
      
      return {
        menu_item_id: menuItemId,
        menu_title: menuTitle,
        menu_url: menuUrl,
        menu_location: menuLocation,
        menu_level: menuLevel,
        css_classes: classList,
        click_position: {
          x: event.clientX,
          y: event.clientY
        }
      };
    }

    extractMenuItemId(classList) {
      // WordPress adds classes like 'menu-item-123'
      for (const className of classList) {
        const match = className.match(/menu-item-(\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
      return null;
    }

    determineMenuLocation(menuItem) {
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

    determineMenuLevel(menuItem) {
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

    trackNavigationClick(menuData) {
      if (!this.isTracking || !this.consentGiven) return;

      console.log('🧭 Tracking navigation click:', menuData);

      // Prepare navigation tracking data
      const navigationEvent = {
        site_id: this.config.trackingId,
        menu_item_id: menuData.menu_item_id,
        menu_title: menuData.menu_title,
        menu_url: menuData.menu_url,
        device_type: this.getDeviceType(),
        timestamp: Date.now()
      };

      // Send to navigation tracking endpoint
      this.sendToNavigationEndpoint(navigationEvent);
    }

    sendToNavigationEndpoint(data) {
      if (!this.config.apiEndpoint) return;

      // Extract base URL and create navigation endpoint
      const baseUrl = this.config.apiEndpoint.replace('/pixel-tracking', '');
      const navigationUrl = `${baseUrl}/track-navigation`;

      fetch(navigationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        console.log('Navigation tracking success:', result);
      })
      .catch(error => {
        console.error('Navigation tracking failed:', error);
      });
    }

    trackMouseMove(event) {
      const now = Date.now();
      if (now - this.lastMouseMove < this.throttleDelay) return;
      this.lastMouseMove = now;

      this.trackEvent('interaction', {
        type: 'mousemove',
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      });
    }

    trackScroll() {
      const now = Date.now();
      if (now - this.lastScroll < this.throttleDelay) return;
      this.lastScroll = now;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPercentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

      this.trackEvent('interaction', {
        type: 'scroll',
        scrollTop,
        scrollPercentage
      });
    }

    getElementInfo(element) {
      if (!element) return null;
      
      return {
        tagName: element.tagName?.toLowerCase(),
        id: element.id || null,
        className: element.className || null,
        text: element.textContent?.substring(0, 100) || null,
        href: element.href || null
      };
    }

    updateSession() {
      const duration = Date.now() - this.sessionStartTime;
      this.trackEvent('session_update', {
        duration,
        lastActivity: this.lastActivity
      });
    }

    flushEvents() {
      if (this.eventQueue.length === 0) return;

      const events = this.eventQueue.splice(0);
      console.log('Heatmap Analytics: Skickar batch med', events.length, 'events');

      // VIKTIGT: Använd rätt format för Supabase Edge Function
      const payload = {
        type: 'batch',
        siteId: this.config.trackingId,  // Edge function väntar sig siteId
        sessionId: this.sessionId,       // Edge function väntar sig sessionId
        events: events.map(event => ({
          type: event.type,
          event_type: event.type,
          data: {
            ...event.data,
            url: event.url || window.location.href,  // Säkerställ att URL finns
            deviceType: event.data?.deviceType || this.getDeviceType()
          },
          timestamp: event.timestamp
        }))
      };

      console.log('Heatmap Analytics: Payload:', JSON.stringify(payload, null, 2));

      // Skicka till Supabase
      fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true
      })
      .then(response => {
        console.log('Heatmap Analytics: Response status:', response.status);
        if (!response.ok) {
          return response.text().then(text => {
            console.error('Heatmap Analytics: Error response:', text);
            throw new Error(`HTTP ${response.status}: ${text}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Heatmap Analytics: Success:', data);
      })
      .catch(error => {
        console.error('Heatmap Analytics: Send failed:', error);
        // Lägg tillbaka events i kön för retry (optional)
        // this.eventQueue.unshift(...events);
      });
    }

    attachEventListeners() {
      // Click tracking
      document.addEventListener('click', (e) => this.trackClick(e), true);
      
      // Mouse movement (throttled)
      document.addEventListener('mousemove', (e) => this.trackMouseMove(e));
      
      // Scroll tracking (throttled)  
      window.addEventListener('scroll', () => this.trackScroll());
      
      // Page visibility
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.updateSession();
          this.flushEvents();
        }
      });
      
      // Unload events
      window.addEventListener('beforeunload', () => {
        this.updateSession();
        this.flushEvents();
      });

      window.addEventListener('unload', () => {
        this.flushEvents();
      });
    }

    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }

    // Public methods
    consent(granted) {
      console.log('Heatmap Analytics: Consent manually set to', granted);
      this.consentGiven = granted;
      if (granted && !this.isTracking) {
        this.startTracking();
      }
    }

    destroy() {
      console.log('Heatmap Analytics: Destroying tracker');
      this.isTracking = false;
      this.consentGiven = false;
      this.flushEvents();
    }
  }

  // Global API
  window.HeatmapAnalyticsTracker = new HeatmapAnalyticsTracker();

  // Custom track function
  window.Analytics = {
    track: function(eventName, properties) {
      if (window.HeatmapAnalyticsTracker && window.HeatmapAnalyticsTracker.isTracking) {
        window.HeatmapAnalyticsTracker.trackEvent('custom', {
          eventName,
          properties
        });
      }
    },
    
    identify: function(userId, traits) {
      if (window.HeatmapAnalyticsTracker) {
        window.HeatmapAnalyticsTracker.userId = userId;
        window.HeatmapAnalyticsTracker.trackEvent('identify', {
          userId,
          traits
        });
      }
    }
  };

  // Auto-initialize när config är tillgänglig
  waitForConfig(() => {
    if (window.heatmapAnalyticsConfig) {
      console.log('Heatmap Analytics: Config hittad, initialiserar...');
      window.HeatmapAnalyticsTracker.init(window.heatmapAnalyticsConfig);
    }
  });

})();