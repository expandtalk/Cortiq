/**
 * AI Search Traffic Tracking Script
 * Cookiefree detection of AI-driven search traffic
 */

(function() {
  'use strict';

  const AI_PLATFORMS = {
    // ChatGPT
    'chat.openai.com': 'chatgpt',
    'chatgpt.com': 'chatgpt',
    
    // Perplexity
    'perplexity.ai': 'perplexity',
    'www.perplexity.ai': 'perplexity',
    
    // Claude
    'claude.ai': 'claude',
    'anthropic.com': 'claude',
    
    // Google Gemini
    'gemini.google.com': 'gemini',
    'bard.google.com': 'gemini',
    
    // Microsoft Copilot
    'copilot.microsoft.com': 'copilot',
    'bing.com/chat': 'copilot',
    
    // You.com
    'you.com': 'you',
    
    // Phind
    'phind.com': 'phind'
  };

  const AI_USER_AGENTS = {
    'ChatGPT': 'chatgpt',
    'GPTBot': 'chatgpt',
    'Claude': 'claude',
    'Perplexity': 'perplexity',
    'Gemini': 'gemini'
  };

  function detectAIPlatform() {
    const referrer = document.referrer;
    const userAgent = navigator.userAgent;
    
    // Check referrer first
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
        console.warn('Invalid referrer URL:', e);
      }
    }
    
    // Check user agent
    for (const [agent, platform] of Object.entries(AI_USER_AGENTS)) {
      if (userAgent.includes(agent)) {
        return platform;
      }
    }
    
    // Check UTM parameters for AI attribution
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    
    if (utmSource && (utmSource.includes('chatgpt') || utmSource.includes('ai') || utmMedium === 'ai-search')) {
      return 'other';
    }
    
    return null;
  }

  function generateFingerprint() {
    // Cookiefree fingerprinting
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
    
    // Simple hash
    const str = JSON.stringify(fingerprint);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'fp_' + Math.abs(hash).toString(36);
  }

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

  function getOrCreateSessionId() {
    const sessionKey = 'ai_search_session_' + window.HEATMAP_SITE_ID;
    let sessionId = sessionStorage.getItem(sessionKey);
    
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(sessionKey, sessionId);
    }
    
    return sessionId;
  }

  function trackAISearchTraffic() {
    if (!window.HEATMAP_SITE_ID || !window.HEATMAP_SUPABASE_URL) {
      console.warn('AI Search Tracking: Missing configuration');
      return;
    }

    const aiPlatform = detectAIPlatform();
    
    // Only track if from AI platform
    if (!aiPlatform) {
      return;
    }

    const trackingData = {
      siteId: window.HEATMAP_SITE_ID,
      sessionId: getOrCreateSessionId(),
      userHash: generateFingerprint(),
      aiPlatform: aiPlatform,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      url: window.location.href,
      pageTitle: document.title,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      operatingSystem: getOS(),
      landedAt: new Date().toISOString()
    };

    // Send to edge function
    const endpoint = `${window.HEATMAP_SUPABASE_URL}/functions/v1/ai-search-tracker`;
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(trackingData),
      keepalive: true
    }).catch(err => {
      console.warn('AI Search Tracking failed:', err);
    });

    // Track engagement
    let pageViewStart = Date.now();
    let pagesViewed = 1;
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const duration = Math.round((Date.now() - pageViewStart) / 1000);
        updateSession(trackingData.sessionId, {
          sessionDuration: duration,
          pagesViewed: pagesViewed,
          engaged: duration > 10 || pagesViewed > 1,
          bounce: duration < 10 && pagesViewed === 1
        });
      }
    });

    // Track beforeunload
    window.addEventListener('beforeunload', () => {
      const duration = Math.round((Date.now() - pageViewStart) / 1000);
      updateSession(trackingData.sessionId, {
        sessionDuration: duration,
        pagesViewed: pagesViewed,
        engaged: duration > 10 || pagesViewed > 1,
        bounce: duration < 10 && pagesViewed === 1
      });
    });
  }

  function updateSession(sessionId, metrics) {
    const endpoint = `${window.HEATMAP_SUPABASE_URL}/functions/v1/ai-search-tracker`;
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        siteId: window.HEATMAP_SITE_ID,
        sessionId: sessionId,
        update: metrics
      }),
      keepalive: true
    }).catch(() => {});
  }

  // Initialize tracking on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackAISearchTraffic);
  } else {
    trackAISearchTraffic();
  }
})();
