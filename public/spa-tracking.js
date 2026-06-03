/**
 * CortIQ Advanced Tracking Script
 * Unified visitor profiling with AI agent detection
 *
 * Usage:
 * <script>
 *   window.cortiqConfig = {
 *     siteId: 'your-site-uuid',
 *     apiUrl: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1'
 *   };
 * </script>
 * <script src="/spa-tracking.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  const config = window.cortiqConfig || window.wfaConfig || {};
  const API_URL = config.apiUrl || 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1';
  const SITE_ID = config.siteId || config.companyId;
  const API_KEY = config.apiKey;
  const CONTENT_TYPE = config.contentType || 'page';
  const PLATFORM = config.platform || 'web';

  if (!SITE_ID) {
    console.error('CortIQ Tracking: Missing siteId in window.cortiqConfig');
    return;
  }

  // Global state
  let VISITOR_ID = null;
  let VISITOR_PROFILE = null;
  let IDENTIFICATION_COMPLETE = false;

  // Generate enhanced browser fingerprint
  function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('CortIQ Fingerprint', 2, 15);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown',
      canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'fp_' + Math.abs(hash).toString(36);
  }

  // Get canvas fingerprint
  function getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('CortIQ', 2, 15);
      return canvas.toDataURL();
    } catch (e) {
      return null;
    }
  }

  // Get WebGL fingerprint
  function getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return null;

      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      };
    } catch (e) {
      return null;
    }
  }

  // Extract UTM parameters from URL
  function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utmSource: urlParams.get('utm_source'),
      utmMedium: urlParams.get('utm_medium'),
      utmCampaign: urlParams.get('utm_campaign')
    };
  }

  const SESSION_ID = generateFingerprint();

  // Get device type
  function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Identify visitor (called once on page load)
  async function identifyVisitor() {
    try {
      const utm = getUTMParams();
      const webgl = getWebGLFingerprint();

      const payload = {
        siteId: SITE_ID,
        sessionId: SESSION_ID,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timezone: new Date().getTimezoneOffset(),
        language: navigator.language,
        platform: navigator.platform,
        referrer: document.referrer,
        currentUrl: window.location.href,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        // Canvas/WebGL fingerprinting requires explicit consent under GDPR
        canvasFingerprint: config.fingerprintConsent === true ? getCanvasFingerprint() : null,
        webglFingerprint: config.fingerprintConsent === true && webgl ? JSON.stringify(webgl) : null
      };

      const response = await fetch(`${API_URL}/visitor-identification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          VISITOR_ID = result.visitor.visitorId;
          VISITOR_PROFILE = result.visitor;
          IDENTIFICATION_COMPLETE = true;

          console.log('CortIQ Visitor identified:', {
            id: VISITOR_ID,
            type: result.visitor.visitorType,
            isNew: result.visitor.isNewVisitor,
            segments: result.visitor.segments
          });

          // Fire custom event for other scripts to listen to
          window.dispatchEvent(new CustomEvent('cortiq:visitor-identified', {
            detail: result.visitor
          }));

          return result.visitor;
        }
      } else {
        console.warn('CortIQ Visitor identification failed:', await response.text());
      }
    } catch (error) {
      console.error('CortIQ Visitor identification error:', error);
    }

    IDENTIFICATION_COMPLETE = true;
    return null;
  }

  // Wait for visitor identification before tracking
  async function waitForIdentification() {
    if (IDENTIFICATION_COMPLETE) return;

    // Wait max 3 seconds for identification
    const timeout = 3000;
    const start = Date.now();

    while (!IDENTIFICATION_COMPLETE && (Date.now() - start) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Track event
  async function trackEvent(eventType, contentId, additionalMetadata = {}) {
    try {
      // Wait for visitor identification
      await waitForIdentification();

      const metadata = {
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        device_type: getDeviceType(),
        url: window.location.href,
        visitor_id: VISITOR_ID,
        visitor_type: VISITOR_PROFILE?.visitorType,
        ...additionalMetadata
      };

      const payload = {
        company_id: SITE_ID, // Support old config
        site_id: SITE_ID,
        content_type: CONTENT_TYPE,
        content_id: contentId || window.location.pathname,
        event_type: eventType,
        platform: PLATFORM,
        session_id: SESSION_ID,
        visitor_id: VISITOR_ID,
        metadata: metadata,
        timestamp: Date.now()
      };

      const response = await fetch(`${API_URL}/track-event`, {
        method: 'POST',
        headers: API_KEY ? {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('CortIQ Tracking error:', error);
      } else {
        const result = await response.json();
        console.log('CortIQ Event tracked:', eventType, result.event_id);
      }
    } catch (error) {
      console.error('CortIQ Tracking failed:', error);
    }
  }

  // Track page view
  function trackPageView() {
    trackEvent('view', window.location.pathname);
  }

  // Track clicks on specific elements
  function setupClickTracking() {
    document.addEventListener('click', function(e) {
      const target = e.target.closest('[data-wfa-track]');
      if (target) {
        const contentId = target.getAttribute('data-wfa-content-id') || window.location.pathname;
        const eventType = target.getAttribute('data-wfa-event') || 'click';
        trackEvent(eventType, contentId, {
          element: target.tagName.toLowerCase(),
          text: target.textContent.substring(0, 100)
        });
      }
    });
  }

  // Track conversions
  function setupConversionTracking() {
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.hasAttribute('data-wfa-conversion')) {
        const contentId = form.getAttribute('data-wfa-content-id') || window.location.pathname;
        trackEvent('conversion', contentId, {
          form_id: form.id || 'unknown'
        });
      }
    });
  }

  // Check if visitor has given analytics consent
  function hasAnalyticsConsent() {
    try {
      const stored = localStorage.getItem('site_cookie_consent');
      if (stored && JSON.parse(stored).analytics === true) return true;
    } catch (_) {}
    try {
      if (window.Cookiebot?.consent?.statistics === true) return true;
    } catch (_) {}
    return false;
  }

  // Track scroll depth milestones (25%, 50%, 75%, 100%)
  function setupScrollTracking() {
    // Scroll depth is session-linked data — requires analytics consent (GDPR Art. 6.1.a)
    if (!hasAnalyticsConsent()) {
      window.addEventListener('siteConsentUpdated', function handler(e) {
        if (e.detail?.analytics) {
          window.removeEventListener('siteConsentUpdated', handler);
          setupScrollTracking();
        }
      });
      return;
    }

    const milestones = [25, 50, 75, 100];
    const reached = new Set();

    function getScrollDepth() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = Math.max(document.documentElement.scrollHeight, 1);
      return Math.round((scrolled / total) * 100);
    }

    function onScroll() {
      const depth = getScrollDepth();
      for (const m of milestones) {
        if (depth >= m && !reached.has(m)) {
          reached.add(m);
          const siteId = SITE_ID;
          const apiKey = API_KEY || SITE_ID;
          fetch(`${API_URL}/track-event`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company_id: siteId,
              site_id: siteId,
              session_id: SESSION_ID,
              event_type: 'heatmap',
              content_type: 'page',
              content_id: window.location.pathname,
              platform: PLATFORM,
              metadata: {
                url: window.location.href,
                device_type: getDeviceType(),
                interaction_type: 'scroll',
                scroll_depth: m,
                x_coordinate: 0,
                y_coordinate: m,
                grid_x: 0,
                grid_y: m,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
              },
              timestamp: Date.now(),
            }),
            keepalive: true,
          }).catch(() => {});
        }
      }
    }

    // Reset milestones on SPA navigation
    window.addEventListener('cortiq:pageview', () => reached.clear());

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { onScroll(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    // Check on load in case the page is already scrolled
    onScroll();
  }

  // Handle SPA navigation (for frameworks like React, Vue, etc.)
  let lastPath = window.location.pathname;
  function checkPathChange() {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      trackPageView();
    }
  }

  // Monitor for route changes (works with History API)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    checkPathChange();
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    checkPathChange();
  };

  window.addEventListener('popstate', checkPathChange);

  // Public API
  window.CortIQ = window.WFATracker = {
    track: trackEvent,
    trackView: trackPageView,
    trackClick: (contentId, metadata) => trackEvent('click', contentId, metadata),
    trackConversion: (contentId, metadata) => trackEvent('conversion', contentId, metadata),
    getSessionId: () => SESSION_ID,
    getVisitorId: () => VISITOR_ID,
    getVisitorProfile: () => VISITOR_PROFILE,
    identify: identifyVisitor
  };

  // Initialize
  async function initialize() {
    console.log('CortIQ Tracking initialized');
    console.log('Site ID:', SITE_ID);
    console.log('Session ID:', SESSION_ID);

    // Identify visitor first
    await identifyVisitor();

    // Track initial page view
    trackPageView();

    // Setup automatic tracking
    setupClickTracking();
    setupConversionTracking();
    setupScrollTracking();
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
