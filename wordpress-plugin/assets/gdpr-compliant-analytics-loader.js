/**
 * Fixad Cookie Banner - komplett ny version
 * Ersätt hela din gdpr-compliant-analytics-loader.js med denna kod
 */

document.addEventListener('DOMContentLoaded', async () => {
  const modal = document.getElementById('heatmap-cookie-modal');
  const backdrop = document.getElementById('cookie-modal-backdrop');
  const icon = document.getElementById('cookie-settings-icon');
  const acceptAllBtn = document.getElementById('accept-all-cookies');
  const declineBtn = document.getElementById('decline-cookies');
  const saveBtn = document.getElementById('save-cookies');
  const closeBtn = document.getElementById('cookie-banner-close');
  const categoriesContainer = document.getElementById('cookie-categories');

  // Hämta tracking ID från WordPress config istället för script tag
  const trackingId = window.heatmapAnalyticsConfig?.trackingId || 'default-site-id';
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const source = 'banner';
  const supabaseUrl = 'https://cxmkdtgfocgbfizawlwa.supabase.co';

  // Cookie kategorier utan ikoner
  const cookieCategories = {
    necessary: {
      name: 'Nödvändiga cookies',
      description: 'Dessa cookies krävs för att webbplatsens grundläggande funktioner ska fungera och kan inte stängas av.',
      benefit: 'Säker inloggning, sessionshantering och grundläggande webbplatsfunktioner',
      required: true,
      cookies: []
    },
    analytics: {
      name: 'Prestanda-cookies (analys)',
      description: 'Hjälper oss förstå hur besökare interagerar med webbplatsen genom att samla in anonym statistik.',
      benefit: 'Hjälp oss förbättra din upplevelse genom anonymiserad statistik',
      required: false,
      cookies: []
    },
    preferences: {
      name: 'Preferens-cookies',
      description: 'Kommer ihåg dina inställningar som språkval, region och anpassningar.',
      benefit: 'Spara dina inställningar för en personlig upplevelse',
      required: false,
      cookies: []
    },
    marketing: {
      name: 'Marknadsförings-cookies',
      description: 'Används för att visa relevanta annonser utifrån ditt beteende och dina intressen.',
      benefit: 'Se annonser som är mer relevanta för dina intressen',
      required: false,
      cookies: []
    },
    other: {
      name: 'Övriga cookies',
      description: 'Används för särskilda funktioner eller tjänster som inte passar i de andra kategorierna.',
      benefit: 'Aktivera avancerade webbplatsfunktioner',
      required: false,
      cookies: []
    }
  };

  let currentConsent = {
    necessary: true,
    analytics: true,     // Default för nudging
    preferences: false,
    marketing: false,
    other: false
  };

  // Lägg till CSS-fixes direkt i JavaScript
  function addCSSFixes() {
    const style = document.createElement('style');
    style.textContent = `
      /* Fix X-knappen */
      #cookie-banner-close {
        position: absolute !important;
        top: 16px !important;
        right: 16px !important;
        background: rgba(255, 255, 255, 0.15) !important;
        border: none !important;
        font-size: 18px !important;
        cursor: pointer !important;
        color: white !important;
        width: 32px !important;
        height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 6px !important;
        transition: all 0.3s ease !important;
        backdrop-filter: blur(10px) !important;
      }

      #cookie-banner-close:hover {
        background: rgba(255, 255, 255, 0.25) !important;
        transform: none !important;
      }

      /* Smart cookie-ikon som nudgar baserat på samtycke */
      #cookie-settings-icon {
        position: fixed !important;
        bottom: 24px !important;
        left: 24px !important;
        color: white !important;
        border-radius: 12px !important;
        padding: 14px !important;
        font-size: 18px !important;
        z-index: 9999 !important;
        cursor: pointer !important;
        transition: all 0.4s ease !important;
        border: none !important;
      }

      /* Default state: ingen samtycke = mer dominant för att nudga */
      #cookie-settings-icon.no-consent {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4) !important;
        animation: gentle-pulse 3s ease-in-out infinite !important;
      }

      #cookie-settings-icon.no-consent:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 8px 25px rgba(245, 158, 11, 0.6) !important;
        background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
      }

      /* After consent: diskret och mindre dominant */
      #cookie-settings-icon.has-consent {
        background: #6b7280 !important;
        box-shadow: 0 2px 8px rgba(107, 114, 128, 0.2) !important;
        opacity: 0.7 !important;
      }

      #cookie-settings-icon.has-consent:hover {
        transform: scale(1.05) !important;
        background: #4b5563 !important;
        opacity: 1 !important;
        box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3) !important;
      }

      /* Gentle pulsing animation för att dra uppmärksamhet */
      @keyframes gentle-pulse {
        0%, 100% { 
          transform: scale(1);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }
        50% { 
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
        }
      }

      /* Fix knappar - ta bort ikoner och gör dem på en rad */
      .cookie-buttons {
        background: #f8fafc !important;
        padding: 24px 40px !important;
        border-top: 1px solid #e2e8f0 !important;
        display: flex !important;
        justify-content: space-between !important;
        gap: 12px !important;
        flex-wrap: nowrap !important;
      }

      .cookie-buttons button {
        padding: 12px 24px !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        border: none !important;
        font-size: 14px !important;
        flex: 1 !important;
        transition: all 0.3s ease !important;
        text-transform: none !important;
        min-width: auto !important;
      }

      .cookie-buttons button::before {
        display: none !important;
      }

      #accept-all-cookies {
        background: #10b981 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3) !important;
      }

      #accept-all-cookies:hover {
        background: #059669 !important;
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4) !important;
        transform: none !important;
      }

      #save-cookies {
        background: #3b82f6 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
      }

      #save-cookies:hover {
        background: #2563eb !important;
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4) !important;
        transform: none !important;
      }

      #decline-cookies {
        background: #6b7280 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3) !important;
      }

      #decline-cookies:hover {
        background: #4b5563 !important;
        box-shadow: 0 4px 8px rgba(107, 114, 128, 0.4) !important;
        transform: none !important;
      }

      @media (max-width: 768px) {
        .cookie-buttons {
          flex-direction: column !important;
          gap: 8px !important;
        }
        
        .cookie-buttons button {
          flex: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Uppdatera cookie-ikon baserat på samtycke
  function updateCookieIconState() {
    const hasConsent = !!getCookie('heatmap_consent');
    
    if (icon) {
      if (hasConsent) {
        icon.classList.remove('no-consent');
        icon.classList.add('has-consent');
        icon.title = 'Ändra cookie-inställningar';
        console.log('GDPR: Cookie-ikon i diskret läge (har samtycke)');
      } else {
        icon.classList.remove('has-consent');
        icon.classList.add('no-consent');
        icon.title = 'Hantera cookies - Välj dina preferenser';
        console.log('GDPR: Cookie-ikon i uppmärksamhetsläge (inget samtycke)');
      }
    }
  }

  // Fix knapptext - ta bort ikoner
  function fixButtonText() {
    if (acceptAllBtn) acceptAllBtn.textContent = 'Acceptera alla';
    if (saveBtn) saveBtn.textContent = 'Spara val';
    if (declineBtn) declineBtn.textContent = 'Endast nödvändiga';
  }

  // Fix buttons när DOM är redo
  setTimeout(fixButtonText, 100);

  function loadExistingConsent() {
    const consentCookie = getCookie('heatmap_consent');
    if (consentCookie) {
      try {
        const savedConsent = JSON.parse(consentCookie);
        currentConsent = {...currentConsent, ...savedConsent};
        currentConsent.necessary = true;
        console.log('GDPR: Befintligt samtycke laddat', currentConsent);
      } catch (e) {
        console.error('GDPR: Kunde inte ladda samtycke', e);
      }
    }
  }

  async function detectIncognitoAndShowBanner() {
    try {
      const estimate = await navigator.storage.estimate();
      const isIncognito = estimate.quota < 120000000;
      const hasConsent = !!getCookie('heatmap_consent');
      
      console.log('GDPR: Banner check', { isIncognito, hasConsent });
      
      if (!hasConsent || isIncognito) {
        showModal();
      }
    } catch (e) {
      if (!getCookie('heatmap_consent')) {
        showModal();
      }
    }
  }

  function showModal() {
    console.log('GDPR: Visar cookie banner');
    
    backdrop?.classList.add('active');
    modal?.classList.add('active');
    
    setTimeout(() => {
      const firstButton = modal?.querySelector('button:not([disabled])');
      firstButton?.focus();
    }, 300);
    
    updateToggleStates();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    console.log('GDPR: Stänger cookie banner');
    
    modal?.classList.remove('active');
    backdrop?.classList.remove('active');
    document.body.style.overflow = '';
    icon?.focus();
  }

  function handleCloseButton(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const hasExistingConsent = !!getCookie('heatmap_consent');
    
    if (hasExistingConsent) {
      console.log('GDPR: Användaren har befintligt samtycke');
      closeModal();
    } else {
      console.log('GDPR: Första gången, visar vänlig påminnelse');
      showFriendlyReminder();
    }
  }

  function showFriendlyReminder() {
    const reminder = document.createElement('div');
    reminder.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
      z-index: 10001;
      font-weight: 600;
      text-align: center;
      max-width: 400px;
      animation: slideInFromTop 0.3s ease;
    `;
    
    reminder.innerHTML = `
      <div style="margin-bottom: 8px;">⚠️ Val krävs</div>
      <div style="font-size: 14px; font-weight: 400;">
        Välj dina cookie-preferenser innan du stänger dialogen
      </div>
    `;
    
    document.body.appendChild(reminder);
    
    setTimeout(() => {
      reminder.style.animation = 'slideInFromTop 0.3s ease reverse';
      setTimeout(() => reminder.remove(), 300);
    }, 4000);
  }

  // Event listeners med korrekt X-knapp hantering
  icon?.addEventListener('click', showModal);
  backdrop?.addEventListener('click', handleCloseButton);
  
  // FIXA X-knappen - lägg till event listener direkt
  if (closeBtn) {
    closeBtn.addEventListener('click', handleCloseButton);
  }

  // Lägg till global handler
  window.handleCookieCloseButton = handleCloseButton;

  acceptAllBtn?.addEventListener('click', async () => {
    console.log('GDPR: Accepterar alla cookies');
    
    currentConsent = { 
      necessary: true, 
      analytics: true, 
      preferences: true, 
      marketing: true, 
      other: true 
    };
    await storeConsent(currentConsent);
    closeModal();
  });

  declineBtn?.addEventListener('click', async () => {
    console.log('GDPR: Avböjer icke-nödvändiga cookies');
    
    currentConsent = { 
      necessary: true, 
      analytics: false, 
      preferences: false, 
      marketing: false, 
      other: false 
    };
    await storeConsent(currentConsent);
    closeModal();
  });

  saveBtn?.addEventListener('click', async () => {
    console.log('GDPR: Sparar anpassade val', currentConsent);
    
    await storeConsent(currentConsent);
    closeModal();
  });

  async function storeConsent(consentTypes) {
    try {
      consentTypes.necessary = true;
      
      console.log('GDPR: Sparar samtycke', consentTypes);
      
      showSuccessMessage();
      
      // Sätt heatmap_consent cookie med korrekt format
      const cookieString = 'heatmap_consent=' + JSON.stringify(consentTypes) + 
        '; path=/; max-age=' + (365 * 24 * 60 * 60) + 
        '; SameSite=Lax' + 
        (location.protocol === 'https:' ? '; Secure' : '');
      
      document.cookie = cookieString;
      
      // Sätt även heatmap_analytics cookie om analytics godkänns
      if (consentTypes.analytics) {
        const analyticsData = {
          enabled: true,
          timestamp: new Date().toISOString(),
          session_id: sessionId,
          site_id: trackingId
        };
        
        const analyticsCookieString = 'heatmap_analytics=' + JSON.stringify(analyticsData) + 
          '; path=/; max-age=' + (30 * 24 * 60 * 60) + // 30 dagar
          '; SameSite=Lax' + 
          (location.protocol === 'https:' ? '; Secure' : '');
        
        document.cookie = analyticsCookieString;
        console.log('GDPR: heatmap_analytics cookie satt');
      } else {
        // Ta bort heatmap_analytics cookie om analytics avvisas
        document.cookie = 'heatmap_analytics=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        console.log('GDPR: heatmap_analytics cookie borttagen');
      }
      
      // Logga alla cookies för debug
      console.log('GDPR: Nuvarande cookies:', document.cookie);
      
      // FIXAT: Skicka till Supabase via pixel-tracking endpoint istället för store-consent
      try {
        const consentPayload = {
          type: 'batch',
          siteId: trackingId,        // Använd korrekt tracking ID
          sessionId: sessionId,
          events: [{
            type: 'consent_updated',
            event_type: 'consent_updated',
            data: {
              consent_types: consentTypes,
              source: source,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
              language: navigator.language
            },
            timestamp: new Date().toISOString()
          }]
        };

        console.log('GDPR: Skickar consent payload:', consentPayload);

        const response = await fetch(`${supabaseUrl}/functions/v1/pixel-tracking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(consentPayload)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('GDPR: Samtycke synkat till Supabase via pixel-tracking:', result);
        } else {
          const errorText = await response.text();
          console.warn('GDPR: Supabase sync misslyckades (icke-kritiskt):', response.status, errorText);
        }
      } catch (apiError) {
        console.warn('GDPR: Supabase sync misslyckades (icke-kritiskt):', apiError);
      }
      
      // Update Google Analytics
      if (window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: consentTypes.marketing ? 'granted' : 'denied',
          analytics_storage: consentTypes.analytics ? 'granted' : 'denied',
          functionality_storage: consentTypes.preferences ? 'granted' : 'denied'
        });
        console.log('GDPR: Google consent uppdaterat');
      }
      
      // Dispatch events
      document.dispatchEvent(new CustomEvent('consentUpdated', { 
        detail: consentTypes 
      }));
      
      // Enable tracking - förbättrad logik
      if (consentTypes.analytics) {
        console.log('GDPR: Analytics godkänt, aktiverar tracking...');
        
        // Vänta lite för att säkerställa att cookies är satta
        setTimeout(() => {
          if (window.HeatmapAnalyticsTracker) {
            window.HeatmapAnalyticsTracker.consent(true);
            console.log('GDPR: Heatmap tracking aktiverat via tracker');
          } else {
            console.log('GDPR: Tracker inte tillgänglig än, väntar...');
            // Sätt upp en listener för när tracker blir tillgänglig
            const checkTracker = setInterval(() => {
              if (window.HeatmapAnalyticsTracker) {
                clearInterval(checkTracker);
                window.HeatmapAnalyticsTracker.consent(true);
                console.log('GDPR: Heatmap tracking aktiverat (fördröjd)');
              }
            }, 500);
            
            // Sluta försöka efter 10 sekunder
            setTimeout(() => clearInterval(checkTracker), 10000);
          }
        }, 100);
      } else {
        console.log('GDPR: Analytics ej godkänt, tracking förblir inaktivt');
      }
      
      // Uppdatera cookie-ikon efter samtycke
      updateCookieIconState();
      
    } catch (e) {
      console.error('GDPR: Fel vid sparande', e);
      showErrorMessage();
    }
  }

  function showSuccessMessage() {
    const message = createFloatingMessage('✅ Dina val har sparats!', '#10b981');
    document.body.appendChild(message);
  }

  function showErrorMessage() {
    const message = createFloatingMessage('❌ Ett fel uppstod. Försök igen.', '#ef4444');
    document.body.appendChild(message);
  }

  function createFloatingMessage(text, color) {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      background: ${color};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      z-index: 10001;
      font-weight: 600;
      animation: slideInFromRight 0.3s ease;
    `;
    
    message.textContent = text;
    
    setTimeout(() => {
      message.style.animation = 'slideInFromRight 0.3s ease reverse';
      setTimeout(() => message.remove(), 300);
    }, 3000);
    
    return message;
  }

  async function fetchCookieList() {
    try {
      const domain = window.location.hostname.replace(/^www\./, '');
      console.log('GDPR: Hämtar cookies från Supabase för:', domain);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/supabase-detected-cookies?domain=${domain}`);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('GDPR: Supabase cookie data:', data);
      
      if (data?.cookies) {
        mapCookiesToCategories(data.cookies);
        
        // Ta bort fake marketing cookies - visa bara om de faktiskt finns
        console.log('GDPR: Marketing cookies från API:', cookieCategories.marketing.cookies);
      } else {
        console.log('GDPR: Använder standardcookies');
        useDefaultCookies();
      }
    } catch (err) {
      console.error('GDPR: Fel vid hämtning från Supabase:', err);
      useDefaultCookies();
    }
    renderCategories();
  }

  function mapCookiesToCategories(apiCookies) {
    Object.keys(cookieCategories).forEach(key => { 
      cookieCategories[key].cookies = []; 
    });
    
    Object.entries(apiCookies).forEach(([categoryName, cookieList]) => {
      const categoryMap = {
        'Nödvändiga cookies': 'necessary',
        'Nödvändiga cookies (alltid aktiva)': 'necessary',
        'Prestanda-cookies (analys)': 'analytics',
        'Marknadsförings-cookies': 'marketing',
        'Preferenser': 'preferences',
        'Övriga': 'other'
      };
      
      const key = categoryMap[categoryName] || categoryName;
      if (cookieCategories[key]) {
        cookieCategories[key].cookies = cookieList || [];
      }
    });
    
    console.log('GDPR: Mappade kategorier:', cookieCategories);
  }

  function useDefaultCookies() {
    // Bara cookies som faktiskt används på din sajt
    cookieCategories.necessary.cookies = [
      'PHPSESSID', 
      'wordpress_logged_in_*', 
      'wp-settings-*', 
      'wp-settings-time-*',
      'wordpress_test_cookie', 
      'heatmap_consent',        // FLYTTAD HIT - är nödvändig för GDPR-efterlevnad
      'comment_author_*',
      'comment_author_email_*',
      'comment_author_url_*'
    ];
    
    cookieCategories.analytics.cookies = [
      '_ga', 
      '_ga_*',  // Google Analytics för din sajt
      '_gat', 
      '_gid', 
      'heatmap_analytics'       // Denna är analytics, inte nödvändig
    ];
    
    // Bara visa marketing om vi faktiskt har marketing cookies
    cookieCategories.marketing.cookies = [];
    
    cookieCategories.preferences.cookies = [
      'language', 
      'theme'
    ];
    
    cookieCategories.other.cookies = [];
  }

  function renderCategories() {
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = '';
    
    let hasMarketingCookies = false;
    
    for (const [key, category] of Object.entries(cookieCategories)) {
      // Skippa kategorier utan cookies (utom necessary som alltid ska visas)
      if (category.cookies.length === 0 && key !== 'necessary') {
        console.log(`GDPR: Hoppar över ${key} - inga cookies`);
        continue;
      }
      
      if (key === 'marketing' && category.cookies.length > 0) {
        hasMarketingCookies = true;
        console.log('GDPR: Marketing cookies hittade:', category.cookies);
      }
      
      const categoryEl = createCategoryElement(key, category);
      categoriesContainer.appendChild(categoryEl);
    }
    
    // Visa Google notice bara om det finns marketing cookies
    const googleNotice = document.getElementById('google-notice');
    if (googleNotice) {
      googleNotice.style.display = hasMarketingCookies ? 'block' : 'none';
      console.log('GDPR: Google notice:', hasMarketingCookies ? 'visas' : 'döljs');
    }
  }

  function createCategoryElement(key, category) {
    const div = document.createElement('div');
    div.className = 'cookie-category';
    div.dataset.category = key;

    const header = document.createElement('div');
    header.className = 'cookie-category-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'false');

    const info = document.createElement('div');
    info.className = 'cookie-category-info';
    
    const title = document.createElement('h3');
    title.className = 'cookie-category-title';
    title.textContent = category.name;
    
    const count = document.createElement('span');
    count.className = 'cookie-count';
    count.textContent = category.cookies.length;
    
    info.appendChild(title);
    info.appendChild(count);

    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'cookie-category-toggle';
    
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'toggle-switch';
    
    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.checked = currentConsent[key];
    toggleInput.disabled = category.required;
    toggleInput.dataset.category = key;
    
    toggleInput.addEventListener('change', (e) => {
      currentConsent[key] = e.target.checked;
      console.log(`GDPR: ${key} ändrat till`, e.target.checked);
      
      if (e.target.checked) {
        e.target.parentElement.style.transform = 'scale(1.05)';
        setTimeout(() => e.target.parentElement.style.transform = '', 200);
      }
    });
    
    const toggleSlider = document.createElement('span');
    toggleSlider.className = 'toggle-slider';
    
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(toggleSlider);
    toggleContainer.appendChild(toggleSwitch);

    header.appendChild(info);
    header.appendChild(toggleContainer);

    // Content
    const content = document.createElement('div');
    content.className = 'cookie-category-content';
    
    const description = document.createElement('p');
    description.style.fontSize = '14px';
    description.style.color = '#666';
    description.style.marginBottom = '12px';
    description.style.lineHeight = '1.6';
    description.textContent = category.description;
    
    const benefit = document.createElement('p');
    benefit.style.fontSize = '13px';
    benefit.style.color = '#2563eb';
    benefit.style.fontWeight = '600';
    benefit.style.marginBottom = '16px';
    benefit.style.padding = '12px';
    benefit.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
    benefit.style.border = '1px solid #a7f3d0';
    benefit.style.borderRadius = '8px';
    benefit.textContent = category.benefit;
    
    const list = document.createElement('ul');
    list.className = 'cookie-list';
    
    category.cookies.forEach(cookieName => {
      const li = document.createElement('li');
      li.textContent = cookieName;
      list.appendChild(li);
    });
    
    content.appendChild(description);
    content.appendChild(benefit);
    if (category.cookies.length > 0) content.appendChild(list);

    div.appendChild(header);
    div.appendChild(content);

    header.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox' && !e.target.closest('.toggle-switch')) {
        const expanded = div.classList.toggle('expanded');
        header.setAttribute('aria-expanded', expanded.toString());
        
        if (expanded) {
          setTimeout(() => {
            div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 150);
        }
      }
    });

    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });

    // VIKTIGT: Ta bort auto-expand för necessary cookies
    // Alla kategorier börjar stängda nu

    return div;
  }

  function updateToggleStates() {
    document.querySelectorAll('input[data-category]').forEach(input => {
      input.checked = currentConsent[input.dataset.category];
    });
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
      handleCloseButton();
    }
  });

  // CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInFromRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInFromTop {
      from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Initialize
  console.log('GDPR: Initierar fixad cookie banner');
  
  // Lägg till CSS-fixes
  addCSSFixes();
  
  loadExistingConsent();
  updateCookieIconState(); // Sätt rätt tillstånd för ikonen
  await detectIncognitoAndShowBanner();
  await fetchCookieList();
  
  // Extra fix för knappar efter en kort delay
  setTimeout(() => {
    fixButtonText();
    updateCookieIconState(); // Uppdatera igen efter delay
    
    // Extra säkring för X-knappen
    const closeButton = document.getElementById('cookie-banner-close');
    if (closeButton) {
      closeButton.removeEventListener('click', handleCloseButton);
      closeButton.addEventListener('click', handleCloseButton);
    }
  }, 500);
});
