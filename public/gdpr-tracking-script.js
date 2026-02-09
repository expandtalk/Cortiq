/**
 * GDPR-Compatible Heatmap & Analytics Tracking Script
 * 
 * This script respects user privacy and GDPR compliance by:
 * - Only tracking after consent is given
 * - Anonymizing IP addresses
 * - Allowing users to opt-out
 * - Providing data export/deletion capabilities
 */

(function() {
  'use strict';
  
  // Configuration - replace with your actual values
  const CONFIG = {
    siteId: window.heatmapTracking?.siteId || 'your-site-id',
    endpoint: window.heatmapTracking?.endpoint || '/wp-admin/admin-ajax.php',
    nonce: window.heatmapTracking?.nonce || '',
    consentCheckInterval: 1000, // Check for consent every 1 second
    maxConsentChecks: 30, // Stop checking after 30 seconds
    geoApiEndpoint: 'https://ipapi.co/json/' // For geo location detection
  };

  // GDPR-compliant grid configuration
  const GDPR_GRID_CONFIG = {
    desktop: { 
      maxGridSize: 25, // 25x25 grid = ~77px per cell (1920px/25)
      minCellSize: 50   // Minimum 50px per cell for anonymity
    },
    mobile: { 
      maxGridSize: 10,  // 10x10 grid = ~37.5px per cell (375px/10)  
      minCellSize: 35   // Minimum 35px per cell for touch anonymity
    },
    tablet: {
      maxGridSize: 20,  // 20x20 grid = ~40px per cell (800px/20)
      minCellSize: 40   // Minimum 40px per cell
    }
  };

  // State management
  let isTrackingEnabled = false;
  let hasConsent = false;
  let consentChecks = 0;
  let sessionId = null;
  let pageViewId = null;
  let eventQueue = [];
  let geoData = null;

  // Initialize session ID
  function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function generatePageViewId() {
    return 'pv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Check for cookie consent
  function checkConsent() {
    try {
      // Check localStorage for consent (new GDPR cookie name)
      let consentData = localStorage.getItem(`gdpr_consent_${CONFIG.siteId}`);
      if (consentData) {
        const consent = JSON.parse(consentData);
        return consent.analytics === true;
      }
      
      // Fallback för gamla cookie-namnet
      consentData = localStorage.getItem(`cookie_consent_${CONFIG.siteId}`);
      if (consentData) {
        const consent = JSON.parse(consentData);
        return consent.analytics === true;
      }

      // Check for global consent variables (compatibility with other cookie banners)
      if (window.cookieConsent && window.cookieConsent.analytics) {
        return true;
      }

      // Check for common cookie consent patterns
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'analytics_consent' && value === 'true') {
          return true;
        }
        if (name === 'cookie_consent' && value.includes('analytics')) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn('GDPR Tracking: Error checking consent:', error);
      return false;
    }
  }

  // Wait for consent before initializing tracking
  function waitForConsent() {
    if (checkConsent()) {
      hasConsent = true;
      initializeTracking();
      return;
    }

    consentChecks++;
    if (consentChecks < CONFIG.maxConsentChecks) {
      setTimeout(waitForConsent, CONFIG.consentCheckInterval);
    } else {
      console.info('GDPR Tracking: No consent received, tracking disabled');
    }
  }

  // Fetch geo data
  async function fetchGeoData() {
    try {
      const response = await fetch(CONFIG.geoApiEndpoint, {
        method: 'GET',
        timeout: 5000
      });
      if (response.ok) {
        const data = await response.json();
        geoData = {
          country: data.country_code || null,
          city: data.city || null,
          region: data.region || null
        };
        console.info('GDPR Tracking: Geo data loaded:', geoData.country);
      }
    } catch (error) {
      console.warn('GDPR Tracking: Could not load geo data:', error);
    }
  }

  // Update Google Consent Mode v2
  function updateGoogleConsentMode(consentTypes) {
    if (typeof window !== 'undefined' && window.gtag && window.gtag.consent) {
      window.gtag('consent', 'update', {
        analytics_storage: consentTypes.analytics ? 'granted' : 'denied',
        ad_storage: consentTypes.marketing ? 'granted' : 'denied',
        functionality_storage: consentTypes.preferences ? 'granted' : 'denied',
        personalization_storage: consentTypes.preferences ? 'granted' : 'denied',
        security_storage: 'granted'
      });
    }
  }

  // Initialize tracking after consent is confirmed
  function initializeTracking() {
    if (isTrackingEnabled) return;
    
    console.info('GDPR Tracking: Consent received, initializing tracking');
    isTrackingEnabled = true;
    sessionId = generateSessionId();
    pageViewId = generatePageViewId();

    // Load geo data asynchronously
    fetchGeoData();

    // Update Google Consent Mode if available
    try {
      let consentData = localStorage.getItem(`gdpr_consent_${CONFIG.siteId}`);
      if (!consentData) {
        // Fallback till gamla namnet
        consentData = localStorage.getItem(`cookie_consent_${CONFIG.siteId}`);
      }
      if (consentData) {
        const consent = JSON.parse(consentData);
        updateGoogleConsentMode(consent);
      }
    } catch (error) {
      console.warn('GDPR Tracking: Could not update Google Consent Mode:', error);
    }

    // Process any queued events
    processEventQueue();

    // Set up event listeners
    setupEventListeners();

    // Track initial page view
    trackPageView();
  }

  // Process events that were queued before consent
  function processEventQueue() {
    while (eventQueue.length > 0) {
      const event = eventQueue.shift();
      sendEvent(event);
    }
  }

  // Anonymize IP address (done server-side, but this is a backup)
  function anonymizeIP(ip) {
    if (!ip) return null;
    
    // IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return parts.slice(0, 3).join('.') + '.0';
      }
    }
    
    // IPv6 - mask last 80 bits
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return parts.slice(0, 4).join(':') + '::0';
      }
    }
    
    return ip;
  }

  // Send event to server
  function sendEvent(eventData) {
    if (!isTrackingEnabled) {
      // Queue event for later if no consent yet
      if (!hasConsent && eventQueue.length < 100) { // Limit queue size
        eventQueue.push(eventData);
      }
      return;
    }

    // Add GDPR compliance metadata
    const gdprCompliantData = {
      ...eventData,
      site_id: CONFIG.siteId,
      session_id: sessionId,
      page_view_id: pageViewId,
      timestamp: Date.now(),
      consent_given: true,
      privacy_mode: true, // Flag indicating GDPR compliance
      geo_country: geoData?.country || null,
      source: 'gdpr_tracking_script'
    };

    // Send via fetch with error handling
    if (typeof fetch !== 'undefined') {
      fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'heatmap_tracking',
          data: gdprCompliantData,
          nonce: CONFIG.nonce
        })
      }).catch(error => {
        console.warn('GDPR Tracking: Failed to send event:', error);
      });
    } else {
      // Fallback for older browsers
      const xhr = new XMLHttpRequest();
      xhr.open('POST', CONFIG.endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send(
        'action=heatmap_tracking' +
        '&data=' + encodeURIComponent(JSON.stringify(gdprCompliantData)) +
        '&nonce=' + encodeURIComponent(CONFIG.nonce)
      );
    }
  }

  // Track page view
  function trackPageView() {
    sendEvent({
      type: 'page_view',
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      screen_width: screen.width,
      screen_height: screen.height,
      user_agent: navigator.userAgent
    });
  }

  // Get device type for GDPR grid sizing
  function getDeviceType() {
    const width = window.innerWidth;
    if (width < 600) return 'mobile';
    if (width < 900) return 'tablet';
    return 'desktop';
  }

  // Calculate GDPR-compliant grid coordinates
  function calculateGDPRGrid(x, y) {
    const deviceType = getDeviceType();
    const config = GDPR_GRID_CONFIG[deviceType];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate optimal grid size based on viewport and GDPR requirements
    const gridSizeX = Math.min(config.maxGridSize, Math.floor(viewportWidth / config.minCellSize));
    const gridSizeY = Math.min(config.maxGridSize, Math.floor(viewportHeight / config.minCellSize));
    
    // Convert coordinates to grid positions (GDPR-compliant anonymization)
    const gridX = Math.floor((x / viewportWidth) * gridSizeX);
    const gridY = Math.floor((y / viewportHeight) * gridSizeY);
    
    return {
      grid_x: Math.max(0, Math.min(gridX, gridSizeX - 1)),
      grid_y: Math.max(0, Math.min(gridY, gridSizeY - 1)),
      viewport_width: viewportWidth,
      viewport_height: viewportHeight,
      device_type: deviceType
    };
  }

  // Track click events with GDPR-compliant grid positioning
  function trackClick(event) {
    const element = event.target;
    const gridData = calculateGDPRGrid(event.clientX, event.clientY);
    
    sendEvent({
      type: 'click',
      // Use grid coordinates instead of exact positions for GDPR compliance
      grid_x: gridData.grid_x,
      grid_y: gridData.grid_y,
      viewport_width: gridData.viewport_width,
      viewport_height: gridData.viewport_height,
      device_type: gridData.device_type,
      element_tag: element.tagName.toLowerCase(),
      element_id: element.id || null,
      element_class: element.className || null,
      element_text: element.textContent?.substring(0, 100) || null,
      url: window.location.href,
      // Touch-specific data for mobile devices
      is_touch_device: 'ontouchstart' in window,
      touch_force: event.force || null,
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
               navigator.userAgent.includes('Firefox') ? 'Firefox' :
               navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'
    });
  }

  // Track form interactions (GDPR-safe)
  function trackFormInteraction(event) {
    const element = event.target;
    if (element.tagName.toLowerCase() === 'input' || 
        element.tagName.toLowerCase() === 'textarea' || 
        element.tagName.toLowerCase() === 'select') {
      
      // Only track interaction, not actual values for privacy
      sendEvent({
        type: 'form_interaction',
        form_id: element.form?.id || 'unknown',
        field_name: element.name || 'unknown',
        field_type: element.type || element.tagName.toLowerCase(),
        interaction_type: event.type,
        url: window.location.href
      });
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    // Click tracking
    document.addEventListener('click', trackClick, true);

    // Form interaction tracking (privacy-safe)
    document.addEventListener('focus', trackFormInteraction, true);
    document.addEventListener('blur', trackFormInteraction, true);
    document.addEventListener('change', trackFormInteraction, true);

    // Page unload tracking
    window.addEventListener('beforeunload', function() {
      if (isTrackingEnabled) {
        sendEvent({
          type: 'page_unload',
          url: window.location.href,
          time_on_page: Date.now() - performance.timing.navigationStart
        });
      }
    });
  }

  // Public API for GDPR compliance
  window.GDPRTracking = {
    // Check if tracking is enabled
    isEnabled: function() {
      return isTrackingEnabled;
    },

    // Enable tracking (call after consent is given)
    enable: function() {
      hasConsent = true;
      initializeTracking();
    },

    // Disable tracking (opt-out)
    disable: function() {
      isTrackingEnabled = false;
      hasConsent = false;
      // Clear any stored consent (both old and new names)
      localStorage.removeItem(`gdpr_consent_${CONFIG.siteId}`);
      localStorage.removeItem(`cookie_consent_${CONFIG.siteId}`);
      console.info('GDPR Tracking: Tracking disabled by user');
    },

    // Get current session ID
    getSessionId: function() {
      return sessionId;
    },

    // Request data export (redirect to privacy page)
    requestDataExport: function(email) {
      if (typeof email === 'string' && email.includes('@')) {
        // This would typically redirect to a privacy/GDPR page
        window.location.href = '/privacy?action=export&email=' + encodeURIComponent(email);
      }
    },

    // Request data deletion (redirect to privacy page)
    requestDataDeletion: function(email) {
      if (typeof email === 'string' && email.includes('@')) {
        // This would typically redirect to a privacy/GDPR page
        window.location.href = '/privacy?action=delete&email=' + encodeURIComponent(email);
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForConsent);
  } else {
    waitForConsent();
  }

  // Expose for debugging (only in development)
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
    window.gdprTrackingDebug = {
      config: CONFIG,
      hasConsent: function() { return hasConsent; },
      isEnabled: function() { return isTrackingEnabled; },
      eventQueue: eventQueue,
      checkConsent: checkConsent
    };
  }

})();