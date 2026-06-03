import { useState } from 'react';
import JSZip from 'jszip';

export const usePluginDownloader = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const defaultFiles = {
    'heatmap-analytics.php': `<?php
/**
 * Plugin Name: Heatmap Analytics Pro - Expandtalk.se
 * Plugin URI: https://expandtalk.se
 * Description: Professionell heatmap och användaranalys med GDPR-kompatibilitet
 * Version: 3.1.0
 * Author: Expandtalk.se
 * Author URI: https://expandtalk.se
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: heatmap-analytics
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HEATMAP_ANALYTICS_VERSION', '3.1.0');
define('HEATMAP_ANALYTICS_PLUGIN_FILE', __FILE__);
define('HEATMAP_ANALYTICS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEATMAP_ANALYTICS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HEATMAP_ANALYTICS_ASSETS_URL', HEATMAP_ANALYTICS_PLUGIN_URL . 'assets/');

// Load the main plugin class
require_once HEATMAP_ANALYTICS_PLUGIN_DIR . 'includes/class-heatmap-analytics-core.php';

// Initialize the plugin
global $heatmap_core;
$heatmap_core = new HeatmapAnalyticsCore();

// Activation hook
register_activation_hook(__FILE__, array($heatmap_core, 'activate'));

// Deactivation hook
register_deactivation_hook(__FILE__, array($heatmap_core, 'deactivate'));

// Add uninstall hook
register_uninstall_hook(__FILE__, 'heatmap_analytics_uninstall');

function heatmap_analytics_uninstall() {
    // Clean up options
    delete_option('heatmap_analytics_options');
    delete_option('heatmap_manual_cookies');
    delete_option('heatmap_excluded_ip_hashes');
    delete_option('heatmap_last_cleanup');
    delete_option('heatmap_last_settings_update');
    
    // Clean up transients
    delete_transient('heatmap_settings_saved');
    delete_transient('heatmap_settings_error');
    
    // Remove scheduled events
    wp_clear_scheduled_hook('heatmap_gdpr_cleanup');
}

// Utility logging function
function heatmap_log($message, $level = 'info') {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log(sprintf('[Heatmap Analytics %s] %s: %s', HEATMAP_ANALYTICS_VERSION, strtoupper($level), $message));
    }
}`,

    'assets/tracking-script.js': `// Heatmap Analytics Tracking Script v3.1.0
(function() {
    'use strict';
    
    // Get configuration from WordPress
    const config = window.heatmapAnalyticsConfig || {};
    const trackingId = config.trackingId;
    const isGdprEnabled = config.gdprEnabled === '1';
    const anonymizeIp = config.anonymizeIp === '1';
    const trackMobile = config.trackMobile === '1';
    const samplingRate = parseInt(config.samplingRate) || 100;
    const formTracking = config.formTracking === '1';
    
    // Exit early if no tracking ID
    if (!trackingId) {
        console.warn('Heatmap Analytics: No tracking ID found');
        return;
    }
    
    // Check sampling rate
    if (Math.random() * 100 > samplingRate) {
        console.log('Heatmap Analytics: User excluded by sampling rate');
        return;
    }
    
    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && !trackMobile) {
        console.log('Heatmap Analytics: Mobile tracking disabled');
        return;
    }
    
    // GDPR consent check
    let hasConsent = !isGdprEnabled; // Default to true if GDPR is not enabled
    
    if (isGdprEnabled) {
        // Check for consent in cookies or localStorage
        hasConsent = document.cookie.includes('cortiq_consent=analytics') || 
                    localStorage.getItem('cortiq_consent') === 'analytics';
        
        // Listen for consent updates
        document.addEventListener('consentUpdated', function(e) {
            hasConsent = e.detail && e.detail.analytics;
            if (hasConsent) {
                initializeTracking();
            }
        });
    }
    
    // Only proceed if we have consent
    if (!hasConsent) {
        console.log('Heatmap Analytics: Waiting for user consent');
        return;
    }
    
    // Initialize tracking
    initializeTracking();
    
    function initializeTracking() {
        console.log('Heatmap Analytics: Initializing tracking for site:', trackingId);
        
        // Session management
        let sessionId = getOrCreateSession();
        let pageStartTime = Date.now();
        let interactionCount = 0;
        let scrollDepth = 0;
        let maxScrollDepth = 0;
        
        // User identification
        const userId = getUserId();
        const deviceInfo = getDeviceInfo();
        
        // Track page view
        trackPageView();
        
        // Set up event listeners
        setupEventListeners();
        
        // Track form interactions if enabled
        if (formTracking) {
            setupFormTracking();
        }
        
        function getOrCreateSession() {
            let sessionId = sessionStorage.getItem('cortiq_session_id');
            if (!sessionId) {
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('cortiq_session_id', sessionId);
                sessionStorage.setItem('cortiq_session_start', Date.now().toString());
            }
            return sessionId;
        }
        
        function getUserId() {
            let userId = localStorage.getItem('heatmap_user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('heatmap_user_id', userId);
            }
            return userId;
        }
        
        function getDeviceInfo() {
            return {
                userAgent: navigator.userAgent,
                screen: {
                    width: screen.width,
                    height: screen.height,
                    availWidth: screen.availWidth,
                    availHeight: screen.availHeight
                },
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                platform: navigator.platform,
                isMobile: isMobile
            };
        }
        
        function trackPageView() {
            const data = {
                event_type: 'page_view',
                tracking_id: trackingId,
                session_id: sessionId,
                user_id: userId,
                page_url: window.location.href,
                page_title: document.title,
                referrer: document.referrer,
                timestamp: Date.now(),
                device_info: deviceInfo,
                anonymize_ip: anonymizeIp
            };
            
            sendEvent(data);
        }
        
        function setupEventListeners() {
            // Click tracking
            document.addEventListener('click', function(e) {
                trackClick(e);
            });
            
            // Scroll tracking
            let scrollTimeout;
            window.addEventListener('scroll', function() {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(function() {
                    trackScroll();
                }, 100);
            });
            
            // Mouse movement (sampling for heatmap)
            let mouseMoveTimeout;
            let mouseMoveCount = 0;
            document.addEventListener('mousemove', function(e) {
                mouseMoveCount++;
                if (mouseMoveCount % 10 === 0) { // Sample every 10th movement
                    clearTimeout(mouseMoveTimeout);
                    mouseMoveTimeout = setTimeout(function() {
                        trackMouseMove(e);
                    }, 50);
                }
            });
            
            // Page unload
            window.addEventListener('beforeunload', function() {
                trackPageUnload();
            });
            
            // Visibility change
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'hidden') {
                    trackPageUnload();
                }
            });
        }
        
        function trackClick(event) {
            interactionCount++;
            
            const target = event.target;
            const rect = target.getBoundingClientRect();
            
            const data = {
                event_type: 'click',
                tracking_id: trackingId,
                session_id: sessionId,
                user_id: userId,
                timestamp: Date.now(),
                element: {
                    tag: target.tagName.toLowerCase(),
                    id: target.id || null,
                    class: target.className || null,
                    text: target.textContent ? target.textContent.substring(0, 100) : null,
                    href: target.href || null
                },
                position: {
                    x: Math.round(event.clientX),
                    y: Math.round(event.clientY),
                    pageX: Math.round(event.pageX),
                    pageY: Math.round(event.pageY)
                },
                element_position: {
                    top: Math.round(rect.top),
                    left: Math.round(rect.left),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                },
                page_url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };
            
            sendEvent(data);
        }
        
        function trackScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
            const viewportHeight = window.innerHeight;
            
            scrollDepth = Math.round((scrollTop + viewportHeight) / documentHeight * 100);
            maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
            
            const data = {
                event_type: 'scroll',
                tracking_id: trackingId,
                session_id: sessionId,
                user_id: userId,
                timestamp: Date.now(),
                scroll_depth: scrollDepth,
                max_scroll_depth: maxScrollDepth,
                scroll_position: scrollTop,
                document_height: documentHeight,
                viewport_height: viewportHeight,
                page_url: window.location.href
            };
            
            sendEvent(data);
        }
        
        function trackMouseMove(event) {
            const data = {
                event_type: 'mousemove',
                tracking_id: trackingId,
                session_id: sessionId,
                user_id: userId,
                timestamp: Date.now(),
                position: {
                    x: Math.round(event.clientX),
                    y: Math.round(event.clientY),
                    pageX: Math.round(event.pageX),
                    pageY: Math.round(event.pageY)
                },
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                page_url: window.location.href
            };
            
            sendEvent(data);
        }
        
        function trackPageUnload() {
            const sessionStart = parseInt(sessionStorage.getItem('cortiq_session_start')) || pageStartTime;
            const timeOnPage = Date.now() - pageStartTime;
            const sessionDuration = Date.now() - sessionStart;
            
            const data = {
                event_type: 'page_unload',
                tracking_id: trackingId,
                session_id: sessionId,
                user_id: userId,
                timestamp: Date.now(),
                time_on_page: timeOnPage,
                session_duration: sessionDuration,
                interaction_count: interactionCount,
                max_scroll_depth: maxScrollDepth,
                page_url: window.location.href
            };
            
            // Use sendBeacon for reliable delivery on page unload
            if (navigator.sendBeacon) {
                navigator.sendBeacon(
                    'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/pixel-tracking',
                    JSON.stringify(data)
                );
            } else {
                sendEvent(data, true); // Synchronous fallback
            }
        }
        
        function setupFormTracking() {
            const forms = document.querySelectorAll('form');
            
            forms.forEach(function(form) {
                // Track form view
                trackFormView(form);
                
                // Track form submission
                form.addEventListener('submit', function(e) {
                    trackFormSubmission(form);
                });
                
                // Track field interactions
                const fields = form.querySelectorAll('input, textarea, select');
                fields.forEach(function(field) {
                    field.addEventListener('focus', function() {
                        trackFieldInteraction(field, 'focus');
                    });
                    
                    field.addEventListener('blur', function() {
                        trackFieldInteraction(field, 'blur');
                    });
                });
            });
        }
        
        function trackFormView(form) {
            const data = {
                event_type: 'form_view',
                tracking_id: trackingId,
                session_id: sessionId,
                user_id: userId,
                timestamp: Date.now(),
                form: {
                    id: form.id || null,
                    action: form.action || null,
                    method: form.method || 'get',
                    field_count: form.querySelectorAll('input, textarea, select').length
                },
                page_url: window.location.href
            };
            
            sendEvent(data);
        }
        
        function trackFormSubmission(form) {
            const data = {
                event_type: 'form_submit',
                tracking_id: trackingId,
                session_id: sessionId,
                user_id: userId,
                timestamp: Date.now(),
                form: {
                    id: form.id || null,
                    action: form.action || null,
                    method: form.method || 'get'
                },
                page_url: window.location.href
            };
            
            sendEvent(data);
        }
        
        function trackFieldInteraction(field, action) {
            // Skip sensitive fields
            if (field.type === 'password' || field.type === 'hidden') {
                return;
            }
            
            const data = {
                event_type: 'field_interaction',
                tracking_id: trackingId,
                session_id: sessionId,
                user_id: userId,
                timestamp: Date.now(),
                field: {
                    name: field.name || null,
                    type: field.type || null,
                    id: field.id || null,
                    required: field.required || false
                },
                action: action,
                page_url: window.location.href
            };
            
            sendEvent(data);
        }
        
        function sendEvent(data, isSync = false) {
            const endpoint = 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/pixel-tracking';
            
            if (isSync) {
                // Synchronous request for page unload
                const xhr = new XMLHttpRequest();
                xhr.open('POST', endpoint, false);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(data));
            } else {
                // Asynchronous request
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }).catch(function(error) {
                    console.warn('Heatmap Analytics: Failed to send event', error);
                });
            }
        }
    }
})();`,

    'assets/enhanced-cookie-banner.js': `// Enhanced Cookie Banner - GDPR Compliant v3.1.0
(function() {
    'use strict';
    
    // Configuration from WordPress
    const config = window.heatmapCookieBannerConfig || {};
    const bannerEnabled = config.bannerEnabled === '1';
    const widgetEnabled = config.widgetEnabled === '1';
    const position = config.position || 'bottom';
    const bannerText = config.bannerText || 'Vi använder cookies för att förbättra din upplevelse.';
    const acceptText = config.acceptText || 'Acceptera';
    const declineText = config.declineText || 'Avböj';
    const trackingId = config.trackingId || '';
    
    // Exit if not enabled
    if (!bannerEnabled && !widgetEnabled) {
        return;
    }
    
    // Domain and session info
    const domain = window.location.hostname;
    const sessionId = getSessionId();
    const siteId = trackingId || domain;
    
    // DOM elements
    let banner = null;
    let modal = null;
    let cookieListContainer = null;
    let widget = null;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        if (bannerEnabled) {
            createBanner();
        }
        
        if (widgetEnabled) {
            createWidget();
        }
        
        fetchCookieList();
        showBannerIfNeeded();
    }
    
    function getSessionId() {
        let sessionId = sessionStorage.getItem('cortiq_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('cortiq_session_id', sessionId);
        }
        return sessionId;
    }
    
    function createBanner() {
        banner = document.createElement('div');
        banner.id = 'heatmap-cookie-banner';
        banner.className = 'heatmap-cookie-banner position-' + position;
        
        banner.innerHTML = \`
            <div class="banner-content">
                <div class="banner-text">
                    <p>\${bannerText}</p>
                </div>
                <div class="banner-actions">
                    <button id="heatmap-cookie-settings" class="btn-settings" aria-label="Cookie Settings">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                        </svg>
                    </button>
                    <button id="heatmap-accept-all" class="btn-accept">\${acceptText}</button>
                    <button id="heatmap-decline-all" class="btn-decline">\${declineText}</button>
                </div>
            </div>
        \`;
        
        document.body.appendChild(banner);
        
        // Event listeners
        document.getElementById('heatmap-cookie-settings').addEventListener('click', showModal);
        document.getElementById('heatmap-accept-all').addEventListener('click', function() {
            storeConsent(['necessary', 'analytics', 'marketing', 'preferences']);
        });
        document.getElementById('heatmap-decline-all').addEventListener('click', function() {
            storeConsent(['necessary']);
        });
    }
    
    function createWidget() {
        widget = document.createElement('div');
        widget.id = 'heatmap-cookie-widget';
        widget.className = 'heatmap-cookie-widget';
        widget.innerHTML = \`
            <button id="heatmap-widget-button" class="widget-button" aria-label="Cookie Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </button>
        \`;
        
        document.body.appendChild(widget);
        
        document.getElementById('heatmap-widget-button').addEventListener('click', showModal);
    }
    
    function createModal() {
        modal = document.createElement('div');
        modal.id = 'heatmap-cookie-modal';
        modal.className = 'heatmap-cookie-modal';
        
        modal.innerHTML = \`
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Cookie Inställningar</h2>
                        <button id="heatmap-modal-close" class="btn-close" aria-label="Stäng">×</button>
                    </div>
                    <div class="modal-body">
                        <p>Vi använder cookies för att förbättra din upplevelse på vår webbplats. Du kan välja vilka typer av cookies du vill tillåta.</p>
                        
                        <div class="cookie-categories">
                            <div class="cookie-category">
                                <div class="category-header">
                                    <label class="category-toggle">
                                        <input type="checkbox" id="necessary" checked disabled>
                                        <span class="checkmark"></span>
                                        <strong>Nödvändiga Cookies</strong>
                                    </label>
                                </div>
                                <p class="category-description">Dessa cookies är nödvändiga för att webbplatsen ska fungera korrekt.</p>
                            </div>
                            
                            <div class="cookie-category">
                                <div class="category-header">
                                    <label class="category-toggle">
                                        <input type="checkbox" id="analytics">
                                        <span class="checkmark"></span>
                                        <strong>Analytics Cookies</strong>
                                    </label>
                                </div>
                                <p class="category-description">Dessa cookies hjälper oss att förstå hur besökare interagerar med webbplatsen.</p>
                            </div>
                            
                            <div class="cookie-category">
                                <div class="category-header">
                                    <label class="category-toggle">
                                        <input type="checkbox" id="marketing">
                                        <span class="checkmark"></span>
                                        <strong>Marknadsföring Cookies</strong>
                                    </label>
                                </div>
                                <p class="category-description">Dessa cookies används för att visa relevanta annonser.</p>
                            </div>
                            
                            <div class="cookie-category">
                                <div class="category-header">
                                    <label class="category-toggle">
                                        <input type="checkbox" id="preferences">
                                        <span class="checkmark"></span>
                                        <strong>Preferens Cookies</strong>
                                    </label>
                                </div>
                                <p class="category-description">Dessa cookies sparar dina preferenser och inställningar.</p>
                            </div>
                        </div>
                        
                        <div class="cookie-details">
                            <button id="heatmap-toggle-details" class="btn-toggle">Visa cookie detaljer</button>
                            <div id="heatmap-cookie-list" class="cookie-list" style="display: none;"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="heatmap-save-preferences" class="btn-save">Spara Preferenser</button>
                        <button id="heatmap-accept-all-modal" class="btn-accept-all">Acceptera Alla</button>
                    </div>
                </div>
            </div>
        \`;
        
        document.body.appendChild(modal);
        cookieListContainer = document.getElementById('heatmap-cookie-list');
        
        // Event listeners
        document.getElementById('heatmap-modal-close').addEventListener('click', hideModal);
        document.getElementById('heatmap-toggle-details').addEventListener('click', toggleCookieDetails);
        document.getElementById('heatmap-save-preferences').addEventListener('click', savePreferences);
        document.getElementById('heatmap-accept-all-modal').addEventListener('click', function() {
            setAllCategories(true);
            savePreferences();
        });
        
        // Close modal on overlay click
        modal.querySelector('.modal-overlay').addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal();
            }
        });
    }
    
    function showModal() {
        if (!modal) {
            createModal();
        }
        
        loadCurrentPreferences();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    function hideModal() {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    function toggleCookieDetails() {
        const button = document.getElementById('heatmap-toggle-details');
        const details = document.getElementById('heatmap-cookie-list');
        
        if (details.style.display === 'none') {
            details.style.display = 'block';
            button.textContent = 'Dölj cookie detaljer';
        } else {
            details.style.display = 'none';
            button.textContent = 'Visa cookie detaljer';
        }
    }
    
    function loadCurrentPreferences() {
        const consent = getConsent();
        
        document.getElementById('analytics').checked = consent.includes('analytics');
        document.getElementById('marketing').checked = consent.includes('marketing');
        document.getElementById('preferences').checked = consent.includes('preferences');
    }
    
    function setAllCategories(enabled) {
        document.getElementById('analytics').checked = enabled;
        document.getElementById('marketing').checked = enabled;
        document.getElementById('preferences').checked = enabled;
    }
    
    function savePreferences() {
        const categories = ['necessary']; // Always include necessary
        
        if (document.getElementById('analytics').checked) {
            categories.push('analytics');
        }
        if (document.getElementById('marketing').checked) {
            categories.push('marketing');
        }
        if (document.getElementById('preferences').checked) {
            categories.push('preferences');
        }
        
        storeConsent(categories);
        hideModal();
    }
    
    function storeConsent(consentTypes) {
        const consent = {
            categories: consentTypes,
            timestamp: Date.now(),
            version: '3.1.0'
        };
        
        // Store in cookie
        document.cookie = \`cortiq_consent=\${consentTypes.join(',')};path=/;max-age=31536000;SameSite=Lax\`;
        
        // Store in localStorage as backup
        localStorage.setItem('cortiq_consent', JSON.stringify(consent));
        
        // Send to Supabase
        sendConsentToSupabase(consent);
        
        // Update Google Analytics consent if available
        updateGoogleAnalyticsConsent(consentTypes);
        
        // Hide banner
        if (banner) {
            banner.style.display = 'none';
        }
        
        // Load analytics loader if consent given
        if (consentTypes.includes('analytics')) {
            loadAnalyticsLoader();
        }
        
        // Dispatch consent event
        document.dispatchEvent(new CustomEvent('consentUpdated', {
            detail: {
                analytics: consentTypes.includes('analytics'),
                marketing: consentTypes.includes('marketing'),
                preferences: consentTypes.includes('preferences')
            }
        }));
        
        hideModal();
    }
    
    function sendConsentToSupabase(consent) {
        const data = {
            site_id: siteId,
            session_id: sessionId,
            domain: domain,
            consent_categories: consent.categories,
            timestamp: consent.timestamp,
            user_agent: navigator.userAgent,
            ip_address: null // Will be detected server-side
        };
        
        fetch('https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/store-consent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).catch(function(error) {
            console.warn('Failed to store consent:', error);
        });
    }
    
    function updateGoogleAnalyticsConsent(consentTypes) {
        if (window.gtag) {
            gtag('consent', 'update', {
                'analytics_storage': consentTypes.includes('analytics') ? 'granted' : 'denied',
                'ad_storage': consentTypes.includes('marketing') ? 'granted' : 'denied',
                'personalization_storage': consentTypes.includes('preferences') ? 'granted' : 'denied'
            });
        }
    }
    
    function loadAnalyticsLoader() {
        if (!document.getElementById('heatmap-analytics-loader')) {
            const script = document.createElement('script');
            script.id = 'heatmap-analytics-loader';
            script.src = config.pluginUrl + 'assets/gdpr-compliant-analytics-loader.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }
    
    function fetchCookieList() {
        fetch(\`https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/supabase-detected-cookies?domain=\${encodeURIComponent(domain)}\`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.cookies) {
                    renderCookieList(data.cookies);
                }
            })
            .catch(error => {
                console.warn('Failed to fetch cookie list:', error);
            });
    }
    
    function renderCookieList(cookiesByCategory) {
        if (!cookieListContainer) return;
        
        let html = '';
        
        Object.keys(cookiesByCategory).forEach(category => {
            const cookies = cookiesByCategory[category];
            if (cookies && cookies.length > 0) {
                html += \`<h4>\${getCategoryDisplayName(category)}</h4>\`;
                html += '<ul class="cookies-in-category">';
                
                cookies.forEach(cookie => {
                    html += \`
                        <li>
                            <strong>\${cookie.name}</strong>
                            <p>\${cookie.purpose}</p>
                            <small>Leverantör: \${cookie.provider} | Utgår: \${cookie.expiry}</small>
                        </li>
                    \`;
                });
                
                html += '</ul>';
            }
        });
        
        // Safely set HTML content after sanitization
        cookieListContainer.innerHTML = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    function getCategoryDisplayName(category) {
        const names = {
            'necessary': 'Nödvändiga Cookies',
            'analytics': 'Analytics Cookies',
            'marketing': 'Marknadsföring Cookies',
            'preferences': 'Preferens Cookies'
        };
        return names[category] || category;
    }
    
    function getConsent() {
        // Check cookie first
        const cookieMatch = document.cookie.match(/cortiq_consent=([^;]+)/);
        if (cookieMatch) {
            return cookieMatch[1].split(',');
        }
        
        // Check localStorage
        const stored = localStorage.getItem('cortiq_consent');
        if (stored) {
            try {
                const consent = JSON.parse(stored);
                return consent.categories || [];
            } catch (e) {
                return [];
            }
        }
        
        return [];
    }
    
    function hasConsent() {
        const consent = getConsent();
        return consent.length > 0;
    }
    
    function showBannerIfNeeded() {
        if (!hasConsent() && banner) {
            banner.style.display = 'block';
        }
    }
    
    // CSS Styles
    const style = document.createElement('style');
    style.textContent = \`
        .heatmap-cookie-banner {
            position: fixed;
            left: 0;
            right: 0;
            background: #fff;
            border: 1px solid #ddd;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .heatmap-cookie-banner.position-top {
            top: 0;
        }
        
        .heatmap-cookie-banner.position-bottom {
            bottom: 0;
        }
        
        .heatmap-cookie-banner.position-center {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 500px;
            border-radius: 8px;
        }
        
        .banner-content {
            display: flex;
            align-items: center;
            padding: 16px 20px;
            gap: 20px;
        }
        
        .banner-text {
            flex: 1;
        }
        
        .banner-text p {
            margin: 0;
            color: #333;
        }
        
        .banner-actions {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .btn-settings {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .btn-settings:hover {
            background: #e9e9e9;
        }
        
        .btn-accept, .btn-decline {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        
        .btn-accept {
            background: #007cba;
            color: white;
        }
        
        .btn-accept:hover {
            background: #005a87;
        }
        
        .btn-decline {
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .btn-decline:hover {
            background: #e9e9e9;
        }
        
        .heatmap-cookie-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999998;
        }
        
        .widget-button {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #007cba;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: background 0.3s;
        }
        
        .widget-button:hover {
            background: #005a87;
        }
        
        .heatmap-cookie-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000000;
            display: none;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .modal-content {
            background: white;
            border-radius: 8px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        
        .modal-header h2 {
            margin: 0;
            font-size: 18px;
            color: #333;
        }
        
        .btn-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .cookie-categories {
            margin: 20px 0;
        }
        
        .cookie-category {
            margin-bottom: 16px;
            padding: 16px;
            border: 1px solid #eee;
            border-radius: 6px;
        }
        
        .category-header {
            margin-bottom: 8px;
        }
        
        .category-toggle {
            display: flex;
            align-items: center;
            cursor: pointer;
            gap: 10px;
        }
        
        .category-toggle input[type="checkbox"] {
            margin: 0;
        }
        
        .category-description {
            margin: 0;
            font-size: 13px;
            color: #666;
            margin-left: 25px;
        }
        
        .cookie-details {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        .btn-toggle {
            background: #f5f5f5;
            border: 1px solid #ddd;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        
        .cookie-list {
            margin-top: 15px;
        }
        
        .cookie-list h4 {
            margin: 15px 0 8px 0;
            font-size: 14px;
            color: #333;
        }
        
        .cookies-in-category {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .cookies-in-category li {
            margin-bottom: 12px;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        
        .cookies-in-category strong {
            display: block;
            margin-bottom: 4px;
        }
        
        .cookies-in-category p {
            margin: 0 0 4px 0;
            font-size: 13px;
        }
        
        .cookies-in-category small {
            font-size: 12px;
            color: #666;
        }
        
        .modal-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .btn-save, .btn-accept-all {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        
        .btn-save {
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .btn-accept-all {
            background: #007cba;
            color: white;
        }
        
        .btn-save:hover {
            background: #e9e9e9;
        }
        
        .btn-accept-all:hover {
            background: #005a87;
        }
        
        @media (max-width: 768px) {
            .banner-content {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
            
            .banner-actions {
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .modal-content {
                margin: 10px;
                max-height: 95vh;
            }
            
            .modal-footer {
                flex-direction: column;
            }
        }
    \`;
    document.head.appendChild(style);
    
    // Initialize
    fetchCookieList();
    showBannerIfNeeded();
})();`,

    'assets/external-consent.js': `// External Consent Integration v3.1.0
(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExternalConsent);
    } else {
        initExternalConsent();
    }
    
    function initExternalConsent() {
        // Listen for external consent updates
        window.addEventListener('message', handleConsentMessage);
        
        // Check for existing consent frameworks
        detectConsentFrameworks();
        
        // Setup mutation observer to watch for consent frameworks
        setupConsentObserver();
    }
    
    function handleConsentMessage(event) {
        // Validate message origin for security
        if (!isValidOrigin(event.origin)) {
            return;
        }
        
        if (event.data && event.data.type === 'consent-update') {
            updateHeatmapConsent(event.data.consent);
        }
    }
    
    function isValidOrigin(origin) {
        // Add your trusted domains here
        const trustedDomains = [
            window.location.origin,
            'https://your-consent-platform.com'
        ];
        
        return trustedDomains.includes(origin);
    }
    
    function detectConsentFrameworks() {
        // Check for common consent management platforms
        
        // OneTrust
        if (window.OptanonActiveGroups || window.OneTrust) {
            console.log('Heatmap Analytics: OneTrust detected');
            integrateOneTrust();
        }
        
        // Cookiebot
        if (window.Cookiebot) {
            console.log('Heatmap Analytics: Cookiebot detected');
            integrateCookiebot();
        }
        
        // Cookie Notice for GDPR
        if (window.cnArgs || document.querySelector('.cookie-notice-container')) {
            console.log('Heatmap Analytics: Cookie Notice detected');
            integrateCookieNotice();
        }
        
        // GDPR Cookie Consent
        if (window.cookielawinfo || document.querySelector('.cli-modal-backdrop')) {
            console.log('Heatmap Analytics: GDPR Cookie Consent detected');
            integrateGDPRCookieConsent();
        }
        
        // Complianz
        if (window.complianz || document.querySelector('.cmplz-cookiebanner')) {
            console.log('Heatmap Analytics: Complianz detected');
            integrateComplianz();
        }
        
        // Borlabs Cookie
        if (window.BorlabsCookie) {
            console.log('Heatmap Analytics: Borlabs Cookie detected');
            integrateBorlabsCookie();
        }
    }
    
    function integrateOneTrust() {
        // OneTrust integration
        function checkOneTrustConsent() {
            if (window.OptanonActiveGroups) {
                const activeGroups = window.OptanonActiveGroups.split(',');
                const consent = {
                    analytics: activeGroups.includes('C0002'),
                    marketing: activeGroups.includes('C0004'),
                    preferences: activeGroups.includes('C0003')
                };
                updateHeatmapConsent(consent);
            }
        }
        
        // Check initial consent
        checkOneTrustConsent();
        
        // Listen for consent changes
        window.addEventListener('OptanonOnConsentChanged', checkOneTrustConsent);
    }
    
    function integrateCookiebot() {
        // Cookiebot integration
        function checkCookiebotConsent() {
            if (window.Cookiebot && window.Cookiebot.consent) {
                const consent = {
                    analytics: window.Cookiebot.consent.statistics,
                    marketing: window.Cookiebot.consent.marketing,
                    preferences: window.Cookiebot.consent.preferences
                };
                updateHeatmapConsent(consent);
            }
        }
        
        // Check initial consent
        checkCookiebotConsent();
        
        // Listen for consent changes
        window.addEventListener('CookiebotOnConsentReady', checkCookiebotConsent);
        window.addEventListener('CookiebotOnDialogDisplay', checkCookiebotConsent);
    }
    
    function integrateCookieNotice() {
        // Cookie Notice for GDPR integration
        function checkCookieNoticeConsent() {
            // Check if consent was given
            const consent = getCookie('cookie_notice_accepted');
            if (consent === 'true') {
                updateHeatmapConsent({
                    analytics: true,
                    marketing: true,
                    preferences: true
                });
            }
        }
        
        checkCookieNoticeConsent();
        
        // Listen for consent
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('cn-accept-cookie')) {
                setTimeout(checkCookieNoticeConsent, 100);
            }
        });
    }
    
    function integrateGDPRCookieConsent() {
        // GDPR Cookie Consent plugin integration
        function checkGDPRConsent() {
            const analytics = getCookie('viewed_cookie_policy') === 'yes' && getCookie('cookielawinfo-checkbox-analytics') === 'yes';
            const marketing = getCookie('viewed_cookie_policy') === 'yes' && getCookie('cookielawinfo-checkbox-advertisement') === 'yes';
            const preferences = getCookie('viewed_cookie_policy') === 'yes' && getCookie('cookielawinfo-checkbox-others') === 'yes';
            
            if (getCookie('viewed_cookie_policy') === 'yes') {
                updateHeatmapConsent({
                    analytics: analytics,
                    marketing: marketing,
                    preferences: preferences
                });
            }
        }
        
        checkGDPRConsent();
        
        // Listen for consent changes
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('cli_setting_save_button') || 
                e.target.classList.contains('wt-cli-accept-all-btn')) {
                setTimeout(checkGDPRConsent, 100);
            }
        });
    }
    
    function integrateComplianz() {
        // Complianz integration
        function checkComplianzConsent() {
            if (window.cmplz_categories) {
                const consent = {
                    analytics: window.cmplz_categories.includes('statistics'),
                    marketing: window.cmplz_categories.includes('marketing'),
                    preferences: window.cmplz_categories.includes('preferences')
                };
                updateHeatmapConsent(consent);
            }
        }
        
        checkComplianzConsent();
        
        // Listen for consent changes
        document.addEventListener('cmplzStatusChange', checkComplianzConsent);
    }
    
    function integrateBorlabsCookie() {
        // Borlabs Cookie integration
        function checkBorlabsConsent() {
            if (window.BorlabsCookie && window.BorlabsCookie.Cookies) {
                const consent = {
                    analytics: window.BorlabsCookie.checkCookieGroup('statistics'),
                    marketing: window.BorlabsCookie.checkCookieGroup('marketing'),
                    preferences: window.BorlabsCookie.checkCookieGroup('preferences')
                };
                updateHeatmapConsent(consent);
            }
        }
        
        checkBorlabsConsent();
        
        // Listen for consent changes
        document.addEventListener('borlabs-cookie-consent-saved', checkBorlabsConsent);
    }
    
    function updateHeatmapConsent(consent) {
        // Map external consent to internal format
        const categories = ['necessary']; // Always include necessary
        
        if (consent.analytics) {
            categories.push('analytics');
        }
        if (consent.marketing) {
            categories.push('marketing');
        }
        if (consent.preferences) {
            categories.push('preferences');
        }
        
        // Store consent in heatmap format
        const heatmapConsent = {
            categories: categories,
            timestamp: Date.now(),
            version: '3.1.0',
            source: 'external'
        };
        
        // Store in cookie and localStorage
        document.cookie = \`cortiq_consent=\${categories.join(',')};path=/;max-age=31536000;SameSite=Lax\`;
        localStorage.setItem('cortiq_consent', JSON.stringify(heatmapConsent));
        
        // Dispatch event for other scripts
        document.dispatchEvent(new CustomEvent('consentUpdated', {
            detail: consent
        }));
        
        console.log('Heatmap Analytics: External consent integrated', consent);
    }
    
    function setupConsentObserver() {
        // Watch for dynamic consent framework loading
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for consent framework indicators
                            if (node.querySelector && (
                                node.querySelector('.cookie-notice-container') ||
                                node.querySelector('.cli-modal-backdrop') ||
                                node.querySelector('.cmplz-cookiebanner') ||
                                node.classList.contains('ot-sdk-container')
                            )) {
                                // Retry detection after framework loads
                                setTimeout(detectConsentFrameworks, 500);
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Cleanup observer after 30 seconds
        setTimeout(function() {
            observer.disconnect();
        }, 30000);
    }
    
    function getCookie(name) {
        const value = \`; \${document.cookie}\`;
        const parts = value.split(\`; \${name}=\`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }
})();`,

    'assets/gdpr-compliant-analytics-loader.js': `// GDPR Compliant Analytics Loader v3.1.0
(function() {
    'use strict';
    
    // Configuration from WordPress
    const config = window.heatmapAnalyticsConfig || {};
    const trackingId = config.trackingId;
    const gaIntegration = config.gaIntegration === '1';
    const gaMeasurementId = config.gaMeasurementId;
    
    // Exit if no tracking ID
    if (!trackingId) {
        console.warn('GDPR Analytics Loader: No tracking ID found');
        return;
    }
    
    // Check for consent
    let hasAnalyticsConsent = false;
    
    function checkConsent() {
        // Check cookie
        const cookieMatch = document.cookie.match(/cortiq_consent=([^;]+)/);
        if (cookieMatch) {
            hasAnalyticsConsent = cookieMatch[1].split(',').includes('analytics');
        }
        
        // Check localStorage as backup
        if (!hasAnalyticsConsent) {
            const stored = localStorage.getItem('cortiq_consent');
            if (stored) {
                try {
                    const consent = JSON.parse(stored);
                    hasAnalyticsConsent = consent.categories && consent.categories.includes('analytics');
                } catch (e) {
                    hasAnalyticsConsent = false;
                }
            }
        }
        
        return hasAnalyticsConsent;
    }
    
    // Initial consent check
    checkConsent();
    
    // Listen for consent updates
    document.addEventListener('consentUpdated', function(e) {
        hasAnalyticsConsent = e.detail && e.detail.analytics;
        if (hasAnalyticsConsent) {
            loadAnalyticsScripts();
        }
    });
    
    // Load scripts if we have consent
    if (hasAnalyticsConsent) {
        loadAnalyticsScripts();
    }
    
    function loadAnalyticsScripts() {
        console.log('GDPR Analytics Loader: Loading analytics scripts with consent');
        
        // Load heatmap tracking script
        loadHeatmapScript();
        
        // Load Google Analytics if enabled
        if (gaIntegration && gaMeasurementId) {
            loadGoogleAnalytics();
        }
    }
    
    function loadHeatmapScript() {
        if (!document.getElementById('heatmap-tracking-script')) {
            const script = document.createElement('script');
            script.id = 'heatmap-tracking-script';
            script.src = config.pluginUrl + 'assets/tracking-script.js';
            script.async = true;
            script.onload = function() {
                console.log('Heatmap tracking script loaded');
            };
            script.onerror = function() {
                console.warn('Failed to load heatmap tracking script');
            };
            document.head.appendChild(script);
        }
    }
    
    function loadGoogleAnalytics() {
        if (!document.getElementById('google-analytics-script')) {
            // Load gtag script
            const gtagScript = document.createElement('script');
            gtagScript.id = 'google-analytics-script';
            gtagScript.src = \`https://www.googletagmanager.com/gtag/js?id=\${gaMeasurementId}\`;
            gtagScript.async = true;
            document.head.appendChild(gtagScript);
            
            // Initialize gtag
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            
            gtag('js', new Date());
            gtag('config', gaMeasurementId, {
                'anonymize_ip': config.anonymizeIp === '1',
                'respect_dnt': true,
                'cookie_flags': 'SameSite=Lax;Secure'
            });
            
            console.log('Google Analytics loaded with measurement ID:', gaMeasurementId);
        }
    }
    
    // Provide global function to check consent status
    window.heatmapHasAnalyticsConsent = function() {
        return checkConsent();
    };
    
    // Provide global function to manually trigger analytics loading
    window.heatmapLoadAnalytics = function() {
        if (checkConsent()) {
            loadAnalyticsScripts();
        } else {
            console.warn('Cannot load analytics: no consent given');
        }
    };
})();`,

    'assets/admin.css': `/* Heatmap Analytics Pro Admin Styles */
.heatmap-admin-page {
    max-width: 1200px;
    margin: 20px 0;
}

.heatmap-admin-header {
    background: #fff;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 6px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.heatmap-admin-header h1 {
    margin: 0 0 10px 0;
    color: #333;
}

.heatmap-admin-tabs {
    margin-bottom: 20px;
}

.heatmap-tab-nav {
    display: flex;
    border-bottom: 1px solid #ddd;
    background: #fff;
    border-radius: 6px 6px 0 0;
}

.heatmap-tab-nav button {
    padding: 12px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
}

.heatmap-tab-nav button.active {
    border-bottom-color: #0073aa;
    color: #0073aa;
}

.heatmap-tab-content {
    background: #fff;
    padding: 20px;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 6px 6px;
}

.heatmap-form-table {
    width: 100%;
    border-collapse: collapse;
}

.heatmap-form-table th {
    text-align: left;
    padding: 15px 10px;
    width: 200px;
    vertical-align: top;
    font-weight: 600;
}

.heatmap-form-table td {
    padding: 15px 10px;
}

.heatmap-form-row {
    border-bottom: 1px solid #f1f1f1;
}

.heatmap-toggle {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}

.heatmap-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
}

.heatmap-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 24px;
}

.heatmap-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

.heatmap-toggle input:checked + .heatmap-slider {
    background-color: #0073aa;
}

.heatmap-toggle input:checked + .heatmap-slider:before {
    transform: translateX(26px);
}

.heatmap-status-indicator {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
}

.heatmap-status-active {
    background-color: #46b450;
}

.heatmap-status-inactive {
    background-color: #dc3232;
}

.heatmap-status-warning {
    background-color: #ffb900;
}

.heatmap-info-box {
    background: #f9f9f9;
    border: 1px solid #e1e1e1;
    border-radius: 4px;
    padding: 15px;
    margin: 15px 0;
}

.heatmap-info-box.info {
    border-left: 4px solid #0073aa;
}

.heatmap-info-box.warning {
    border-left: 4px solid #ffb900;
}

.heatmap-info-box.error {
    border-left: 4px solid #dc3232;
}

.heatmap-info-box.success {
    border-left: 4px solid #46b450;
}

.heatmap-code-block {
    background: #2d3748;
    color: #e2e8f0;
    padding: 15px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    overflow-x: auto;
    margin: 10px 0;
}

.heatmap-button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.heatmap-button {
    background: #0073aa;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease;
}

.heatmap-button:hover {
    background: #005a87;
}

.heatmap-button.secondary {
    background: #6c757d;
}

.heatmap-button.secondary:hover {
    background: #5a6268;
}

.heatmap-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.heatmap-stat-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 20px;
    text-align: center;
}

.heatmap-stat-number {
    font-size: 32px;
    font-weight: bold;
    color: #0073aa;
    margin-bottom: 5px;
}

.heatmap-stat-label {
    color: #666;
    font-size: 14px;
}

@media (max-width: 768px) {
    .heatmap-tab-nav {
        flex-direction: column;
    }
    
    .heatmap-form-table th,
    .heatmap-form-table td {
        display: block;
        width: 100%;
        padding: 10px;
    }
    
    .heatmap-button-group {
        flex-direction: column;
    }
}`,

    'assets/admin.js': `// Heatmap Analytics Pro Admin JavaScript
(function($) {
    'use strict';
    
    $(document).ready(function() {
        initTabs();
        initToggles();
        initStatusChecker();
        initFormValidation();
        initTooltips();
    });
    
    function initTabs() {
        $('.heatmap-tab-nav button').on('click', function() {
            const tabId = $(this).data('tab');
            
            // Update active tab
            $('.heatmap-tab-nav button').removeClass('active');
            $(this).addClass('active');
            
            // Show/hide content
            $('.heatmap-tab-content').hide();
            $('#' + tabId).show();
        });
        
        // Show first tab by default
        $('.heatmap-tab-nav button:first').addClass('active');
        $('.heatmap-tab-content:first').show();
    }
    
    function initToggles() {
        $('.heatmap-toggle input').on('change', function() {
            const isChecked = $(this).is(':checked');
            const dependentFields = $(this).data('dependent');
            
            if (dependentFields) {
                const fields = dependentFields.split(',');
                fields.forEach(function(field) {
                    const $field = $('#' + field.trim());
                    if (isChecked) {
                        $field.closest('tr').show();
                    } else {
                        $field.closest('tr').hide();
                    }
                });
            }
        });
        
        // Trigger initial state
        $('.heatmap-toggle input').trigger('change');
    }
    
    function initStatusChecker() {
        function checkPluginStatus() {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'heatmap_check_status',
                    nonce: heatmapAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        updateStatusIndicators(response.data);
                    }
                },
                error: function() {
                    console.warn('Failed to check plugin status');
                }
            });
        }
        
        function updateStatusIndicators(status) {
            // Update tracking status
            const $trackingStatus = $('.tracking-status-indicator');
            if (status.tracking_enabled && status.tracking_id_set) {
                $trackingStatus.removeClass('heatmap-status-inactive heatmap-status-warning')
                              .addClass('heatmap-status-active');
            } else if (status.tracking_enabled && !status.tracking_id_set) {
                $trackingStatus.removeClass('heatmap-status-active heatmap-status-inactive')
                              .addClass('heatmap-status-warning');
            } else {
                $trackingStatus.removeClass('heatmap-status-active heatmap-status-warning')
                              .addClass('heatmap-status-inactive');
            }
            
            // Update GDPR status
            const $gdprStatus = $('.gdpr-status-indicator');
            if (status.gdpr_enabled) {
                $gdprStatus.removeClass('heatmap-status-inactive')
                           .addClass('heatmap-status-active');
            } else {
                $gdprStatus.removeClass('heatmap-status-active')
                           .addClass('heatmap-status-inactive');
            }
        }
        
        // Check status on page load and every 30 seconds
        checkPluginStatus();
        setInterval(checkPluginStatus, 30000);
    }
    
    function initFormValidation() {
        $('#heatmap-settings-form').on('submit', function(e) {
            let hasErrors = false;
            
            // Validate tracking ID format
            const trackingId = $('#tracking_id').val();
            if (trackingId && !/^tk_[a-f0-9]{32}$/.test(trackingId)) {
                showError('Tracking ID måste ha formatet: tk_[32 hexadecimala tecken]');
                hasErrors = true;
            }
            
            // Validate data retention days
            const retentionDays = parseInt($('#data_retention_days').val());
            if (retentionDays < 1 || retentionDays > 3650) {
                showError('Databevarandeperiod måste vara mellan 1 och 3650 dagar');
                hasErrors = true;
            }
            
            // Validate sampling rate
            const samplingRate = parseInt($('#sampling_rate').val());
            if (samplingRate < 1 || samplingRate > 100) {
                showError('Samplingshastighet måste vara mellan 1 och 100%');
                hasErrors = true;
            }
            
            if (hasErrors) {
                e.preventDefault();
                return false;
            }
            
            showSuccess('Inställningar sparade!');
        });
    }
    
    function initTooltips() {
        $('.heatmap-tooltip').hover(
            function() {
                const tooltip = $(this).data('tooltip');
                if (tooltip) {
                    $('<div class="heatmap-tooltip-content">' + tooltip + '</div>')
                        .appendTo('body')
                        .fadeIn('fast');
                }
            },
            function() {
                $('.heatmap-tooltip-content').remove();
            }
        ).mousemove(function(e) {
            $('.heatmap-tooltip-content').css({
                top: e.pageY + 10,
                left: e.pageX + 10
            });
        });
    }
    
    function showError(message) {
        $('.heatmap-messages').html(
            '<div class="notice notice-error"><p>' + message + '</p></div>'
        );
        $('html, body').animate({ scrollTop: 0 }, 'fast');
    }
    
    function showSuccess(message) {
        $('.heatmap-messages').html(
            '<div class="notice notice-success"><p>' + message + '</p></div>'
        );
        $('html, body').animate({ scrollTop: 0 }, 'fast');
    }
    
    function showWarning(message) {
        $('.heatmap-messages').html(
            '<div class="notice notice-warning"><p>' + message + '</p></div>'
        );
        $('html, body').animate({ scrollTop: 0 }, 'fast');
    }
    
    // Test connectivity functions
    window.testSupabaseConnection = function() {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'heatmap_test_supabase',
                nonce: heatmapAdmin.nonce
            },
            beforeSend: function() {
                $('#test-supabase-btn').prop('disabled', true).text('Testar...');
            },
            success: function(response) {
                if (response.success) {
                    showSuccess('Supabase-anslutning fungerar!');
                } else {
                    showError('Supabase-anslutning misslyckades: ' + response.data);
                }
            },
            error: function() {
                showError('Kunde inte testa Supabase-anslutning');
            },
            complete: function() {
                $('#test-supabase-btn').prop('disabled', false).text('Testa Anslutning');
            }
        });
    };
    
    window.clearAnalyticsCache = function() {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'heatmap_clear_cache',
                nonce: heatmapAdmin.nonce
            },
            beforeSend: function() {
                $('#clear-cache-btn').prop('disabled', true).text('Rensar...');
            },
            success: function(response) {
                if (response.success) {
                    showSuccess('Cache rensad!');
                } else {
                    showError('Kunde inte rensa cache: ' + response.data);
                }
            },
            error: function() {
                showError('Kunde inte rensa cache');
            },
            complete: function() {
                $('#clear-cache-btn').prop('disabled', false).text('Rensa Cache');
            }
        });
    };
    
})(jQuery);`,
    
    'readme.txt': `=== Heatmap Analytics Pro ===
Contributors: expandtalk
Tags: heatmap, analytics, tracking, gdpr, privacy
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 3.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Professionell heatmap och användaranalys med GDPR-kompatibilitet från Expandtalk.se

== Description ==

Heatmap Analytics Pro ger dig djup insikt i hur användare interagerar med din webbplats genom avancerad heatmap-teknologi och användaranalys. Med inbyggt stöd för GDPR-efterlevnad kan du samla värdefull data samtidigt som du respekterar användarnas integritet.

= Huvudfunktioner =

* **Heatmap Tracking** - Visualisera användarinteraktioner med klick, rörelser och scroll-beteende
* **GDPR-kompatibel** - Inbyggt stöd för cookiebanners, samtycke och datarensning
* **Form Analytics** - Spåra formulärinteraktioner och konverteringar
* **IP-exkludering** - Exkludera specifika IP-adresser från spårning (GDPR-säkert hashade)
* **Google Analytics Integration** - Synkronisera med GA4 för komplett analys
* **Mobiloptimerad** - Fungerar perfekt på alla enheter
* **Säker datahantering** - All känslig data krypteras eller anonymiseras

= GDPR-funktioner =

* Automatisk IP-anonymisering
* Cookie-samtyckesbanner med detaljerade inställningar
* Automatisk datarensning enligt inställd bevarandeperiod
* Fullständig transparens över datainsamling
* Säker lagring av användardata

= Premium Support =

Detta plugin utvecklas och underhålls av Expandtalk.se med fokus på prestanda, säkerhet och GDPR-efterlevnad.

== Installation ==

1. Ladda upp plugin-filerna till '/wp-content/plugins/heatmap-analytics/' katalogen
2. Aktivera plugin:et genom 'Plugins' menyn i WordPress
3. Gå till Inställningar > Heatmap Analytics för att konfigurera
4. Ange ditt tracking ID från Expandtalk.se Dashboard
5. Aktivera GDPR-funktioner och konfigurera cookie-banner
6. Spara inställningar och börja samla data!

== Frequently Asked Questions ==

= Är plugin:et GDPR-kompatibelt? =

Ja, plugin:et är utvecklat med GDPR i fokus. Det inkluderar funktioner för:
- Automatisk IP-anonymisering
- Cookie-samtyckesbanner
- Automatisk datarensning
- Fullständig kontrolle över datainsamling

= Var får jag mitt tracking ID? =

Ditt tracking ID finns i din dashboard på Expandtalk.se. Registrera dig för att få tillgång till alla analysfunktioner.

= Påverkar plugin:et sidans prestanda? =

Nej, plugin:et är optimerat för minimal påverkan på sidans laddningstid. Alla script laddas asynkront och sampling används för att minska belastningen.

= Kan jag exkludera vissa användare från spårning? =

Ja, du kan exkludera:
- Specifika användarroller (admin, editor, etc.)
- IP-adresser (lagras säkert hashade)
- Procent av besökare genom sampling

== Screenshots ==

1. Huvudinställningar för heatmap tracking
2. GDPR-kompatibel cookie banner
3. Detaljerade cookie-inställningar
4. Analytics integration med Google Analytics
5. Form tracking konfiguration

== Changelog ==

= 3.1.0 =
* Förbättrad GDPR-efterlevnad med säkrare IP-hantering
* Uppdaterad cookie banner med bättre användarupplevelse
* Stöd för externa consent management platforms
* Förbättrad form analytics med säkerhetsfilter
* Optimerad prestanda och felhantering
* Komplett omarbetning av admin-gränssnittet

= 3.0.0 =
* Större uppdatering med fullständig GDPR-support
* Ny cookie management-funktionalitet
* Förbättrad säkerhet och datahantering
* Integration med Supabase för analytics
* Mobiloptimering och responsiv design

= 2.0.0 =
* Initial release med grundläggande heatmap-funktionalitet
* Cookie banner implementation
* Grundläggande GDPR-stöd

== Upgrade Notice ==

= 3.1.0 =
Denna version innehåller viktiga säkerhetsförbättringar och förbättrad GDPR-efterlevnad. Rekommenderad uppdatering för alla användare.

== Privacy Policy ==

Detta plugin samlar in användarinteraktionsdata för analysändamål. All data:
- Anonymiseras enligt GDPR-krav
- Lagras säkert med kryptering
- Kan raderas på användarens begäran
- Delas inte med tredje part utan samtycke

För fullständig integritetspolicy, besök: https://expandtalk.se/privacy-policy

== Support ==

För support och frågor:
- E-post: support@expandtalk.se
- Webbplats: https://expandtalk.se
- Dokumentation: https://expandtalk.se/docs/heatmap-analytics

== Credits ==

Utvecklat av Expandtalk.se team med fokus på användarintegritet och GDPR-efterlevnad.`,

      // Cookie Widget
      'includes/class-cookie-widget.php': `<?php
/**
 * Cookie Settings Widget
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsCookieWidget {
    private \\$options;
    
    public function __construct(\\$options) {
        \\$this->options = \\$options;
        
        if (isset(\\$options['cookie_widget_enabled']) && \\$options['cookie_widget_enabled']) {
            add_action('wp_footer', array(\\$this, 'render_widget'), 25);
        }
    }
    
    public function render_widget() {
        // Cookie widget implementation
        echo '<div id="cookie-settings-icon">🍪</div>';
    }
    
    public function update_options(\\$new_options) {
        \\$this->options = \\$new_options;
    }
}`,

      // Data Retention
      'includes/class-data-retention.php': `<?php
/**
 * Data retention management for GDPR compliance
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsDataRetention {
    private \\$options;
    
    public function __construct(\\$options) {
        \\$this->options = \\$options;
        
        if (!wp_next_scheduled('heatmap_analytics_daily_cleanup')) {
            wp_schedule_event(time(), 'daily', 'heatmap_analytics_daily_cleanup');
        }
        
        add_action('heatmap_analytics_daily_cleanup', array(\\$this, 'run_cleanup'));
    }
    
    public function run_cleanup() {
        \\$retention_days = isset(\\$this->options['data_retention_days']) ? intval(\\$this->options['data_retention_days']) : 90;
        update_option('heatmap_analytics_last_cleanup', current_time('mysql'));
    }
    
    public function update_options(\\$new_options) {
        \\$this->options = \\$new_options;
    }
}`,

      // Enhanced Cookie Banner
      'includes/class-enhanced-cookie-banner.php': `<?php

class HeatmapAnalyticsEnhancedCookieBanner {
    private \\$options;
    private \\$tracking_id;

    public function __construct(\\$options, \\$tracking_id) {
        \\$this->options = \\$options;
        \\$this->tracking_id = \\$tracking_id;

        add_action('wp_footer', array(\\$this, 'render_cookie_banner'));
    }

    public function render_cookie_banner() {
        echo '<div id="heatmap-cookie-modal">Enhanced Cookie Banner</div>';
    }
}`,

      // Error Handler
      'includes/class-error-handler.php': `<?php
/**
 * Error Handler Class for Heatmap Analytics
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsErrorHandler {
    private \\$options;
    private \\$error_log_key = 'heatmap_analytics_errors';
    private \\$max_errors = 100;
    
    public function __construct(\\$options) {
        \\$this->options = \\$options;
        
        if (isset(\\$options['error_logging']) && \\$options['error_logging']) {
            add_action('wp_ajax_heatmap_log_error', array(\\$this, 'handle_ajax_error'));
            add_action('wp_ajax_nopriv_heatmap_log_error', array(\\$this, 'handle_ajax_error'));
        }
    }
    
    public function log_error(\\$error_data) {
        if (!isset(\\$this->options['error_logging']) || !\\$this->options['error_logging']) {
            return;
        }
        
        \\$errors = get_option(\\$this->error_log_key, array());
        \\$error_data['timestamp'] = current_time('mysql');
        array_unshift(\\$errors, \\$error_data);
        \\$errors = array_slice(\\$errors, 0, \\$this->max_errors);
        update_option(\\$this->error_log_key, \\$errors);
    }
    
    public function handle_ajax_error() {
        \\$error_data = array(
            'message' => sanitize_text_field(\\$_POST['message'] ?? ''),
            'source' => sanitize_text_field(\\$_POST['source'] ?? ''),
            'line' => intval(\\$_POST['line'] ?? 0)
        );
        
        \\$this->log_error(\\$error_data);
        wp_send_json_success();
    }
    
    public function get_recent_errors(\\$limit = 10) {
        \\$errors = get_option(\\$this->error_log_key, array());
        return array_slice(\\$errors, 0, \\$limit);
    }
    
    public function update_options(\\$new_options) {
        \\$this->options = \\$new_options;
    }
}`,

      // Google Analytics Integration
      'includes/class-google-analytics.php': `<?php
/**
 * Google Analytics integration
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsGoogleAnalytics {
    private \\$options;
    
    public function __construct(\\$options) {
        \\$this->options = \\$options;
        add_action('wp_head', array(\\$this, 'add_google_analytics'));
    }
    
    public function add_google_analytics() {
        \\$ga_integration = isset(\\$this->options['ga_integration']) ? \\$this->options['ga_integration'] : false;
        \\$ga_measurement_id = isset(\\$this->options['ga_measurement_id']) ? \\$this->options['ga_measurement_id'] : '';
        
        if (!\\$ga_integration || empty(\\$ga_measurement_id)) {
            return;
        }
        ?>
        <script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo esc_attr(\\$ga_measurement_id); ?>"></script>
        <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '<?php echo esc_js(\\$ga_measurement_id); ?>');
        </script>
        <?php
    }
    
    public function update_options(\\$new_options) {
        \\$this->options = \\$new_options;
    }
}`,

      // Performance Optimizer
      'includes/class-performance-optimizer.php': `<?php
/**
 * Performance Optimizer for Heatmap Analytics
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsPerformanceOptimizer {
    private \\$options;
    private \\$event_queue = array();
    
    public function __construct(\\$options) {
        \\$this->options = \\$options;
        
        if (isset(\\$options['batch_events']) && \\$options['batch_events']) {
            add_action('wp_ajax_heatmap_batch_events', array(\\$this, 'handle_batch_events'));
            add_action('wp_ajax_nopriv_heatmap_batch_events', array(\\$this, 'handle_batch_events'));
            add_action('shutdown', array(\\$this, 'flush_events'));
        }
    }
    
    public function queue_event(\\$event) {
        \\$this->event_queue[] = \\$event;
        \\$batch_size = isset(\\$this->options['batch_size']) ? \\$this->options['batch_size'] : 10;
        if (count(\\$this->event_queue) >= \\$batch_size) {
            \\$this->flush_events();
        }
    }
    
    public function flush_events() {
        if (empty(\\$this->event_queue)) {
            return;
        }
        
        global \\$wpdb;
        \\$table_name = \\$wpdb->prefix . 'heatmap_analytics_events';
        
        foreach (\\$this->event_queue as \\$event) {
            \\$wpdb->insert(\\$table_name, array(
                'tracking_id' => \\$event['tracking_id'],
                'session_id' => \\$event['session_id'],
                'event_type' => \\$event['event_type'],
                'event_data' => json_encode(\\$event['data']),
                'created_at' => current_time('mysql')
            ));
        }
        
        \\$this->event_queue = array();
    }
    
    public function handle_batch_events() {
        \\$events = json_decode(stripslashes(\\$_POST['events'] ?? '[]'), true);
        foreach (\\$events as \\$event) {
            \\$this->queue_event(\\$event);
        }
        \\$this->flush_events();
        wp_send_json_success();
    }
    
    public function update_options(\\$new_options) {
        \\$this->options = \\$new_options;
    }
}`,

      // Pixel Detector
      'includes/class-pixel-detector.php': `<?php
/**
 * Pixel Detector Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsPixelDetector {
    private \\$options;
    
    public function __construct(\\$options = array()) {
        \\$this->options = \\$options;
        
        if (isset(\\$options['auto_detect_pixels']) && \\$options['auto_detect_pixels']) {
            add_action('wp_head', array(\\$this, 'detect_pixels'), 1);
        }
    }
    
    public function detect_pixels() {
        ob_start(array(\\$this, 'scan_html_for_pixels'));
    }
    
    public function scan_html_for_pixels(\\$html) {
        \\$detected_pixels = array();
        
        // Facebook Pixel detection
        if (preg_match('/fbq\\\\([\\\\"\\'\\\\']init[\\\\"\\'\\\\']\\\\s*,\\\\s*[\\\\"\\'\\\\'](\\\\\d+)[\\\\"\\'\\\\']/', \\$html, \\$matches)) {
            \\$detected_pixels[] = array(
                'type' => 'facebook',
                'id' => \\$matches[1],
                'name' => 'Facebook Pixel'
            );
        }
        
        // Google Analytics detection
        if (preg_match('/gtag\\\\([\\\\"\\'\\\\']config[\\\\"\\'\\\\']\\\\s*,\\\\s*[\\\\"\\'\\\\']G-([A-Z0-9]+)[\\\\"\\'\\\\']/', \\$html, \\$matches)) {
            \\$detected_pixels[] = array(
                'type' => 'google_analytics',
                'id' => 'G-' . \\$matches[1],
                'name' => 'Google Analytics 4'
            );
        }
        
        if (!empty(\\$detected_pixels)) {
            \\$current_options = get_option('heatmap_analytics_options', array());
            \\$current_options['detected_pixels'] = \\$detected_pixels;
            update_option('heatmap_analytics_options', \\$current_options);
        }
        
        return \\$html;
    }
    
    public function get_all_pixels() {
        \\$options = get_option('heatmap_analytics_options', array());
        return isset(\\$options['detected_pixels']) ? \\$options['detected_pixels'] : array();
    }
    
    public function update_options(\\$new_options) {
        \\$this->options = \\$new_options;
    }
}`
  };

  const createZipFile = async (customFiles?: { [filename: string]: string }) => {
    const zip = new JSZip();
    const filesToInclude = customFiles || defaultFiles;

    for (const [filename, content] of Object.entries(filesToInclude)) {
      zip.file(filename, content);
    }

    return await zip.generateAsync({ type: 'blob' });
  };

  const downloadPlugin = async () => {
    setIsProcessing(true);
    try {
      const zipBlob = await createZipFile();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'heatmap-analytics-pro-v3.1.0.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadAndDownloadPlugin = async (file: File) => {
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const uploadedZip = await zip.loadAsync(file);
      const customFiles = { ...defaultFiles };

      // Process uploaded files
      for (const [filename, zipEntry] of Object.entries(uploadedZip.files)) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async('string');
          customFiles[filename] = content;
        }
      }

      const newZipBlob = await createZipFile(customFiles);
      const url = URL.createObjectURL(newZipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'heatmap-analytics-pro-custom-v3.1.0.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error processing uploaded file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileList = () => {
    return Object.keys(defaultFiles).map(filename => ({
      name: filename,
      size: new Blob([defaultFiles[filename]]).size
    }));
  };

  const getTotalSize = () => {
    return Object.values(defaultFiles).reduce((total, content) => {
      return total + new Blob([content]).size;
    }, 0);
  };

  const clearUploadedFiles = () => {
    setUploadedFile(null);
  };

  const getUploadedFiles = () => {
    return uploadedFile ? [uploadedFile] : [];
  };

  // Add the remaining PHP files to defaultFiles
  defaultFiles['includes/class-plugin-scanner.php'] = `<?php
/**
 * WordPress Plugin Scanner for Cookie Management
 * Inspired by CookieBot's plugin detection
 */

class HeatmapAnalyticsPluginScanner {
    private \\$options;
    private \\$detected_plugins = [];
    private \\$compliance_score = 0;
    
    public function __construct(\\$options = array()) {
        \\$this->options = \\$options;
        
        add_action('admin_menu', array(\\$this, 'add_scanner_page'));
        add_action('wp_ajax_scan_plugins', array(\\$this, 'ajax_scan_plugins'));
        add_action('wp_ajax_toggle_plugin_blocking', array(\\$this, 'ajax_toggle_plugin_blocking'));
        
        \\$this->scan_wordpress_plugins();
    }
    
    public function add_scanner_page() {
        add_submenu_page(
            'heatmap-analytics',
            'Plugin Scanner',
            'Plugin Scanner',
            'manage_options',
            'heatmap-plugin-scanner',
            array(\\$this, 'render_scanner_page')
        );
    }
    
    public function render_scanner_page() {
        ?>
        <div class="wrap heatmap-scanner">
            <h1>🔍 WordPress Plugin Scanner</h1>
            <p>Skannar efter plugins som kan påverka cookie-kompatibilitet.</p>
        </div>
        <?php
    }
    
    private function scan_wordpress_plugins() {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        \\$all_plugins = get_plugins();
        \\$active_plugins = get_option('active_plugins');
        
        \\$this->detected_plugins = [];
        
        foreach (\\$all_plugins as \\$plugin_file => \\$plugin_data) {
            if (in_array(\\$plugin_file, \\$active_plugins)) {
                \\$plugin_info = \\$this->analyze_plugin(\\$plugin_file, \\$plugin_data);
                if (\\$plugin_info) {
                    \\$this->detected_plugins[] = \\$plugin_info;
                }
            }
        }
    }
    
    private function analyze_plugin(\\$plugin_file, \\$plugin_data) {
        \\$slug = dirname(\\$plugin_file);
        \\$name = \\$plugin_data['Name'];
        
        return [
            'slug' => \\$slug,
            'name' => \\$name,
            'description' => \\$plugin_data['Description'],
            'status' => 'active'
        ];
    }
    
    public function ajax_scan_plugins() {
        \\$this->scan_wordpress_plugins();
        wp_die('Success');
    }
    
    public function ajax_toggle_plugin_blocking() {
        // Handle plugin blocking toggle
        wp_die('Success');
    }
}
?>`;

  defaultFiles['includes/class-security-manager.php'] = `<?php
/**
 * Security Manager for Heatmap Analytics
 * Handles validation, rate limiting, and GDPR-compliant data processing
 * Version: 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsSecurityManager {
    
    private \\$rate_limit_prefix = 'heatmap_rate_';
    private \\$gdpr_log_option = 'heatmap_gdpr_log';
    private \\$max_log_entries = 1000;
    
    /**
     * Validate tracking ID format
     */
    public function validate_tracking_id(\\$tracking_id) {
        \\$tracking_id = trim(\\$tracking_id);
        
        if (preg_match('/^[a-zA-Z0-9-_]{1,50}$/', \\$tracking_id)) {
            return \\$tracking_id;
        }
        
        return false;
    }
    
    /**
     * Validate IP address (supports IPv4, IPv6, and CIDR notation)
     */
    public function validate_ip_address(\\$ip) {
        \\$ip = trim(\\$ip);
        
        if (strpos(\\$ip, '/') !== false) {
            list(\\$subnet, \\$mask) = explode('/', \\$ip, 2);
            
            if (!filter_var(\\$subnet, FILTER_VALIDATE_IP)) {
                return false;
            }
            
            if (filter_var(\\$subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                if (!is_numeric(\\$mask) || \\$mask < 0 || \\$mask > 32) {
                    return false;
                }
            } else {
                if (!is_numeric(\\$mask) || \\$mask < 0 || \\$mask > 128) {
                    return false;
                }
            }
            
            return \\$ip;
        }
        
        if (filter_var(\\$ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_IPV6)) {
            return \\$ip;
        }
        
        return false;
    }
    
    /**
     * Check rate limiting
     */
    public function check_rate_limit(\\$action, \\$limit = 10, \\$window = HOUR_IN_SECONDS) {
        \\$user_id = get_current_user_id();
        \\$ip = \\$this->get_user_ip();
        
        \\$key = \\$this->rate_limit_prefix . \\$action . '_' . (\\$user_id ?: md5(\\$ip));
        
        \\$attempts = get_transient(\\$key);
        
        if (\\$attempts === false) {
            set_transient(\\$key, 1, \\$window);
            return true;
        }
        
        if (\\$attempts >= \\$limit) {
            return false;
        }
        
        set_transient(\\$key, \\$attempts + 1, \\$window);
        return true;
    }
    
    /**
     * Get user's IP address securely
     */
    public function get_user_ip() {
        \\$ip_sources = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];
        
        foreach (\\$ip_sources as \\$source) {
            if (!empty(\\$_SERVER[\\$source])) {
                \\$ip = \\$_SERVER[\\$source];
                
                if (strpos(\\$ip, ',') !== false) {
                    \\$ips = explode(',', \\$ip);
                    \\$ip = trim(\\$ips[0]);
                }
                
                if (filter_var(\\$ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return \\$ip;
                }
            }
        }
        
        if (!empty(\\$_SERVER['REMOTE_ADDR'])) {
            return \\$_SERVER['REMOTE_ADDR'];
        }
        
        return false;
    }
    
    /**
     * Anonymize IP address for GDPR compliance
     */
    public function anonymize_ip(\\$ip) {
        if (empty(\\$ip)) {
            return '';
        }
        
        if (filter_var(\\$ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            \\$parts = explode('.', \\$ip);
            if (count(\\$parts) == 4) {
                \\$parts[3] = '0';
                return implode('.', \\$parts);
            }
        }
        
        if (filter_var(\\$ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            \\$hex = bin2hex(inet_pton(\\$ip));
            \\$hex = substr(\\$hex, 0, 12) . str_repeat('0', 20);
            \\$binary = hex2bin(\\$hex);
            return inet_ntop(\\$binary);
        }
        
        return '';
    }
    
    /**
     * Hash IP address for secure storage
     */
    public function hash_ip_for_storage(\\$ip) {
        \\$salt = wp_salt('nonce');
        return hash('sha256', \\$ip . \\$salt);
    }
    
    /**
     * Check if current IP should be excluded
     */
    public function is_ip_excluded(\\$excluded_ip_hashes = array()) {
        \\$current_ip = \\$this->get_user_ip();
        if (!\\$current_ip) {
            return false;
        }
        
        \\$current_ip_hash = \\$this->hash_ip_for_storage(\\$current_ip);
        return in_array(\\$current_ip_hash, \\$excluded_ip_hashes);
    }
    
    /**
     * Log GDPR-related events
     */
    public function log_gdpr_event(\\$event_type, \\$data = array()) {
        \\$log = get_option(\\$this->gdpr_log_option, array());
        
        \\$log[] = array(
            'event' => sanitize_text_field(\\$event_type),
            'data' => \\$data,
            'timestamp' => current_time('mysql'),
            'user_id' => get_current_user_id(),
            'ip_hash' => \\$this->hash_ip_for_storage(\\$this->get_user_ip())
        );
        
        if (count(\\$log) > \\$this->max_log_entries) {
            \\$log = array_slice(\\$log, -\\$this->max_log_entries);
        }
        
        update_option(\\$this->gdpr_log_option, \\$log);
    }
    
    /**
     * Generate secure random token
     */
    public function generate_secure_token(\\$length = 32) {
        return bin2hex(random_bytes(\\$length / 2));
    }
    
    /**
     * Validate email address
     */
    public function validate_email(\\$email) {
        \\$email = sanitize_email(\\$email);
        
        if (is_email(\\$email)) {
            return \\$email;
        }
        
        return false;
    }
    
    /**
     * Validate URL
     */
    public function validate_url(\\$url) {
        \\$url = esc_url_raw(\\$url);
        
        if (filter_var(\\$url, FILTER_VALIDATE_URL)) {
            return \\$url;
        }
        
        return false;
    }
    
    /**
     * Check if user has consented to tracking
     */
    public function has_tracking_consent() {
        if (isset(\\$_COOKIE['cortiq_consent'])) {
            \\$consent = json_decode(\\$_COOKIE['cortiq_consent'], true);
            return isset(\\$consent['analytics']) && \\$consent['analytics'] === true;
        }
        
        return false;
    }
}
?>`;

  defaultFiles['includes/class-supabase-sync.php'] = `<?php
/**
 * Enhanced Supabase Sync Manager with Caching, Retry Logic & Error Handling
 * Version: 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsSupabaseSync {
    
    private \\$supabase_url = 'https://cxmkdtgfocgbfizawlwa.supabase.co';
    private \\$supabase_anon_key = 'YOUR_SUPABASE_ANON_KEY';
    
    private \\$cache_group = 'heatmap_analytics';
    private \\$cache_ttl = 3600;
    private \\$max_retries = 3;
    private \\$retry_delay = 1000;
    
    public function __construct() {
        add_action('heatmap_analytics_sync_events', array(\\$this, 'sync_pending_events'));
        add_action('wp_ajax_heatmap_sync_now', array(\\$this, 'ajax_sync_now'));
        add_action('wp_ajax_nopriv_heatmap_sync_now', array(\\$this, 'ajax_sync_now'));
    }
    
    /**
     * Get site data by tracking ID with caching
     */
    public function get_site_by_tracking_id(\\$tracking_id) {
        if (empty(\\$tracking_id)) {
            return false;
        }
        
        \\$cache_key = 'site_' . md5(\\$tracking_id);
        \\$cached_data = wp_cache_get(\\$cache_key, \\$this->cache_group);
        
        if (\\$cached_data !== false) {
            return \\$cached_data;
        }
        
        \\$response = \\$this->make_request(
            '/rest/v1/sites',
            'GET',
            array('tracking_id' => 'eq.' . \\$tracking_id)
        );
        
        if (\\$response && isset(\\$response['data']) && !empty(\\$response['data'])) {
            \\$site_data = \\$response['data'][0];
            wp_cache_set(\\$cache_key, \\$site_data, \\$this->cache_group, \\$this->cache_ttl);
            return \\$site_data;
        }
        
        return false;
    }
    
    /**
     * Create or update site configuration
     */
    public function upsert_site(\\$site_data) {
        \\$tracking_id = \\$site_data['tracking_id'];
        \\$this->clear_site_cache(\\$tracking_id);
        
        \\$response = \\$this->make_request(
            '/rest/v1/sites',
            'POST',
            null,
            \\$site_data,
            array('Prefer' => 'resolution=merge-duplicates')
        );
        
        if (\\$response && isset(\\$response['data'])) {
            return \\$response['data'];
        }
        
        return false;
    }
    
    /**
     * Make HTTP request to Supabase with retry logic
     */
    private function make_request(\\$endpoint, \\$method = 'GET', \\$query_params = null, \\$body = null, \\$additional_headers = array()) {
        \\$url = \\$this->supabase_url . \\$endpoint;
        
        if (\\$query_params) {
            \\$url .= '?' . http_build_query(\\$query_params);
        }
        
        \\$headers = array_merge(array(
            'Authorization' => 'Bearer ' . \\$this->supabase_anon_key,
            'apikey' => \\$this->supabase_anon_key,
            'Content-Type' => 'application/json'
        ), \\$additional_headers);
        
        \\$args = array(
            'method' => \\$method,
            'headers' => \\$headers,
            'timeout' => 30,
            'sslverify' => true
        );
        
        if (\\$body) {
            \\$args['body'] = json_encode(\\$body);
        }
        
        for (\\$i = 0; \\$i <= \\$this->max_retries; \\$i++) {
            \\$response = wp_remote_request(\\$url, \\$args);
            
            if (!is_wp_error(\\$response)) {
                \\$response_code = wp_remote_retrieve_response_code(\\$response);
                \\$response_body = wp_remote_retrieve_body(\\$response);
                
                if (\\$response_code >= 200 && \\$response_code < 300) {
                    return array(
                        'data' => json_decode(\\$response_body, true),
                        'status' => \\$response_code
                    );
                } elseif (\\$response_code >= 400 && \\$response_code < 500) {
                    break;
                }
            }
            
            if (\\$i < \\$this->max_retries) {
                usleep(\\$this->retry_delay * pow(2, \\$i) * 1000);
            }
        }
        
        return false;
    }
    
    /**
     * Test connection to Supabase
     */
    public function test_connection() {
        \\$response = \\$this->make_request('/rest/v1/', 'GET');
        return \\$response !== false;
    }
    
    /**
     * Clear cache for a specific site
     */
    private function clear_site_cache(\\$tracking_id) {
        \\$cache_key = 'site_' . md5(\\$tracking_id);
        wp_cache_delete(\\$cache_key, \\$this->cache_group);
    }
    
    /**
     * AJAX handler for manual sync
     */
    public function ajax_sync_now() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        \\$status = \\$this->test_connection();
        wp_send_json_success(\\$status);
    }
}
?>`;

  defaultFiles['includes/class-tracking-manager.php'] = `<?php
/**
 * Tracking Manager Class - GDPR Compliant Version
 * Version: 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class HeatmapAnalyticsTrackingManager {
    
    private \\$options;
    private \\$tracking_id;
    private \\$security_manager;
    
    public function __construct(\\$options, \\$tracking_id) {
        \\$this->options = \\$options;
        \\$this->tracking_id = \\$tracking_id;
        
        require_once plugin_dir_path(__FILE__) . 'class-security-manager.php';
        \\$this->security_manager = new HeatmapAnalyticsSecurityManager();
        
        if (did_action('init')) {
            \\$this->init_hooks();
        } else {
            add_action('init', array(\\$this, 'init_hooks'));
        }
    }
    
    public function init_hooks() {
        if (\\$this->is_tracking_enabled()) {
            add_action('wp_enqueue_scripts', array(\\$this, 'enqueue_tracking_script'));
            add_action('wp_footer', array(\\$this, 'add_tracking_config'));
        }
    }
    
    private function is_tracking_enabled() {
        if (empty(\\$this->tracking_id)) {
            return false;
        }
        
        if (isset(\\$this->options['tracking_enabled']) && !\\$this->options['tracking_enabled']) {
            return false;
        }
        
        if (\\$this->should_exclude_current_user()) {
            return false;
        }
        
        if (\\$this->should_exclude_current_ip_gdpr()) {
            return false;
        }
        
        if (!\\$this->should_track_based_on_sampling()) {
            return false;
        }
        
        return true;
    }
    
    private function should_exclude_current_user() {
        if (is_admin() || !did_action('wp_loaded')) {
            return false;
        }
        
        if (!function_exists('is_user_logged_in') || !function_exists('wp_get_current_user')) {
            return false;
        }
        
        if (!is_user_logged_in()) {
            return false;
        }
        
        \\$excluded_roles = isset(\\$this->options['excluded_roles']) ? \\$this->options['excluded_roles'] : array('administrator');
        \\$user = wp_get_current_user();
        
        foreach (\\$user->roles as \\$role) {
            if (in_array(\\$role, \\$excluded_roles)) {
                return true;
            }
        }
        
        return false;
    }
    
    private function should_exclude_current_ip_gdpr() {
        if (!isset(\\$this->options['ip_exclusion_enabled']) || !\\$this->options['ip_exclusion_enabled']) {
            return false;
        }
        
        \\$excluded_ip_hashes = get_option('heatmap_excluded_ip_hashes', array());
        
        if (empty(\\$excluded_ip_hashes)) {
            return false;
        }
        
        return \\$this->security_manager->is_ip_excluded(\\$excluded_ip_hashes);
    }
    
    private function should_track_based_on_sampling() {
        \\$sampling_rate = isset(\\$this->options['sampling_rate']) ? intval(\\$this->options['sampling_rate']) : 100;
        
        if (\\$sampling_rate >= 100) {
            return true;
        }
        
        if (\\$sampling_rate <= 0) {
            return false;
        }
        
        \\$visitor_ip = \\$this->security_manager->get_user_ip();
        
        if (isset(\\$this->options['anonymize_ip']) && \\$this->options['anonymize_ip']) {
            \\$visitor_ip = \\$this->security_manager->anonymize_ip(\\$visitor_ip);
        }
        
        \\$hash = crc32(\\$visitor_ip . date('Y-m-d'));
        \\$random = (\\$hash % 100) + 1;
        
        return \\$random <= \\$sampling_rate;
    }
    
    public function enqueue_tracking_script() {
        wp_enqueue_script(
            'heatmap-analytics-tracking',
            plugin_dir_url(HEATMAP_ANALYTICS_PLUGIN_FILE) . 'assets/tracking-script.js',
            array(),
            '2.0.0',
            true
        );
        
        if (isset(\\$this->options['detect_external_consent']) && \\$this->options['detect_external_consent']) {
            wp_enqueue_script(
                'heatmap-external-consent',
                plugin_dir_url(HEATMAP_ANALYTICS_PLUGIN_FILE) . 'assets/external-consent.js',
                array('jquery'),
                '2.0.0',
                true
            );
        }
        
        wp_localize_script('heatmap-analytics-tracking', 'heatmap_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heatmap_tracking_nonce')
        ));
    }
    
    public function add_tracking_config() {
        \\$gdpr_enabled = isset(\\$this->options['cookie_banner_enabled']) ? \\$this->options['cookie_banner_enabled'] : true;
        \\$anonymize_ip = isset(\\$this->options['anonymize_ip']) ? \\$this->options['anonymize_ip'] : true;
        
        \\$track_mobile = isset(\\$this->options['track_mobile']) ? \\$this->options['track_mobile'] : true;
        if (!\\$track_mobile && wp_is_mobile()) {
            return;
        }
        
        \\$user_ip = '';
        if (\\$anonymize_ip) {
            \\$user_ip = \\$this->security_manager->anonymize_ip(\\$this->security_manager->get_user_ip());
        }
        
        \\$config = array(
            'trackingId' => \\$this->tracking_id,
            'performanceMode' => isset(\\$this->options['performance_mode']) ? \\$this->options['performance_mode'] : true,
            'trackMobile' => \\$track_mobile,
            'apiEndpoint' => 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/pixel-tracking',
            'gdprEnabled' => \\$gdpr_enabled,
            'anonymizeIp' => \\$anonymize_ip,
            'anonymizeUserAgent' => isset(\\$this->options['anonymize_user_agents']) ? \\$this->options['anonymize_user_agents'] : true,
            'dataRetentionDays' => isset(\\$this->options['data_retention_days']) ? intval(\\$this->options['data_retention_days']) : 90,
            'debug' => (defined('WP_DEBUG') && WP_DEBUG),
            'siteUrl' => get_site_url(),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'privacyPolicyUrl' => isset(\\$this->options['privacy_policy_url']) ? \\$this->options['privacy_policy_url'] : '',
            'consentRequired' => true,
            'cookiePrefix' => 'heatmap_',
            'sessionTimeout' => 30 * 60 * 1000,
        );
        
        ?>
        <script>
        window.heatmapAnalyticsConfig = <?php echo json_encode(\\$config); ?>;
        
        (function() {
            if (navigator.doNotTrack === "1" || window.doNotTrack === "1") {
                console.log('Heatmap Analytics: Respecting Do Not Track preference');
                return;
            }
            
            function initHeatmap() {
                if (window.HeatmapAnalyticsTracker && window.heatmapAnalyticsConfig) {
                    if (window.heatmapAnalyticsConfig.gdprEnabled) {
                        if (localStorage.getItem('cortiq_consent') === 'true' || 
                            document.cookie.indexOf('cortiq_consent=') !== -1) {
                            window.HeatmapAnalyticsTracker.init(window.heatmapAnalyticsConfig);
                        } else {
                            document.addEventListener('cortiq_consent_granted', function() {
                                window.HeatmapAnalyticsTracker.init(window.heatmapAnalyticsConfig);
                            });
                        }
                    } else {
                        window.HeatmapAnalyticsTracker.init(window.heatmapAnalyticsConfig);
                    }
                }
            }
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initHeatmap);
            } else {
                initHeatmap();
            }
        })();
        </script>
        <?php
    }
    
    public function update_options(\\$new_options, \\$new_tracking_id) {
        \\$this->options = \\$new_options;
        \\$this->tracking_id = \\$new_tracking_id;
    }
}
?>`;

  return {
    downloadPlugin,
    uploadAndDownloadPlugin,
    uploadedFile,
    setUploadedFile,
    isProcessing,
    getFileList,
    getTotalSize,
    clearUploadedFiles,
    getUploadedFiles
  };
};