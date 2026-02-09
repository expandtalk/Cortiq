// External Consent Detection for Heatmap Analytics
(function() {
    'use strict';
    
    // Common consent management platforms
    const consentPlatforms = {
        // OneTrust
        oneTrust: function() {
            return window.OneTrust && window.OneTrust.IsAlertBoxClosed && window.OneTrust.IsAlertBoxClosed();
        },
        
        // Cookiebot
        cookiebot: function() {
            return window.Cookiebot && window.Cookiebot.consent && window.Cookiebot.consent.statistics;
        },
        
        // Cookie Notice
        cookieNotice: function() {
            return document.cookie.indexOf('cookie_notice_accepted=true') !== -1;
        },
        
        // GDPR Cookie Consent
        gdprCookieConsent: function() {
            return document.cookie.indexOf('viewed_cookie_policy=yes') !== -1;
        },
        
        // Cookie Law Info
        cookieLawInfo: function() {
            return document.cookie.indexOf('cookielawinfo-checkbox-analytics=yes') !== -1;
        },
        
        // Complianz
        complianz: function() {
            return document.cookie.indexOf('cmplz_statistics=allow') !== -1;
        }
    };
    
    function checkConsent() {
        // Check each platform
        for (let platform in consentPlatforms) {
            try {
                if (consentPlatforms[platform]()) {
                    grantConsent();
                    return true;
                }
            } catch (e) {
                // Platform not available, continue
            }
        }
        
        // Check for generic consent cookies
        const genericPatterns = [
            /analytics.*=.*allow/i,
            /tracking.*=.*true/i,
            /consent.*=.*yes/i,
            /accept.*=.*true/i
        ];
        
        const cookies = document.cookie;
        for (let pattern of genericPatterns) {
            if (pattern.test(cookies)) {
                grantConsent();
                return true;
            }
        }
        
        return false;
    }
    
    function grantConsent() {
        localStorage.setItem('heatmap_consent', 'true');
        
        // Dispatch custom event
        const event = new CustomEvent('heatmap_consent_granted');
        document.dispatchEvent(event);
        
        console.log('Heatmap Analytics: External consent detected');
    }
    
    // Check consent on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkConsent);
    } else {
        checkConsent();
    }
    
    // Monitor for consent changes
    let checkInterval = setInterval(function() {
        if (checkConsent()) {
            clearInterval(checkInterval);
        }
    }, 1000);
    
    // Stop checking after 30 seconds
    setTimeout(function() {
        clearInterval(checkInterval);
    }, 30000);
    
})();
