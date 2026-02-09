/**
 * GDPR Analytics Blocker - Blockerar Google Analytics tills samtycke
 * Spara som: /wp-content/plugins/heatmap-analytics/assets/gdpr-analytics-blocker.js
 */

(function() {
    'use strict';
    
    console.log('GDPR: Blockerar Google Analytics tills samtycke ges');
    
    // Blockera Google Analytics omedelbart
    window['ga-disable-G-G1RW8PSZVL'] = true;
    window['ga-disable-GT-TQVQQ'] = true; // Blockera även GTM om det används
    
    // Initiera dataLayer men utan tracking
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    
    // Sätt standard consent (allt blockerat utom säkerhet)
    gtag('consent', 'default', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied',
        'functionality_storage': 'denied',
        'personalization_storage': 'denied',
        'security_storage': 'granted'
    });
    
    gtag('js', new Date());
    
    // Lyssna på samtycke från cookie banner
    document.addEventListener('consentUpdated', function(event) {
        const consent = event.detail;
        console.log('GDPR: Consent uppdaterat', consent);
        
        if (consent.analytics) {
            // Ladda GA script ENDAST när consent ges
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=G-G1RW8PSZVL';
            document.head.appendChild(script);
            
            // Aktivera Google Analytics
            window['ga-disable-G-G1RW8PSZVL'] = false;
            window['ga-disable-GT-TQVQQ'] = false;
            
            // Uppdatera consent
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
            
            // Konfigurera GA med anonymisering (vänta lite för att script ska ladda)
            setTimeout(() => {
                gtag('config', 'G-G1RW8PSZVL', {
                    'anonymize_ip': true,
                    'allow_google_signals': false,
                    'allow_ad_personalization_signals': false
                });
            }, 100);
            
            // Ladda GTM script om det behövs
            if (document.querySelector('[data-gtm-id]')) {
                const gtmScript = document.createElement('script');
                gtmScript.async = true;
                gtmScript.src = 'https://www.googletagmanager.com/gtag/js?id=GT-TQVQQ';
                document.head.appendChild(gtmScript);
                
                setTimeout(() => {
                    gtag('config', 'GT-TQVQQ', {
                        'anonymize_ip': true
                    });
                }, 100);
            }
            
            console.log('GDPR: Google Analytics aktiverat med samtycke');
        }
        
        if (consent.marketing) {
            gtag('consent', 'update', {
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted',
                'personalization_storage': 'granted'
            });
            console.log('GDPR: Marketing cookies aktiverat');
        }
        
        if (consent.preferences) {
            gtag('consent', 'update', {
                'functionality_storage': 'granted'
            });
            console.log('GDPR: Preferens cookies aktiverat');
        }
    });
    
    // Ladda INTE GA script innan consent - detta är problemet!
    
    console.log('GDPR: Google Analytics scripts laddade men blockerade');
})();
