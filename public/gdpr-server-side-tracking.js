/**
 * GDPR-compliant Server-Side Tracking Script
 * Blocks third-party integrations based on user consent
 * Uses new consent-check and gdpr-compliant-tracking edge functions
 */

(function() {
    'use strict';

    // Configuration - will be injected by server
    let CONFIG = window.heatmapAnalyticsConfig || {};
    
    // State management
    let isInitialized = false;
    let currentConsent = null;
    let sessionId = null;
    let eventQueue = [];
    let isProcessing = false;

    // Integration configurations
    const INTEGRATIONS = {
        'google_analytics': {
            required_consent: ['analytics'],
            enabled: () => CONFIG.ga_enabled || false,
            endpoint: 'gdpr-compliant-tracking'
        },
        'meta_pixel': {
            required_consent: ['marketing'],
            enabled: () => CONFIG.facebook_pixel_enabled || false,
            endpoint: 'gdpr-compliant-tracking'
        },
        'google_ads': {
            required_consent: ['marketing'],
            enabled: () => CONFIG.google_ads_enabled || false,
            endpoint: 'gdpr-compliant-tracking'
        },
        'linkedin_insight': {
            required_consent: ['marketing'],
            enabled: () => CONFIG.linkedin_insight_enabled || false,
            endpoint: 'gdpr-compliant-tracking'
        },
        'tiktok_pixel': {
            required_consent: ['marketing'],
            enabled: () => CONFIG.tiktok_pixel_enabled || false,
            endpoint: 'gdpr-compliant-tracking'
        }
    };

    /**
     * Generate unique session ID
     */
    function generateSessionId() {
        if (sessionId) return sessionId;
        
        // Try to get existing session from localStorage
        const stored = localStorage.getItem(`session_${CONFIG.site_id}`);
        if (stored) {
            const sessionData = JSON.parse(stored);
            if (sessionData.expires > Date.now()) {
                sessionId = sessionData.id;
                return sessionId;
            }
        }
        
        // Generate new session
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Store with 30 minute expiry
        localStorage.setItem(`session_${CONFIG.site_id}`, JSON.stringify({
            id: sessionId,
            expires: Date.now() + (30 * 60 * 1000)
        }));
        
        return sessionId;
    }

    /**
     * Get current user consent
     */
    function getCurrentConsent() {
        try {
            const stored = localStorage.getItem(`gdpr_consent_${CONFIG.site_id}`);
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Fallback to old format
            const oldStored = localStorage.getItem(`cookie_consent_${CONFIG.site_id}`);
            if (oldStored) {
                return JSON.parse(oldStored);
            }
            
            return null;
        } catch (error) {
            console.error('Error getting consent:', error);
            return null;
        }
    }

    /**
     * Check consent for specific integration
     */
    async function checkConsent(integration_type) {
        const integration = INTEGRATIONS[integration_type];
        if (!integration) {
            console.warn('Unknown integration type:', integration_type);
            return { allowed: false, reason: 'Unknown integration' };
        }

        try {
            const response = await fetch(`${CONFIG.supabase_url}/functions/v1/consent-check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.supabase_anon_key}`
                },
                body: JSON.stringify({
                    site_id: CONFIG.site_id,
                    session_id: generateSessionId(),
                    consent_types: integration.required_consent,
                    integration_type: integration_type,
                    ip_address: CONFIG.user_ip,
                    user_agent: navigator.userAgent
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Consent check result:', result);
            return result;
        } catch (error) {
            console.error('Consent check failed:', error);
            return { 
                allowed: false, 
                reason: 'Consent check failed: ' + error.message 
            };
        }
    }

    /**
     * Send tracking event with GDPR compliance
     */
    async function sendTrackingEvent(eventType, eventData, integrations = []) {
        if (!CONFIG.site_id || !sessionId) {
            console.error('Missing site_id or session_id');
            return;
        }

        // Always send to internal tracking (first-party)
        try {
            await fetch(`${CONFIG.supabase_url}/functions/v1/pixel-tracking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.supabase_anon_key}`
                },
                body: JSON.stringify({
                    type: eventType,
                    siteId: CONFIG.site_id,
                    sessionId: sessionId,
                    data: {
                        ...eventData,
                        timestamp: new Date().toISOString()
                    }
                })
            });
        } catch (error) {
            console.error('Internal tracking failed:', error);
        }

        // Check and send to third-party integrations
        for (const integration_type of integrations) {
            const integration = INTEGRATIONS[integration_type];
            
            if (!integration || !integration.enabled()) {
                console.log(`Integration ${integration_type} not enabled`);
                continue;
            }

            try {
                const consentResult = await checkConsent(integration_type);
                
                if (!consentResult.allowed) {
                    console.log(`Blocked ${integration_type}:`, consentResult.reason);
                    continue;
                }

                // Send to GDPR-compliant tracking
                await fetch(`${CONFIG.supabase_url}/functions/v1/${integration.endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CONFIG.supabase_anon_key}`
                    },
                    body: JSON.stringify({
                        site_id: CONFIG.site_id,
                        session_id: sessionId,
                        event_type: eventType,
                        event_data: eventData,
                        integration_type: integration_type,
                        third_party_data: {
                            client_id: sessionId,
                            page_url: window.location.href,
                            page_title: document.title,
                            user_agent: navigator.userAgent,
                            ip_address: CONFIG.user_ip
                        }
                    })
                });

                console.log(`Successfully sent to ${integration_type}`);
            } catch (error) {
                console.error(`Failed to send to ${integration_type}:`, error);
            }
        }
    }

    /**
     * Track page view
     */
    function trackPageView() {
        const eventData = {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            user_agent: navigator.userAgent,
            language: navigator.language,
            timestamp: Date.now()
        };

        // Determine which integrations to use
        const integrations = [];
        if (CONFIG.ga_enabled) integrations.push('google_analytics');
        if (CONFIG.facebook_pixel_enabled) integrations.push('meta_pixel');
        if (CONFIG.google_ads_enabled) integrations.push('google_ads');
        if (CONFIG.linkedin_insight_enabled) integrations.push('linkedin_insight');
        if (CONFIG.tiktok_pixel_enabled) integrations.push('tiktok_pixel');

        sendTrackingEvent('page_view', eventData, integrations);
    }

    /**
     * Track custom event
     */
    function trackEvent(eventName, parameters = {}, integrations = []) {
        const eventData = {
            event_name: eventName,
            custom_parameters: parameters,
            url: window.location.href,
            timestamp: Date.now()
        };

        sendTrackingEvent('custom_event', eventData, integrations);
    }

    /**
     * Track conversion
     */
    function trackConversion(conversionName, value = null, currency = 'SEK') {
        const eventData = {
            conversion_name: conversionName,
            conversion_value: value,
            currency: currency,
            url: window.location.href,
            timestamp: Date.now()
        };

        // Conversions typically go to marketing platforms
        const integrations = [];
        if (CONFIG.facebook_pixel_enabled) integrations.push('meta_pixel');
        if (CONFIG.google_ads_enabled) integrations.push('google_ads');
        if (CONFIG.linkedin_insight_enabled) integrations.push('linkedin_insight');

        sendTrackingEvent('conversion', eventData, integrations);
    }

    /**
     * Listen for consent changes
     */
    function listenForConsentChanges() {
        // Listen for consent updates
        window.addEventListener('consentUpdated', (event) => {
            console.log('Consent updated:', event.detail);
            currentConsent = event.detail;
            
            // Re-process queued events if consent was granted
            if (eventQueue.length > 0) {
                processEventQueue();
            }
        });

        // Check for consent on page load
        currentConsent = getCurrentConsent();
        console.log('Initial consent:', currentConsent);
    }

    /**
     * Process queued events
     */
    async function processEventQueue() {
        if (isProcessing || eventQueue.length === 0) return;
        
        isProcessing = true;
        
        while (eventQueue.length > 0) {
            const event = eventQueue.shift();
            try {
                await sendTrackingEvent(event.type, event.data, event.integrations);
            } catch (error) {
                console.error('Failed to process queued event:', error);
            }
        }
        
        isProcessing = false;
    }

    /**
     * Initialize tracking
     */
    function initialize() {
        if (isInitialized) return;
        
        console.log('Initializing GDPR-compliant server-side tracking');
        
        // Generate session ID
        generateSessionId();
        
        // Set up consent monitoring
        listenForConsentChanges();
        
        // Track initial page view
        trackPageView();
        
        // Set up automatic tracking
        setupAutoTracking();
        
        isInitialized = true;
        console.log('GDPR-compliant tracking initialized');
    }

    /**
     * Set up automatic tracking for common events
     */
    function setupAutoTracking() {
        // Track page unload
        window.addEventListener('beforeunload', () => {
            sendTrackingEvent('page_unload', {
                url: window.location.href,
                time_on_page: Date.now() - (window.performance?.timing?.navigationStart || Date.now()),
                timestamp: Date.now()
            });
        });

        // Track form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName === 'FORM') {
                trackEvent('form_submit', {
                    form_id: form.id || 'unknown',
                    form_action: form.action || window.location.href,
                    form_method: form.method || 'GET'
                });
            }
        });

        // Track outbound links
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.href && !link.href.startsWith(window.location.origin)) {
                trackEvent('outbound_click', {
                    link_url: link.href,
                    link_text: link.textContent?.trim() || '',
                    link_domain: new URL(link.href).hostname
                });
            }
        });
    }

    /**
     * Public API
     */
    window.GDPRTracking = {
        // Track events
        track: trackEvent,
        trackPageView: trackPageView,
        trackConversion: trackConversion,
        
        // Session management
        getSessionId: () => sessionId,
        refreshSession: () => {
            sessionId = null;
            generateSessionId();
        },
        
        // Consent management
        getCurrentConsent: getCurrentConsent,
        
        // Manual initialization
        initialize: initialize,
        
        // Status
        isInitialized: () => isInitialized,
        getConfig: () => CONFIG
    };

    // Auto-initialize when config is available
    function waitForConfig() {
        if (window.heatmapAnalyticsConfig) {
            CONFIG = window.heatmapAnalyticsConfig;
            initialize();
        } else {
            setTimeout(waitForConfig, 100);
        }
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForConfig);
    } else {
        waitForConfig();
    }

    // Debug info
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
        window.gdprTrackingDebug = {
            config: CONFIG,
            consent: currentConsent,
            sessionId: sessionId,
            eventQueue: eventQueue,
            integrations: INTEGRATIONS
        };
    }

})();