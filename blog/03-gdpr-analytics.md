---
title: "GDPR Compliant Analytics: Complete Guide 2025"
description: "Build GDPR-compliant analytics without cookies. Learn server-side tracking, consent management, and privacy-first data handling."
author: "CortIQ Team"
date: "2025-02-09"
category: "Guides"
tags: ["GDPR", "analytics", "privacy", "compliance", "cookies"]
slug: "gdpr-compliant-analytics"
image: "/blog-images/gdpr-analytics.png"
imageAlt: "GDPR compliant analytics dashboard - privacy-first data"
readingTime: "10 min read"
---

# GDPR Compliant Analytics: Complete Guide 2025

GDPR compliance doesn't mean you can't have analytics. Learn how to build a fully compliant, cookie-free analytics system that respects user privacy while giving you the insights you need.

## The GDPR Challenge

The European Union's General Data Protection Regulation (GDPR) changed everything about web analytics. The challenge: **Get insights without violating user privacy.**

### The Traditional Problem

Most analytics platforms (including Google Analytics without proper setup) violate GDPR:

❌ **Cookies without explicit consent** - GDPR requires affirmative consent
❌ **Personal data processing** - IP addresses and tracking identifiers are personal data
❌ **Vague cookie policies** - Users don't understand what data is collected
❌ **Intrusive banners** - Cookie banners hurt user experience and conversions
❌ **Data processors not specified** - Users don't know who processes their data

### The CortIQ Solution

✅ **No cookies required** - Server-side tracking, no browser tracking
✅ **No personal data** - IP anonymization, no identifiers
✅ **Clear policies** - Users understand exactly what's measured
✅ **No banners** - Better UX, higher conversions
✅ **Transparent processing** - Clear data processor agreements

## How Server-Side Analytics Works

Instead of tracking in the browser (which requires cookies), CortIQ tracks on the server.

### Traditional (Browser-Based) Tracking

```
User Browser → Sets Cookie → Sends Tracking Data → Analytics Server
     ↓
 Problem: Requires Cookie Consent
```

### CortIQ (Server-Based) Tracking

```
User Request → Your Server → Analytics API → CortIQ Server
     ↓
 No Browser Tracking, No Cookies, No Consent Required
```

### Technical Flow

1. **User visits your website**
2. **Your server receives request**
3. **Your server sends event to CortIQ API**
4. **CortIQ processes and stores (anonymously)**
5. **Analytics available in dashboard**

### What Data Is Collected

**Collected**:
- Page URL and referrer
- Device type (mobile/desktop)
- General location (country)
- Session duration
- Custom events you define

**NOT Collected**:
- Cookies
- Personal identifiers
- Full IP address (anonymized)
- Behavioral tracking
- Browsing history

## Setting Up GDPR-Compliant Analytics

### Step 1: Implement Server-Side Tracking

#### Node.js/Express Implementation

```javascript
const express = require('express');
const https = require('https');

const app = express();

// Configuration
const CORTIQ_API_KEY = process.env.CORTIQ_API_KEY;
const SITE_ID = process.env.CORTIQ_SITE_ID;

// Helper function to send event to CortIQ
async function trackEvent(req, res, eventData) {
  const payload = {
    site_id: SITE_ID,
    event_type: eventData.type,
    page_url: req.path,
    referrer: req.get('Referer'),
    device_type: getDeviceType(req.get('User-Agent')),
    timestamp: new Date().toISOString(),
    metadata: eventData.metadata || {}
  };

  // Send to CortIQ API
  const options = {
    hostname: 'api.cortiq.se',
    port: 443,
    path: '/v1/track',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CORTIQ_API_KEY}`
    }
  };

  const request = https.request(options, (res) => {
    console.log(`CortIQ: Event tracked (${res.statusCode})`);
  });

  request.on('error', (error) => {
    console.error('CortIQ tracking error:', error);
  });

  request.write(JSON.stringify(payload));
  request.end();
}

