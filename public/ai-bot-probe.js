/**
 * AI Bot Detection Probe
 * Detects when AI bots execute JavaScript and sends signals back to analytics
 */

(function() {
  'use strict';

  // Get site tracking ID from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-site-id]');
  const siteId = scriptTag?.getAttribute('data-site-id');
  
  if (!siteId) {
    console.warn('AI Bot Probe: No site ID found');
    return;
  }

  const startTime = performance.now();

  // Bot detection signals
  const detectBotSignals = () => {
    const signals = {};
    
    // Check for webdriver
    signals.webdriver = navigator.webdriver === true;
    
    // Check for headless browser
    signals.headless = !window.chrome || 
      navigator.plugins.length === 0 ||
      /HeadlessChrome/.test(navigator.userAgent);
    
    // Check for automation signals
    signals.automationControlled = navigator.webdriver || 
      window.document.documentElement.getAttribute('webdriver') === 'true';
    
    // Check for missing properties common in real browsers
    signals.missingChromeProperties = !window.chrome?.runtime;
    signals.missingWindowProperties = !window.opener && !window.parent;
    
    // Check permissions API
    signals.permissionsBlocked = !navigator.permissions;
    
    // Touch support
    signals.touchSupport = 'ontouchstart' in window;
    
    return signals;
  };

  // Browser fingerprint signals
  const getBrowserSignals = () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  };

  // Send probe data
  const sendProbeData = () => {
    const executionTime = Math.round(performance.now() - startTime);
    const signals = detectBotSignals();
    const browserSignals = getBrowserSignals();

    // Check if likely a bot
    const botScore = Object.values(signals).filter(v => v === true).length;
    const isLikelyBot = botScore >= 2 || /bot|crawler|spider/i.test(navigator.userAgent);

    const data = {
      siteId,
      url: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      sessionId: getOrCreateSessionId(),
      probeData: {
        jsExecuted: true,
        executionTime,
        signals,
        browserSignals,
        botScore,
        isLikelyBot,
      }
    };

    // Only send if likely a bot to avoid noise
    if (isLikelyBot) {
      console.log('AI Bot Probe: Bot detected, sending data', { botScore, signals });
      
      const endpoint = `${getSupabaseUrl()}/functions/v1/ai-bot-tracker`;
      
      navigator.sendBeacon(endpoint, JSON.stringify(data));
    }
  };

  // Session ID management
  const getOrCreateSessionId = () => {
    const key = 'ai_bot_session';
    let sessionId = sessionStorage.getItem(key);
    
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem(key, sessionId);
    }
    
    return sessionId;
  };

  // Get Supabase URL from environment
  const getSupabaseUrl = () => {
    // This should be replaced with your actual Supabase URL
    // Or passed via data attribute: data-supabase-url
    return scriptTag?.getAttribute('data-supabase-url') || 'https://cxmkdtgfocgbfizawlwa.supabase.co';
  };

  // Execute probe after page load
  if (document.readyState === 'complete') {
    sendProbeData();
  } else {
    window.addEventListener('load', sendProbeData);
  }

  // Also track citation clicks (UTM parameters)
  const trackCitationClick = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    
    // Check if this is an AI-related citation click
    const aiSources = ['chatgpt', 'perplexity', 'claude', 'gemini', 'ai'];
    const isAICitation = aiSources.some(source => 
      utmSource?.toLowerCase().includes(source) || 
      document.referrer.toLowerCase().includes(source)
    );

    if (isAICitation) {
      const citationData = {
        siteId,
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        sessionId: getOrCreateSessionId(),
        citationData: {
          url: window.location.href,
          utmSource,
          utmMedium,
          utmCampaign: urlParams.get('utm_campaign'),
        }
      };

      const endpoint = `${getSupabaseUrl()}/functions/v1/ai-bot-tracker`;
      navigator.sendBeacon(endpoint, JSON.stringify(citationData));
    }
  };

  // Track citation clicks
  trackCitationClick();

})();