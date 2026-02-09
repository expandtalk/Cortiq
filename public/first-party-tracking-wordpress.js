/**
 * First-Party WordPress Tracking Script
 * Version: 1.0.0
 * För WordPress plugin integration
 */

(function() {
  'use strict';

  // WordPress-specifik first-party tracker
  class WordPressFirstPartyTracker {
    constructor() {
      this.config = null;
      this.proxyEndpoint = null;
      this.sessionId = null;
    }

    init(config) {
      this.config = config;
      
      // Använd WordPress AJAX URL som proxy
      this.proxyEndpoint = config.ajaxUrl + '?action=heatmap_proxy_tracking';
      
      console.log('WordPress First-Party Tracker initialiserad', {
        proxy: this.proxyEndpoint,
        siteId: config.siteId
      });

      this.sessionId = this.generateSessionId();
      this.startTracking();
    }

    generateSessionId() {
      return 'wp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async track(eventType, data) {
      if (!this.config || !this.config.consentGiven) {
        return;
      }

      const eventData = {
        event_type: eventType,
        site_id: this.config.siteId,
        session_id: this.sessionId,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ...data
      };

      try {
        // Skicka via WordPress AJAX (first-party request)
        const formData = new FormData();
        formData.append('action', 'heatmap_proxy_tracking');
        formData.append('data', JSON.stringify(eventData));
        formData.append('nonce', this.config.nonce);

        const response = await fetch(this.proxyEndpoint, {
          method: 'POST',
          body: formData,
          credentials: 'same-origin' // Viktigt för first-party cookies
        });

        if (!response.ok) {
          console.warn('First-party tracking failed:', response.status);
        }

      } catch (error) {
        console.warn('First-party tracking error:', error);
        
        // Fallback till tredjepartsläge om möjligt
        if (this.config.fallbackEnabled && window.heatmapAnalyticsTracker) {
          window.heatmapAnalyticsTracker.track(eventType, data);
        }
      }
    }

    startTracking() {
      // Spåra sidvisning
      this.track('page_view', {
        title: document.title,
        referrer: document.referrer
      });

      // Spåra klick
      document.addEventListener('click', (e) => {
        this.track('click', {
          x: e.clientX,
          y: e.clientY,
          element: e.target.tagName,
          element_id: e.target.id || null,
          element_class: e.target.className || null,
          element_text: e.target.textContent?.slice(0, 100) || null
        });
      });

      // Spåra scroll (throttled)
      let scrollTimeout;
      document.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.track('scroll', {
            scroll_y: window.scrollY,
            scroll_percentage: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
          });
        }, 250);
      });

      // Spåra formulär
      if (this.config.formTrackingEnabled) {
        this.initFormTracking();
      }
    }

    initFormTracking() {
      // Spåra formulärinteraktioner
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('focusin', (e) => {
          if (e.target.matches('input, textarea, select')) {
            this.track('form_start', {
              form_id: form.id || null,
              form_name: form.name || null,
              field_name: e.target.name || null,
              field_type: e.target.type || null
            });
          }
        });

        form.addEventListener('submit', (e) => {
          this.track('form_submit', {
            form_id: form.id || null,
            form_name: form.name || null,
            form_action: form.action || null
          });
        });
      });
    }
  }

  // Initialize när WordPress config är tillgänglig
  function initWordPressFirstParty() {
    if (window.heatmapAnalyticsConfig && window.heatmapAnalyticsConfig.firstPartyEnabled) {
      const tracker = new WordPressFirstPartyTracker();
      tracker.init(window.heatmapAnalyticsConfig);
      window.wpFirstPartyTracker = tracker;
    }
  }

  // Vänta på config
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWordPressFirstParty);
  } else {
    initWordPressFirstParty();
  }

})();