# CortIQ - Tracking Integration Guide

## För Daniels sajter

### 1. Ekonom.biz
Single-page application tracking

**Installation:**
```html
<!-- I <head> eller före </body> -->
<script>
  window.wfaConfig = {
    companyId: '[COMPANY_ID_FRÅN_SETUP]',
    apiKey: '[API_KEY_FRÅN_SETUP]',
    apiUrl: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1',
    contentType: 'page',
    platform: 'ekonom-biz'
  };
</script>
<script src="https://cortiq.se/spa-tracking.js"></script>
```

**Tracking exempel:**
```html
<!-- Automatisk pageview tracking -->
<!-- Inget behöver göras, fungerar automatiskt! -->

<!-- Tracka viktiga knappar -->
<button data-wfa-track data-wfa-event="click" data-wfa-content-id="kontakt-cta">
  Kontakta oss
</button>

<!-- Tracka formulär som conversions -->
<form data-wfa-conversion data-wfa-content-id="offert-formulär">
  <input type="email" required>
  <button type="submit">Skicka</button>
</form>
```

---

### 2. AI Search Optimization
Single-page application tracking

**Installation:**
```html
<script>
  window.wfaConfig = {
    companyId: '[COMPANY_ID_FRÅN_SETUP]',
    apiKey: '[API_KEY_FRÅN_SETUP]',
    apiUrl: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1',
    contentType: 'page',
    platform: 'ai-search-opt'
  };
</script>
<script src="https://cortiq.se/spa-tracking.js"></script>
```

**AI-specific tracking:**
```javascript
// Tracka när användare optimerar content
WFATracker.track('click', 'ai-optimize-button', {
  optimization_type: 'title',
  platform: 'google'
});

// Tracka conversions (t.ex. export eller download)
WFATracker.trackConversion('export-optimized-content', {
  format: 'html',
  platform: 'tiktok'
});
```

---

### 3. Sentrisk
Integration för AI-genererat content tracking

**A. För Sentrisk's egen sajt:**
```html
<script>
  window.wfaConfig = {
    companyId: '[COMPANY_ID_FRÅN_SETUP]',
    apiKey: '[API_KEY_FRÅN_SETUP]',
    apiUrl: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1',
    contentType: 'page',
    platform: 'sentrisk'
  };
</script>
<script src="https://cortiq.se/spa-tracking.js"></script>
```

**B. För att tracka AI-genererat content (bilder, formulär, events):**

```javascript
// När användare genererar content i Sentrisk
async function trackGeneratedContent(contentId, contentType, platform) {
  const response = await fetch('https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/track-event', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer [SENTRISK_API_KEY]',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      company_id: '[SENTRISK_COMPANY_ID]',
      content_type: contentType, // 'image' | 'form' | 'event' | 'survey' | 'chatbot'
      content_id: contentId,
      event_type: 'view', // eller 'click', 'conversion', 'submission'
      platform: platform, // 'instagram' | 'youtube' | 'tiktok' | etc
      session_id: WFATracker.getSessionId(),
      metadata: {
        device_type: 'desktop',
        referrer: document.referrer
      }
    })
  });
  
  return response.json();
}

// Exempel: Tracka när AI-genererad bild visas
trackGeneratedContent('uuid-123', 'image', 'instagram');

// Exempel: Tracka när formulär submittas
trackGeneratedContent('uuid-456', 'form', 'web');
```

**C. Hämta analytics för content:**

```javascript
async function getContentAnalytics(contentId) {
  const response = await fetch(
    `https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/analytics-content/${COMPANY_ID}/${contentId}?from=2024-01-01&to=2024-12-31`,
    {
      headers: {
        'Authorization': 'Bearer [API_KEY]'
      }
    }
  );
  
  const data = await response.json();
  /*
  {
    content_id: "uuid",
    content_type: "image",
    metrics: {
      total_views: 1234,
      total_clicks: 89,
      total_conversions: 12,
      ctr: 7.21,
      conversion_rate: 13.48
    },
    timeline: [...],
    top_platforms: [...],
    recommendations: [...]
  }
  */
  return data;
}
```

---

## Setup-instruktioner

### Steg 1: Kör setup-script
Du måste köra scriptet `src/scripts/setup-companies.ts` EN GÅNG för att skapa companies och API-nycklar.

**Innan du kör scriptet:**
1. Hämta din SUPABASE_SERVICE_ROLE_KEY från: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/settings/api
2. Ersätt `YOUR_SERVICE_ROLE_KEY` i `setup-companies.ts`
3. Kör: `npx tsx src/scripts/setup-companies.ts`

Du får då:
- **Company ID** (UUID)
- **API Key** (för varje sajt)

### Steg 2: Integrera på sajterna
Använd Company ID och API Key från steg 1 i konfigurationen ovan.

### Steg 3: Publicera tracking-scriptet
Tracking-scriptet finns i `public/spa-tracking.js` och behöver vara tillgängligt på:
`https://cortiq.se/spa-tracking.js`

(Se DEPLOYMENT.md för instruktioner om hur du deployer till cortiq.se)

---

## Privacy & GDPR

Alla sajter är konfigurerade med:
- ✅ **Cookieless tracking** (browser fingerprint)
- ✅ **IP-anonymisering** aktiverad
- ✅ **Opt-out mode** (tracking tillåtet om inte användare säger nej)
- ✅ **730 dagars data retention**
- ✅ **User agent sparas EJ** (utom Sentrisk)
- ✅ **Referrer sparas** (för traffic source analysis)

---

## Rate Limits

Per company:
- **10,000 tracking events per timme**
- **1,000 analytics requests per timme**

---

## Support & Debugging

Öppna browser console för att se tracking-loggar:
```javascript
// Se session ID
console.log(WFATracker.getSessionId());

// Testa manuell tracking
WFATracker.trackView();
WFATracker.trackClick('test-content');
```

Logga in på Supabase för att se events:
https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/editor

Tabell: `tracking_events`
