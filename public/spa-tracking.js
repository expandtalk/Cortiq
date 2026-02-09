/**
 * SPA Tracking Script for CortIQ
 * Cookieless tracking for single-page JavaScript applications
 * 
 * Usage:
 * <script>
 *   window.wfaConfig = {
 *     companyId: 'your-company-uuid',
 *     apiKey: 'your-api-key',
 *     apiUrl: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1',
 *     contentType: 'page', // or 'image', 'form', etc.
 *     platform: 'web'
 *   };
 * </script>
 * <script src="/spa-tracking.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  const config = window.wfaConfig || {};
  const API_URL = config.apiUrl || 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1';
  const COMPANY_ID = config.companyId;
  const API_KEY = config.apiKey;
  const CONTENT_TYPE = config.contentType || 'page';
  const PLATFORM = config.platform || 'web';

  if (!COMPANY_ID || !API_KEY) {
    console.error('CortIQ Tracking: Missing companyId or apiKey in window.wfaConfig');
    return;
  }

  // Generate browser fingerprint (cookieless session ID)
  function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
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

  const SESSION_ID = generateFingerprint();

  // Get device type
  function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Track event
  async function trackEvent(eventType, contentId, additionalMetadata = {}) {
    try {
      const metadata = {
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        device_type: getDeviceType(),
        url: window.location.href,
        ...additionalMetadata
      };

      const payload = {
        company_id: COMPANY_ID,
        content_type: CONTENT_TYPE,
        content_id: contentId || window.location.pathname,
        event_type: eventType,
        platform: PLATFORM,
        session_id: SESSION_ID,
        metadata: metadata,
        timestamp: Date.now()
      };

      const response = await fetch(`${API_URL}/track-event`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
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
  window.WFATracker = {
    track: trackEvent,
    trackView: trackPageView,
    trackClick: (contentId, metadata) => trackEvent('click', contentId, metadata),
    trackConversion: (contentId, metadata) => trackEvent('conversion', contentId, metadata),
    getSessionId: () => SESSION_ID
  };

  // Initialize
  console.log('CortIQ Tracking initialized for company:', COMPANY_ID);
  console.log('Session ID:', SESSION_ID);

  // Track initial page view
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }

  // Setup automatic tracking
  setupClickTracking();
  setupConversionTracking();

})();
