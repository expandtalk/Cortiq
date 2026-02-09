/**
 * Heatmap Analytics Tracking Script - GDPR Compliant
 * Version: 3.2.0
 * Korrigerad för UUID session IDs
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
      
      console.log('Heatmap Analytics: Startar tracking med session:', this.sessionId);
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
      
      // Session updates varje minut
      setInterval(() => this.updateSession(), 60000);
    }

    generateSessionId() {
      // Generate proper UUID format for database compatibility
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
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
        url: window.location.href
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
      
      this.trackEvent('interaction', {
        type: 'click',
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
        elementX: Math.round(rect.left + window.scrollX),
        elementY: Math.round(rect.top + window.scrollY),
        element: this.getElementInfo(element),
        deviceType: this.getDeviceType(),
        url: window.location.href
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
        deviceType: this.getDeviceType(),
        url: window.location.href
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
        scrollPercentage,
        deviceType: this.getDeviceType(),
        url: window.location.href
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
          data: event.data,
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