# CortIQ — GDPR & Privacy Compliance

CortIQ is designed to give you complete analytics coverage while staying within European data protection law. This document explains what data is collected, on what legal basis, and how to configure CortIQ for your use case.

---

## Two tracking modes

CortIQ operates in two modes that can run in parallel:

| Mode | Cookies | Consent required | Legal basis |
|------|---------|-----------------|-------------|
| **Cookie-free** | None | No | Legitimate interest (Art. 6.1.f GDPR) |
| **Enhanced** (heatmaps, sessions) | Yes | Yes | Consent (Art. 6.1.a GDPR) |

Cookie-free tracking is active by default and collects no personal data. Enhanced tracking activates only after a visitor grants consent via the cookie banner.

---

## Cookie-free tracking — what is collected

No cookies are set. No personal data is stored in the browser.

Data collected server-side:
- **Anonymised IP address** — last octet masked before storage (e.g. 192.168.1.0)
- **Page URL and referrer** — which pages were visited and from where
- **Device type** — mobile, tablet, or desktop
- **Browser family** — Chrome, Firefox, Safari, etc. (not version or fingerprint)
- **Viewport dimensions** — screen size category
- **AI agent classification** — whether the visitor is an AI browser (ChatGPT, Perplexity, Claude, Gemini) or a human

**Legal basis:** Legitimate interest (Art. 6.1.f GDPR). Aggregate analytics for site improvement with no personal identification possible.

**Consent required:** No. Cookie-free tracking may run without a cookie banner.

**Disclosure required:** Yes. Your privacy policy must describe this data collection. See the [Privacy Policy Template](#privacy-policy-template) below.

---

## Enhanced tracking — what is collected (after consent)

Activated when a visitor accepts the "Statistics" category in the cookie banner.

In addition to cookie-free data:
- **Session ID** — links page views within a single visit (expires on browser close)
- **Click positions** — x/y coordinates for heatmap generation
- **Scroll depth** — how far the visitor scrolled (25%, 50%, 75%, 100% milestones)
- **Form interactions** — which fields were filled, when the form was abandoned (not the content of the fields)
- **Session recording** — a replay of the user's interaction with the page

All session data is associated with a hashed visitor ID, not a name or email address.

**Legal basis:** Consent (Art. 6.1.a GDPR).

**Consent required:** Yes. Visitors must accept via the cookie banner before this data is collected.

---

## AI agent tracking

CortIQ detects AI browsers (ChatGPT Browser, Perplexity Comet, Claude Browser, Gemini, and others) by analysing the HTTP user-agent string and request patterns. This detection does not involve storing personal data — AI agents are not natural persons and GDPR does not apply to machine traffic.

---

## Data storage

- **Location:** EU (Supabase EU region, hosted on AWS eu-north-1)
- **Default retention:** 730 days, configurable per site
- **Encryption:** All data in transit via HTTPS/TLS. Data at rest encrypted by Supabase.
- **Access control:** Row-Level Security (RLS) on all database tables. Each company's data is isolated.

---

## Data sub-processors

| Processor | Role | Location | DPA |
|-----------|------|----------|-----|
| Supabase | Database, edge functions | EU (AWS eu-north-1) | [DPA](https://supabase.com/privacy) |
| Google (optional) | GA4 if configured | EU/US | [DPA](https://business.safety.google/adsprocessorterms/) |

CortIQ does not sell or share visitor data with third parties for advertising.

---

## Data Processing Agreement (DPA) for CortIQ customers

CortIQ acts as a **data processor** on behalf of site owners (data controllers) who embed the tracking script. Under GDPR Art. 28, a written Data Processing Agreement is required between CortIQ and each customer.

**What this means for you as a CortIQ customer:**
- CortIQ processes visitor data on your behalf and under your instructions
- You remain the data controller — you decide what is collected and for what purpose
- A DPA must be in place before you go live in production

**Standard contractual commitments CortIQ makes:**
- Process data only for the purposes specified by the customer
- Implement appropriate technical and organisational security measures
- Delete data on customer request within 30 days
- Not engage sub-processors without informing the customer
- Assist with Subject Access Requests where technically possible

> **Note:** A formal DPA template for customers is in preparation. Contact [daniel@expandtalk.se](mailto:daniel@expandtalk.se) to request one ahead of public availability.

---

## Visitor rights

CortIQ stores data under hashed visitor IDs, not names or email addresses. Because cookie-free data is not directly linked to an individual, most Subject Access Requests (SARs) cannot be fulfilled by CortIQ data alone.

For enhanced tracking (session recordings, heatmaps), a visitor can withdraw consent at any time via the cookie banner. Data collected before withdrawal is retained for the configured retention period.

Configure data deletion under **Settings → GDPR → Data Retention** in the CortIQ dashboard.

---

## Cookie banner configuration

The CortIQ cookie banner (included in the WordPress plugin and available as a standalone script) implements the following:

- Granular categories: Necessary / Preferences / Statistics / Marketing
- No pre-checked boxes for non-essential categories (compliant with CJEU Planet49 ruling)
- Consent ID and timestamp logged per user for audit trail
- Consent version tracking — banner re-shown if your policy version changes
- Google Consent Mode v2 wired automatically when GA4 is configured

---

## WordPress plugin — privacy settings

| Setting | Recommended value | Notes |
|---------|-------------------|-------|
| Show cookie banner | ✅ Enabled | Unless another CMP is already active |
| Anonymise IP | ✅ Enabled | Always recommended |
| Exclude administrators | ✅ Enabled | Avoids polluting analytics with admin traffic |

---

## Privacy Policy Template

Copy this section into your site's privacy policy. Replace `[YOUR COMPANY]` and `[CONTACT EMAIL]`.

---

### Analytics (CortIQ)

This website uses CortIQ Analytics to understand how visitors use the site.

**Cookie-free analytics (always active)**

We collect anonymised data without cookies: anonymised IP address, visited pages, referrer, device type and browser family. No personal data is stored in your browser. This processing is based on our legitimate interest in improving the website (Art. 6.1.f GDPR). No consent is required.

**Enhanced analytics (after consent)**

If you accept the Statistics category in our cookie banner, we also collect: session recordings, click positions (heatmaps) and form interaction data. This data is linked to a temporary session ID and expires when you close your browser. This processing is based on your consent (Art. 6.1.a GDPR). You can withdraw consent at any time via the cookie icon in the bottom corner.

**Data storage and retention**

All data is stored in the EU. We retain analytics data for [X] days. You have the right to request deletion by contacting [CONTACT EMAIL].

**Sub-processor:** CortIQ (Expandtalk AB), [https://cortiq.se](https://cortiq.se)

---

## Compliance checklist

- [ ] Privacy policy updated with the CortIQ analytics section above
- [ ] Cookie banner enabled (or existing CMP configured to dispatch `siteConsentUpdated` event)
- [ ] Data retention period reviewed and set in CortIQ dashboard
- [ ] GA4 server-side configured if using Google Analytics (avoids GA4 client-side cookies)
- [ ] Session recording: sensitive fields marked with `data-cortiq-mask`
- [ ] Supabase project in EU region confirmed