// Track page views
app.use((req, res, next) => {
  trackEvent(req, res, {
    type: 'pageview',
    metadata: {
      page_title: 'Dynamic page title'
    }
  });
  next();
});

// Track conversions
app.post('/api/purchase', (req, res) => {
  trackEvent(req, res, {
    type: 'conversion',
    metadata: {
      conversion_type: 'purchase',
      value: req.body.amount
    }
  });

  res.json({ success: true });
});
```

### Step 2: Update Your Privacy Policy

Your privacy policy must include:

```markdown
## Analytics

We use CortIQ for website analytics. CortIQ uses server-side tracking,
which means:

- No cookies are set on your browser
- No personal data is collected
- Your IP address is anonymized
- Session data is automatically deleted after 30 days
- You can opt-out by [see below]

Data is processed in accordance with GDPR.
```

### Step 3: Add Opt-Out Option

Users should be able to opt-out:

#### Option 1: Do Not Track Header

```javascript
// In your server code
if (req.get('DNT') === '1') {
  // Skip tracking for this request
  next();
  return;
}
```

#### Option 2: Cookie-Based Opt-Out

```javascript
// Set opt-out cookie (no tracking)
app.get('/analytics/opt-out', (req, res) => {
  res.cookie('cortiq_opt_out', 'true', {
    maxAge: 30 * 365 * 24 * 60 * 60 * 1000, // 30 years
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });

  res.send('You have opted out of analytics tracking.');
});

// Check opt-out before tracking
app.use((req, res, next) => {
  if (req.cookies.cortiq_opt_out === 'true') {
    // Skip tracking
    next();
    return;
  }

  // Continue with tracking
  next();
});
```

#### Option 3: Website UI

Add to your privacy/settings page:

```html
<section id="analytics-settings">
  <h2>Analytics Preferences</h2>

  <label>
    <input type="checkbox" id="analytics-consent">
    Allow analytics tracking
  </label>

  <button onclick="updateAnalyticsPreference()">
    Save Preferences
  </button>
</section>

