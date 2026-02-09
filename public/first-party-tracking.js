/**
 * First-Party Analytics Tracking Script
 * Version: 1.0.0
 * Använder first-party cookies och domain för förbättrad kompatibilitet
 */

(function() {
  'use strict';

  class FirstPartyTracker {
    constructor() {
      this.config = null;
      this.sessionId = null;
      this.eventQueue = [];
      this.isTracking = false;
      this.lastActivity = Date.now();
      this.sessionStartTime = Date.now();
      this.consentGiven = false;
      
      // First-party cookie settings
      this.cookieDomain = this.getCurrentDomain();
      this.cookiePrefix = '__analytics_';
      
      // Throttling
      this.throttleDelay = 100;
      this.lastMouseMove = 0;
      this.lastScroll = 0;
      
      console.log('First-Party Analytics: Initialiserar för domain:', this.cookieDomain);
    }

    getCurrentDomain() {
      // Använd current domain för first-party cookies
      return window.location.hostname;
    }

    init(config) {
      console.log('First-Party Analytics: Konfigurerar tracker', config);
      
      this.config = {
        ...config,
        // Använd first-party proxy endpoint istället för direct Supabase
        apiEndpoint: `${window.location.origin}/api/analytics/track`,
        proxyEndpoint: `${window.location.origin}/api/proxy`
      };
      
      // Hämta eller skapa session ID från first-party cookie
      this.sessionId = this.getOrCreateSessionId();
      this.userId = this.getOrCreateUserId();
      
      // Kontrollera consent med first-party cookies
      if (config.gdprEnabled) {
        if (!this.checkFirstPartyConsent()) {
          console.log('First-Party Analytics: Väntar på GDPR-samtycke');
          this.waitForConsent();
          return;
        }
      }
      
      this.startTracking();
    }

    getOrCreateSessionId() {
      const cookieName = `${this.cookiePrefix}session_id`;
      let sessionId = this.getFirstPartyCookie(cookieName);
      
      if (!sessionId) {
        sessionId = this.generateUUID();
        this.setFirstPartyCookie(cookieName, sessionId, 30); // 30 minuter session
        console.log('First-Party Analytics: Ny session skapad:', sessionId);
      } else {
        console.log('First-Party Analytics: Befintlig session hittad:', sessionId);
      }
      
      return sessionId;
    }

    getOrCreateUserId() {
      const cookieName = `${this.cookiePrefix}user_id`;
      let userId = this.getFirstPartyCookie(cookieName);
      
      if (!userId) {
        userId = this.generateUUID();
        this.setFirstPartyCookie(cookieName, userId, 365); // 1 år för user tracking
        console.log('First-Party Analytics: Ny user ID skapad:', userId);
      }
      
      return userId;
    }

    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    setFirstPartyCookie(name, value, days) {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      
      // First-party cookie med Secure och SameSite
      const cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=/; domain=${this.cookieDomain}; SameSite=Lax; Secure`;
      
      document.cookie = cookieString;
      console.log('First-Party Analytics: Cookie satt:', name);
    }

    getFirstPartyCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop().split(';').shift();
      }
      return null;
    }

    checkFirstPartyConsent() {
      const consentCookie = this.getFirstPartyCookie(`${this.cookiePrefix}consent`);
      
      if (consentCookie) {
        try {
          const consent = JSON.parse(consentCookie);
          if (consent.analytics === true) {
            this.consentGiven = true;
            return true;
          }
        } catch (e) {
          console.error('First-Party Analytics: Fel vid parsing av consent cookie:', e);
        }
      }
      
      return false;
    }

    grantConsent(analyticsConsent = true) {
      const consent = {
        analytics: analyticsConsent,
        timestamp: new Date().toISOString()
      };
      
      this.setFirstPartyCookie(`${this.cookiePrefix}consent`, JSON.stringify(consent), 365);
      this.consentGiven = analyticsConsent;
      
      console.log('First-Party Analytics: Consent uppdaterat:', consent);
      
      if (analyticsConsent && !this.isTracking) {
        this.startTracking();
      }
    }

    waitForConsent() {
      // Lyssna på consent events
      document.addEventListener('analyticsConsentGranted', () => {
        console.log('First-Party Analytics: Consent event mottaget');
        this.grantConsent(true);
      });

      // Polling fallback för consent
      const checkInterval = setInterval(() => {
        if (this.checkFirstPartyConsent()) {
          clearInterval(checkInterval);
          this.startTracking();
        }
      }, 1000);

      setTimeout(() => clearInterval(checkInterval), 30000);
    }

    startTracking() {
      if (this.isTracking) return;
      
      console.log('First-Party Analytics: Startar tracking');
      this.isTracking = true;

      // Skicka session start
      this.trackEvent('session_start', {
        sessionId: this.sessionId,
        userId: this.userId,
        startTime: this.sessionStartTime,
        isFirstParty: true,
        ...this.getDeviceInfo()
      });

      // Skicka page view
      this.trackPageView();

      // Sätt upp event listeners
      this.attachEventListeners();

      // Periodisk flush
      setInterval(() => this.flushEvents(), 5000);
      
      // Session updates
      setInterval(() => this.updateSession(), 60000);
      
      // Förläng session cookie vid aktivitet
      setInterval(() => this.extendSession(), 300000); // 5 minuter
    }

    extendSession() {
      if (this.isTracking && this.consentGiven) {
        const cookieName = `${this.cookiePrefix}session_id`;
        this.setFirstPartyCookie(cookieName, this.sessionId, 30);
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
        referrer: document.referrer || null,
        firstPartyDomain: this.cookieDomain
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
        data: {
          ...data,
          userId: this.userId,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          firstParty: true
        },
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        tracking_id: this.config.trackingId,
        url: window.location.href,
        ...this.getDeviceInfo()
      };

      this.eventQueue.push(event);
      this.lastActivity = Date.now();

      // Flush viktiga events direkt
      if (['session_start', 'pageview'].includes(type)) {
        setTimeout(() => this.flushEvents(), 100);
      }
    }

    trackPageView() {
      this.trackEvent('pageview', {
        title: document.title,
        url: window.location.href,
        referrer: document.referrer,
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
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
        element: this.getElementInfo(element)
      });
    }

    trackMouseMove(event) {
      const now = Date.now();
      if (now - this.lastMouseMove < this.throttleDelay) return;
      this.lastMouseMove = now;

      this.trackEvent('interaction', {
        type: 'mousemove',
        x: Math.round(event.clientX),
        y: Math.round(event.clientY)
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
      console.log('First-Party Analytics: Skickar', events.length, 'events');

      const payload = {
        type: 'batch',
        siteId: this.config.siteId || this.config.trackingId,
        sessionId: this.sessionId,
        userId: this.userId,
        firstParty: true,
        events: events
      };

      // Använd first-party endpoint (bör routas via din server)
      fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin' // Viktigt för first-party cookies
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('First-Party Analytics: Success:', data);
      })
      .catch(error => {
        console.error('First-Party Analytics: Error:', error);
      });
    }

    attachEventListeners() {
      document.addEventListener('click', (e) => this.trackClick(e), true);
      document.addEventListener('mousemove', (e) => this.trackMouseMove(e));
      window.addEventListener('scroll', () => this.trackScroll());
      
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.updateSession();
          this.flushEvents();
        }
      });
      
      window.addEventListener('beforeunload', () => {
        this.updateSession();
        this.flushEvents();
      });
    }

    // Public API
    consent(granted) {
      this.grantConsent(granted);
    }

    identify(userId, traits = {}) {
      this.userId = userId;
      this.setFirstPartyCookie(`${this.cookiePrefix}user_id`, userId, 365);
      
      this.trackEvent('identify', {
        userId,
        traits
      });
    }

    track(eventName, properties = {}) {
      this.trackEvent('custom', {
        eventName,
        properties
      });
    }

    destroy() {
      console.log('First-Party Analytics: Destroying tracker');
      this.isTracking = false;
      this.consentGiven = false;
      this.flushEvents();
    }
  }

  // Global API
  window.FirstPartyAnalytics = new FirstPartyTracker();

  // Kompatibilitet med befintlig API
  window.Analytics = {
    track: function(eventName, properties) {
      if (window.FirstPartyAnalytics) {
        window.FirstPartyAnalytics.track(eventName, properties);
      }
    },
    
    identify: function(userId, traits) {
      if (window.FirstPartyAnalytics) {
        window.FirstPartyAnalytics.identify(userId, traits);
      }
    },

    consent: function(granted) {
      if (window.FirstPartyAnalytics) {
        window.FirstPartyAnalytics.consent(granted);
      }
    }
  };

  // Auto-initialize
  if (window.analyticsConfig) {
    window.FirstPartyAnalytics.init(window.analyticsConfig);
  }

})();