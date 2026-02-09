console.log('🍪 Enhanced Cookie Banner: Starting initialization...');

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🍪 Enhanced Cookie Banner: DOM loaded');
  
  // Elements
  const modal = document.getElementById('heatmap-cookie-modal');
  const backdrop = document.getElementById('cookie-modal-backdrop');
  const icon = document.getElementById('cookie-settings-icon');
  const acceptAllBtn = document.getElementById('accept-all-cookies');
  const declineBtn = document.getElementById('decline-cookies');
  const saveBtn = document.getElementById('save-cookies');
  const categoriesContainer = document.getElementById('cookie-categories');
  const readMoreToggle = document.getElementById('read-more-toggle');
  const readMoreContent = document.getElementById('read-more-content');

  console.log('🍪 Elements found:', {
    modal: !!modal,
    backdrop: !!backdrop,
    icon: !!icon,
    acceptAllBtn: !!acceptAllBtn,
    declineBtn: !!declineBtn
  });

  // Configuration
  const trackingScript = document.querySelector('script[data-tracking-id]');
  const siteId = trackingScript?.getAttribute('data-tracking-id') || 'default-site-id';
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const source = 'banner';
  const supabaseUrl = 'https://cxmkdtgfocgbfizawlwa.supabase.co';

  const cookieCategories = {
    necessary: {
      name: 'Nödvändiga cookies',
      description: 'Dessa cookies krävs för att webbplatsens grundläggande funktioner ska fungera och kan inte stängas av.',
      required: true,
      cookies: []
    },
    analytics: {
      name: 'Prestanda-cookies (analys)',
      description: 'Hjälper oss att förstå hur besökare interagerar med webbplatsen genom att samla in anonym statistik.',
      required: false,
      cookies: []
    },
    preferences: {
      name: 'Preferens-cookies',
      description: 'Kommer ihåg dina inställningar som språkval, region och anpassningar.',
      required: false,
      cookies: []
    },
    marketing: {
      name: 'Marknadsförings-cookies',
      description: 'Används för att visa relevanta annonser utifrån ditt beteende och dina intressen.',
      required: false,
      cookies: []
    },
    other: {
      name: 'Övriga cookies',
      description: 'Används för särskilda funktioner eller tjänster som inte passar i de andra kategorierna.',
      required: false,
      cookies: []
    }
  };

  let currentConsent = {
    necessary: true,
    analytics: true,
    preferences: false,
    marketing: false,
    other: false
  };

  function loadExistingConsent() {
    const consentCookie = getCookie('heatmap_consent');
    console.log('🍪 Loading existing consent:', consentCookie);
    if (consentCookie) {
      try {
        currentConsent = JSON.parse(consentCookie);
        console.log('🍪 Parsed consent:', currentConsent);
      } catch (e) {
        console.error('Failed to parse consent cookie:', e);
      }
    }
  }

  async function isIncognito() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.quota < 120000000;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function shouldShowBanner() {
    const hasConsent = !!getCookie('heatmap_consent');
    const incognito = await isIncognito();
    console.log('🍪 Should show banner?', { hasConsent, incognito });
    return !hasConsent || incognito;
  }

  function showModal() {
    console.log('🍪 Showing modal');
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'block';
    }
    if (backdrop) {
      backdrop.classList.add('active');
      backdrop.style.display = 'block';
    }
    updateToggleStates();
  }

  function closeModal() {
    console.log('🍪 Closing modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.style.display = 'none';
    }
  }

  // Event listeners
  if (icon) {
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('🍪 Cookie icon clicked');
      showModal();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }

  if (readMoreToggle && readMoreContent) {
    readMoreToggle.addEventListener('click', () => {
      readMoreContent.classList.toggle('active');
      readMoreToggle.textContent = readMoreContent.classList.contains('active') ? 'Läs mindre ▲' : 'Läs mer ▼';
    });
  }

  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', async () => {
      console.log('🍪 Accept all clicked');
      currentConsent = { necessary: true, analytics: true, preferences: true, marketing: true, other: true };
      await storeConsent(currentConsent);
      closeModal();
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', async () => {
      console.log('🍪 Decline clicked');
      currentConsent = { necessary: true, analytics: false, preferences: false, marketing: false, other: false };
      await storeConsent(currentConsent);
      closeModal();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      console.log('🍪 Save clicked');
      await storeConsent(currentConsent);
      closeModal();
    });
  }

  async function storeConsent(consentTypes) {
    console.log('🍪 Storing consent:', consentTypes);
    try {
      // Set cookies
      document.cookie = `heatmap_consent=${JSON.stringify(consentTypes)}; path=/; max-age=${365 * 24 * 60 * 60}`;
      
      if (consentTypes.analytics) {
        document.cookie = `heatmap_analytics=true; path=/; max-age=${365 * 24 * 60 * 60}`;
      }

      // Send to Supabase
      try {
        await fetch(`${supabaseUrl}/functions/v1/store-consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tracking_id: siteId, // Send as tracking_id, not site_id
            session_id: sessionId, 
            consent_types: consentTypes, 
            source,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            language: navigator.language
          })
        });
      } catch (err) {
        console.warn('🍪 Failed to send consent to Supabase:', err);
      }

      // Update Google Consent
      if (window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: consentTypes.marketing ? 'granted' : 'denied',
          analytics_storage: consentTypes.analytics ? 'granted' : 'denied',
          functionality_storage: consentTypes.preferences ? 'granted' : 'denied'
        });
      }

      // Dispatch event
      document.dispatchEvent(new CustomEvent('consentUpdated', { detail: consentTypes }));

      // Enable tracking if analytics allowed
      if (consentTypes.analytics && window.HeatmapAnalyticsTracker) {
        window.HeatmapAnalyticsTracker.consent(true);
      }

      console.log('🍪 Consent stored successfully');
    } catch (e) {
      console.error('🍪 Consent save error:', e);
    }
  }

  async function fetchCookieList() {
    try {
      const domain = window.location.hostname.replace(/^www\./, '');
      const response = await fetch(`${supabaseUrl}/functions/v1/supabase-detected-cookies?domain=${domain}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data?.cookies) {
        mapCookiesToCategories(data.cookies);
        if (cookieCategories.marketing.cookies.length === 0) {
          cookieCategories.marketing.cookies = ['_fbp', '_gcl_au'];
        }
      } else {
        useDefaultCookies();
      }
    } catch (err) {
      console.error('Error loading cookie data:', err);
      useDefaultCookies();
    }
    renderCategories();
  }

  function mapCookiesToCategories(apiCookies) {
    Object.keys(cookieCategories).forEach(key => { cookieCategories[key].cookies = []; });
    Object.entries(apiCookies).forEach(([categoryName, cookieList]) => {
      const map = {
        'Nödvändiga cookies': 'necessary',
        'Prestanda-cookies (analys)': 'analytics',
        'Marknadsförings-cookies': 'marketing',
        'Preferenser': 'preferences',
        'Övriga': 'other'
      };
      const key = map[categoryName] || categoryName;
      if (cookieCategories[key]) cookieCategories[key].cookies = cookieList || [];
    });
  }

  function useDefaultCookies() {
    cookieCategories.necessary.cookies = ['PHPSESSID', 'wordpress_*', 'wp-settings-*', 'wordpress_test_cookie'];
    cookieCategories.analytics.cookies = ['_ga', '_ga_*', '_gat', '_gid', 'heatmap_analytics'];
    cookieCategories.marketing.cookies = ['_fbp', '_gcl_au', 'fr'];
    cookieCategories.preferences.cookies = ['language', 'theme', 'wp-wpml_current_language'];
    cookieCategories.other.cookies = ['_hjIncludedInSessionSample'];
  }

  function renderCategories() {
    if (!categoriesContainer) return;
    categoriesContainer.innerHTML = '';
    let hasMarketingCookies = false;
    for (const [key, category] of Object.entries(cookieCategories)) {
      if (category.cookies.length === 0 && key !== 'necessary') continue;
      if (key === 'marketing' && category.cookies.length > 0) hasMarketingCookies = true;
      const categoryEl = createCategoryElement(key, category);
      categoriesContainer.appendChild(categoryEl);
    }
    const googleNotice = document.getElementById('google-notice');
    if (googleNotice) {
      googleNotice.setAttribute('role', 'region');
      googleNotice.setAttribute('aria-live', 'polite');
      googleNotice.style.display = hasMarketingCookies ? 'block' : 'none';
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
    count.textContent = `(${category.cookies.length})`;
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
    });
    const toggleSlider = document.createElement('span');
    toggleSlider.className = 'toggle-slider';
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(toggleSlider);
    toggleContainer.appendChild(toggleSwitch);

    header.appendChild(info);
    header.appendChild(toggleContainer);

    const content = document.createElement('div');
    content.className = 'cookie-category-content';
    const description = document.createElement('p');
    description.style.fontSize = '13px';
    description.style.color = '#666';
    description.style.marginBottom = '12px';
    description.textContent = category.description;
    const list = document.createElement('ul');
    list.className = 'cookie-list';
    category.cookies.forEach(cookieName => {
      const li = document.createElement('li');
      li.textContent = cookieName;
      list.appendChild(li);
    });
    content.appendChild(description);
    if (category.cookies.length > 0) content.appendChild(list);

    div.appendChild(header);
    div.appendChild(content);

    header.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        const expanded = div.classList.toggle('expanded');
        header.setAttribute('aria-expanded', expanded.toString());
      }
    });

    if (key === 'necessary') div.classList.add('expanded');

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
      closeModal();
    }
  });

  // Initialize
  loadExistingConsent();
  
  if (await shouldShowBanner()) {
    showModal();
  }
  
  await fetchCookieList();
  
  console.log('🍪 Enhanced Cookie Banner: Initialization complete');
});
