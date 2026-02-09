/**
 * Unified AI Tracking Script
 * Combines AI search traffic detection and AI bot/crawler tracking
 * 100% Cookiefree & GDPR-compliant
 */

(function() {
  'use strict';

  // Configuration
  const scriptTag = document.currentScript || document.querySelector('script[data-site-id]');
  const siteId = scriptTag?.getAttribute('data-site-id') || window.HEATMAP_SITE_ID;
  const supabaseUrl = scriptTag?.getAttribute('data-supabase-url') || window.HEATMAP_SUPABASE_URL || 'https://cxmkdtgfocgbfizawlwa.supabase.co';
  
  if (!siteId) {
    console.warn('AI Tracking: Missing site ID');
    return;
  }

  const startTime = performance.now();

  // ========== AI PLATFORM DETECTION ==========
  const AI_PLATFORMS = {
    'chat.openai.com': 'chatgpt',
    'chatgpt.com': 'chatgpt',
    'perplexity.ai': 'perplexity',
    'www.perplexity.ai': 'perplexity',
    'claude.ai': 'claude',
    'anthropic.com': 'claude',
    'gemini.google.com': 'gemini',
    'bard.google.com': 'gemini',
    'copilot.microsoft.com': 'copilot',
    'bing.com/chat': 'copilot',
    'you.com': 'you',
    'phind.com': 'phind'
  };

  const AI_USER_AGENTS = {
    'ChatGPT': 'chatgpt',
    'GPTBot': 'chatgpt',
    'Claude': 'claude',
    'ClaudeBot': 'claude',
    'Perplexity': 'perplexity',
    'PerplexityBot': 'perplexity',
    'Gemini': 'gemini',
    'Googlebot': 'gemini',
    'GoogleOther': 'gemini'
  };

  function detectAIPlatform() {
    const referrer = document.referrer;
    const userAgent = navigator.userAgent;
    
    // Check referrer
    if (referrer) {
      try {
        const url = new URL(referrer);
        const hostname = url.hostname.toLowerCase();
        
        for (const [domain, platform] of Object.entries(AI_PLATFORMS)) {
          if (hostname.includes(domain)) {
            return platform;
          }
        }
      } catch (e) {
        // Invalid URL
      }
    }
    
    // Check user agent
    for (const [agent, platform] of Object.entries(AI_USER_AGENTS)) {
      if (userAgent.includes(agent)) {
        return platform;
      }
    }
    
    // Check UTM parameters
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    
    if (utmSource && (utmSource.includes('chatgpt') || utmSource.includes('ai') || utmMedium === 'ai-search')) {
      return 'other';
    }
    
    return null;
  }

  // ========== UTM PARAMETER EXTRACTION ==========
  function extractUTMParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content')
    };
  }

  // ========== FINGERPRINTING ==========
  function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const canvasData = canvas.toDataURL();
    
    const fingerprint = {
      screen: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas: canvasData.slice(-50),
      plugins: Array.from(navigator.plugins || []).map(p => p.name).join(',')
    };
    
    const str = JSON.stringify(fingerprint);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'fp_' + Math.abs(hash).toString(36);
  }

  // ========== DEVICE/BROWSER DETECTION ==========
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    return 'Other';
  }

  function getOS() {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Other';
  }

  // ========== BOT DETECTION ==========
  function detectBotSignals() {
    const signals = {};
    
    signals.webdriver = navigator.webdriver === true;
    signals.headless = !window.chrome || 
      navigator.plugins.length === 0 ||
      /HeadlessChrome/.test(navigator.userAgent);
    signals.automationControlled = navigator.webdriver || 
      window.document.documentElement.getAttribute('webdriver') === 'true';
    signals.missingChromeProperties = !window.chrome?.runtime;
    signals.missingWindowProperties = !window.opener && !window.parent;
    signals.permissionsBlocked = !navigator.permissions;
    signals.touchSupport = 'ontouchstart' in window;
    
    return signals;
  }

  function getBrowserSignals() {
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
  }

  // ========== SESSION MANAGEMENT ==========
  function getOrCreateSessionId() {
    const sessionKey = 'ai_tracking_session_' + siteId;
    let sessionId = sessionStorage.getItem(sessionKey);
    
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(sessionKey, sessionId);
    }
    
    return sessionId;
  }

  // ========== AI SEARCH TRAFFIC TRACKING ==========
  function trackAISearchTraffic() {
    const aiPlatform = detectAIPlatform();
    
    // Only track if from AI platform
    if (!aiPlatform) {
      return false;
    }

    const utmParams = extractUTMParameters();
    
    const trackingData = {
      siteId,
      sessionId: getOrCreateSessionId(),
      userHash: generateFingerprint(),
      aiPlatform,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      url: window.location.href,
      pageTitle: document.title,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      operatingSystem: getOS(),
      landedAt: new Date().toISOString(),
      ...utmParams
    };

    const endpoint = `${supabaseUrl}/functions/v1/ai-search-tracker`;
    
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
      keepalive: true
    }).catch(() => {});

    // Track engagement
    let pageViewStart = Date.now();
    let pagesViewed = 1;
    
    const updateSession = () => {
      const duration = Math.round((Date.now() - pageViewStart) / 1000);
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          sessionId: trackingData.sessionId,
          update: {
            sessionDuration: duration,
            pagesViewed,
            engaged: duration > 10 || pagesViewed > 1,
            bounce: duration < 10 && pagesViewed === 1
          }
        }),
        keepalive: true
      }).catch(() => {});
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) updateSession();
    });
    
    window.addEventListener('beforeunload', updateSession);

    return true;
  }

  // ========== AI BOT/CRAWLER TRACKING ==========
  function trackAIBot() {
    const executionTime = Math.round(performance.now() - startTime);
    const signals = detectBotSignals();
    const browserSignals = getBrowserSignals();

    // Check if likely a bot
    const botScore = Object.values(signals).filter(v => v === true).length;
    const isLikelyBot = botScore >= 2 || /bot|crawler|spider|GPTBot|ClaudeBot|PerplexityBot|GoogleOther/i.test(navigator.userAgent);

    if (!isLikelyBot) {
      return false;
    }

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

    const endpoint = `${supabaseUrl}/functions/v1/ai-bot-tracker`;
    navigator.sendBeacon(endpoint, JSON.stringify(data));

    return true;
  }

  // ========== CITATION TRACKING ==========
  function trackCitationClick() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    
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

      const endpoint = `${supabaseUrl}/functions/v1/ai-bot-tracker`;
      navigator.sendBeacon(endpoint, JSON.stringify(citationData));
    }
  }

  // ========== INITIALIZE ==========
  function init() {
    // Try AI search traffic tracking first
    const isAISearch = trackAISearchTraffic();
    
    // If not AI search, check for bot
    if (!isAISearch) {
      trackAIBot();
    }
    
    // Always check for citations
    trackCitationClick();
  }

  // Run after page load
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

})();
