/**
 * Heatmap Analytics Tracking Script - Supabase Compatible
 * Auto-configured for xn--itskerhet-x2a.com
 */

(function() {
    'use strict';
    
    const HeatmapTracker = {
        // Configuration
        config: {},
        isTracking: false,
        sessionId: '',
        
        // Event batching
        eventQueue: [],
        batchTimer: null,
        lastBatchTime: 0,
        
        // Initialize tracking
        init: function(userConfig) {
            try {
                // Auto-detect tracking ID for xn--itskerhet-x2a.com
                let trackingId = 'tk_bcc978200a6664f02b444c26c01a42b0';
                
                // Try to get from script tag data attribute if provided
                const scripts = document.getElementsByTagName('script');
                for (let script of scripts) {
                    if (script.src && script.src.includes('tracking-script.js')) {
                        const scriptTrackingId = script.getAttribute('data-tracking-id');
                        if (scriptTrackingId) {
                            trackingId = scriptTrackingId;
                        }
                        break;
                    }
                }
                
                this.config = Object.assign({
                    trackingId: trackingId,
                    batchEvents: true,
                    batchSize: 10,
                    batchInterval: 5000,
                    maxRetries: 3,
                    debug: false,
                    apiEndpoint: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/pixel-tracking'
                }, userConfig || {});
                
                console.log('HeatmapTracker: Initializing with tracking ID:', this.config.trackingId);
                
                this.startTracking();
                
            } catch (error) {
                console.error('HeatmapTracker: Initialization failed', error);
            }
        },
        
        // Start tracking
        startTracking: function() {
            if (this.isTracking) return;
            
            try {
                this.isTracking = true;
                this.sessionId = this.generateSessionId();
                
                console.log('HeatmapTracker: Starting tracking with session:', this.sessionId);
                
                // Track session start
                this.trackEvent('session_start', {
                    sessionId: this.sessionId,
                    startTime: Date.now(),
                    deviceType: this.getDeviceType(),
                    screenWidth: screen.width,
                    screenHeight: screen.height,
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight,
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                });
                
                // Track page view
                this.trackEvent('page_view', {
                    title: document.title,
                    url: window.location.href,
                    referrer: document.referrer,
                    timestamp: Date.now()
                });
                
                // Setup event listeners
                this.setupEventListeners();
                
                // Start batch timer
                if (this.config.batchEvents) {
                    this.startBatchTimer();
                }
                
            } catch (error) {
                console.error('HeatmapTracker: Failed to start tracking', error);
            }
        },
        
        // Setup event listeners
        setupEventListeners: function() {
            // Click tracking
            document.addEventListener('click', (event) => {
                this.trackEvent('interaction', {
                    type: 'click',
                    x: event.clientX,
                    y: event.clientY,
                    timestamp: Date.now()
                });
            });
            
            // Mouse movement tracking (throttled)
            let lastMouseTime = 0;
            document.addEventListener('mousemove', (event) => {
                const now = Date.now();
                if (now - lastMouseTime > 500) { // Throttle to every 500ms
                    this.trackEvent('interaction', {
                        type: 'mousemove',
                        x: event.clientX,
                        y: event.clientY,
                        timestamp: now
                    });
                    lastMouseTime = now;
                }
            });
            
            // Session updates
            setInterval(() => {
                this.trackEvent('session_update', {
                    duration: Date.now() - this.sessionStartTime,
                    lastActivity: Date.now(),
                    timestamp: Date.now()
                });
            }, 15000); // Every 15 seconds
            
            // Before unload - flush events
            window.addEventListener('beforeunload', () => {
                this.flushEvents(true);
            });
        },
        
        // Generic event tracking
        trackEvent: function(eventType, data) {
            if (!this.isTracking) return;
            
            const event = {
                event_type: eventType,
                data: data,
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
                tracking_id: this.config.trackingId,
                user_id: null,
                url: window.location.href,
                referrer: document.referrer,
                deviceType: this.getDeviceType(),
                screenWidth: screen.width,
                screenHeight: screen.height,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                userAgent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            if (this.config.batchEvents) {
                this.eventQueue.push(event);
                
                // Check if we should flush
                if (this.eventQueue.length >= this.config.batchSize) {
                    this.flushEvents();
                }
            } else {
                this.sendEvent(event);
            }
        },
        
        // Get device type
        getDeviceType: function() {
            const width = window.innerWidth;
            if (width <= 768) return 'mobile';
            if (width <= 1024) return 'tablet';
            return 'desktop';
        },
        
        // Batch event sending
        startBatchTimer: function() {
            this.batchTimer = setInterval(() => {
                if (this.eventQueue.length > 0) {
                    this.flushEvents();
                }
            }, this.config.batchInterval);
        },
        
        // Flush event queue
        flushEvents: function(useBeacon = false) {
            if (this.eventQueue.length === 0) return;
            
            const events = [...this.eventQueue];
            this.eventQueue = [];
            
            console.log('HeatmapTracker: Flushing', events.length, 'events');
            
            // Format for Supabase edge function
            const payload = {
                events: events,
                batch: true
            };
            
            const payloadStr = JSON.stringify(payload);
            
            if (useBeacon && navigator.sendBeacon) {
                navigator.sendBeacon(this.config.apiEndpoint, payloadStr);
            } else {
                this.sendBatchedEvents(payload);
            }
            
            this.lastBatchTime = Date.now();
        },
        
        // Send batched events
        sendBatchedEvents: function(payload, retryCount = 0) {
            fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log('HeatmapTracker: Batch sent successfully');
            }).catch(error => {
                console.error('HeatmapTracker: Failed to send batch', error);
                if (retryCount < this.config.maxRetries) {
                    setTimeout(() => {
                        this.sendBatchedEvents(payload, retryCount + 1);
                    }, 1000 * Math.pow(2, retryCount));
                }
            });
        },
        
        // Utility functions
        generateSessionId: function() {
            return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            HeatmapTracker.init();
        });
    } else {
        HeatmapTracker.init();
    }
    
    // Store session start time
    HeatmapTracker.sessionStartTime = Date.now();
    
    // Public API
    window.HeatmapAnalyticsTracker = HeatmapTracker;
    
})();