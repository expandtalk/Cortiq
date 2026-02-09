document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('heatmap-cookie-modal');
  const icon = document.getElementById('cookie-settings-icon');
  const acceptAllBtn = document.getElementById('accept-all-cookies');
  const necessaryOnlyBtn = document.getElementById('necessary-only-cookies');
  const saveBtn = document.getElementById('save-cookies');
  const closeBtn = document.getElementById('cookie-banner-close');

  function updateCookieIconStatus() {
    const consentCookie = getCookie('heatmap_consent');
    if (consentCookie) {
      try {
        const consent = JSON.parse(consentCookie);
        const hasOptionalConsent = consent.analytics || consent.marketing || consent.preferences || consent.other;
        
        if (hasOptionalConsent) {
          // User has given consent to optional cookies - show gray, less prominent
          icon?.classList.add('has-consent');
          icon?.classList.remove('needs-attention');
        } else {
          // User only has necessary cookies - show more prominent to encourage action
          icon?.classList.remove('has-consent');
          icon?.classList.add('needs-attention');
        }
      } catch (e) {
        console.error('Failed to parse consent cookie:', e);
        icon?.classList.remove('has-consent');
        icon?.classList.add('needs-attention');
      }
    } else {
      // No consent given yet - show prominent
      icon?.classList.remove('has-consent');
      icon?.classList.add('needs-attention');
    }
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Kontrollera om cookien redan finns
  function shouldShowBanner() {
    return !document.cookie.includes('heatmap_consent=');
  }

  // Visa bannern
  function showBanner() {
    if (modal) modal.classList.remove('hidden');
  }

  // Dölj bannern
  function hideBanner() {
    if (modal) modal.classList.add('hidden');
  }

  // Sätt consent-cookie
  function setConsentCookie(value) {
    const cookie = `heatmap_consent=${value}; path=/; max-age=${365 * 24 * 60 * 60}`;
    document.cookie = cookie;
    // Update cookie icon status after consent change
    updateCookieIconStatus();
  }

  // Händelsehantering
  updateCookieIconStatus(); // Initialize icon status
  if (shouldShowBanner()) {
    showBanner();
  }

  icon?.addEventListener('click', () => {
    showBanner();
  });

  acceptAllBtn?.addEventListener('click', () => {
    setConsentCookie('{"necessary":true,"analytics":true,"preferences":true,"marketing":true,"other":true}');
    hideBanner();
  });

  necessaryOnlyBtn?.addEventListener('click', () => {
    setConsentCookie('{"necessary":true,"analytics":false,"preferences":false,"marketing":false,"other":false}');
    hideBanner();
  });

  saveBtn?.addEventListener('click', () => {
    // Här kan man senare lägga till logik för att spara anpassade inställningar
    setConsentCookie('{"necessary":true,"analytics":false,"preferences":false,"marketing":false,"other":false}');
    hideBanner();
  });

  closeBtn?.addEventListener('click', () => {
    hideBanner();
  });
});