<script>
function updateAnalyticsPreference() {
  const allowed = document.getElementById('analytics-consent').checked;

  fetch('/api/analytics-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allowed })
  });
}
</script>
```

## Comparing Analytics Solutions

### Privacy Comparison

| Platform | Cookies | Personal Data | GDPR Compliant |
|----------|---------|---------------|----------------|
| **Google Analytics** | ✅ Yes | ✅ Processes IP | ⚠️ Conditional |
| **Matomo** | ✅ Yes | ⚠️ Optional | ✅ With config |
| **Plausible** | ❌ No | ❌ None | ✅ Yes |
| **CortIQ** | ❌ No | ❌ None | ✅ Yes |
| **Fathom** | ❌ No | ❌ None | ✅ Yes |

### Feature Comparison

| Feature | CortIQ | Plausible | Fathom | Matomo |
|---------|--------|-----------|--------|--------|
| AI Agent Tracking | ✅ | ❌ | ❌ | ❌ |
| GDPR Compliant | ✅ | ✅ | ✅ | ✅ |
| No Cookies | ✅ | ✅ | ✅ | ⚠️ |
| Heatmaps | ✅ | ❌ | ❌ | ✅ |
| Session Recording | ✅ | ❌ | ❌ | ⚠️ |
| WordPress Plugin | ✅ | ❌ | ⚠️ | ✅ |
| Data Warehouse | ✅ | ❌ | ❌ | ✅ |

## GDPR Compliance Checklist

Use this checklist to ensure compliance:

### Legal & Documentation
- [ ] Privacy policy updated with analytics details
- [ ] Data processing agreement (DPA) signed with provider
- [ ] Legal basis documented (legitimate interest or consent)
- [ ] Retention policy documented (e.g., 90 days)
- [ ] Data processor responsibilities listed

### Technical Implementation
- [ ] No cookies set for analytics
- [ ] IP addresses anonymized
- [ ] Personal data minimized
- [ ] Opt-out mechanism provided
- [ ] Do Not Track header respected
- [ ] Secure HTTPS only

### User Communication
- [ ] Clear privacy policy
- [ ] Analytics opt-out available
- [ ] Cookie policy updated (if applicable)
- [ ] Data retention explained
- [ ] Third-party processors listed

### Ongoing
- [ ] Regular privacy audits
- [ ] Staff training on GDPR
- [ ] Response procedure for data requests
- [ ] Incident reporting plan
- [ ] Regular updates as regulations change

## Rights You Must Respect

### Right to Access
Users can request what data you have about them:

```javascript
// Example: /api/user-data/{user_id}
app.get('/api/user-data/:userId', (req, res) => {
  const userData = getAnalyticsData(req.params.userId);
  res.json(userData);
});
```

### Right to Delete
Users can request deletion of their data:

```javascript
// Example: DELETE /api/user-data/{user_id}
app.delete('/api/user-data/:userId', (req, res) => {
  deleteUserData(req.params.userId);
  res.json({ success: true });
});
```

### Right to Portability
Users can request data in machine-readable format:

```javascript
// Example: /api/user-data/{user_id}/export
app.get('/api/user-data/:userId/export', (req, res) => {
  const data = getAnalyticsData(req.params.userId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="my-data.json"');
  res.send(JSON.stringify(data, null, 2));
});
```

## Common GDPR Mistakes to Avoid

### ❌ Mistake 1: Relying on Cookie Consent
Just because users click "Accept Cookies" doesn't mean you're GDPR compliant if:
- The cookie banner isn't clear enough
- Users can't easily opt-out
- You're processing personal data unnecessarily

### ❌ Mistake 2: Not Having DPA
Working with an analytics provider without a Data Processing Agreement (DPA) is illegal.

**Solution**: CortIQ provides signed DPA with all plans.

### ❌ Mistake 3: Mixing Analytics with Personal Data
Never combine analytics with CRM data without proper legal basis:

```javascript
// ❌ WRONG
trackEvent({
  user_email: 'john@example.com',  // Don't do this!
  purchase_amount: 100
});

// ✅ CORRECT
trackEvent({
  anonymous_id: 'abc123',  // Anonymized
  purchase_amount: 100
});
```

### ❌ Mistake 4: Not Respecting Do Not Track
Always check the DNT header:

```javascript
// ✅ CORRECT
if (req.get('DNT') === '1') {
  // Skip tracking
  return;
}
```

## Real-World Example: E-Commerce Site

### Before: Non-Compliant

```javascript
// ❌ Sets multiple tracking cookies
// ❌ Stores IP addresses
// ❌ No opt-out mechanism
// ❌ Privacy policy is vague
```

### After: GDPR Compliant

```javascript
// ✅ Server-side tracking only
// ✅ Anonymized IP addresses
// ✅ Clear opt-out option
// ✅ Detailed privacy policy
// ✅ Data retention: 90 days
// ✅ Data processing agreement signed

// Tracking implementation
app.post('/api/purchase', (req, res) => {
  if (req.cookies.cortiq_opt_out === 'true') {
    return res.json({ success: true });
  }

  // Track to CortIQ (no personal data)
  trackEvent(req, res, {
    type: 'purchase',
    metadata: {
      amount: req.body.amount,
      category: req.body.category
    }
  });

  res.json({ success: true });
});
```

## Getting Started with CortIQ

CortIQ is built for GDPR compliance from the ground up:

1. **[Read GDPR Guide](https://cortiq.se/gdpr-guide)** - Complete technical guide
2. **[Review DPA](https://cortiq.se/dpa)** - Download data processing agreement
3. **[Start Free Trial](https://cortiq.se/signup)** - 14 days, no credit card

---

## Related Articles

- [Cookie-Free Analytics Explained](/blog/cookie-free-analytics)
- [Privacy-First Website Design](/blog/privacy-first-design)
- [Data Retention and Deletion](/blog/data-retention)

**Have GDPR questions?** [Schedule a compliance review](https://cortiq.se/contact)
