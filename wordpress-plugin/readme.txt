=== CortIQ Analytics ===
Contributors: cortiq
Tags: analytics, ai-tracking, heatmap, cookie-free, gdpr, chatgpt, session-recording
Requires at least: 5.6
Tested up to: 6.8
Stable tag: 5.1.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Analytics for the agentic web. Track AI agents, human visitors and Core Web Vitals — cookie-free and GDPR-compliant.

== Description ==

CortIQ Analytics gives you a complete picture of who visits your site: human visitors and AI agents alike. It combines cookie-free server-side analytics (no consent required) with optional enhanced tracking (heatmaps, session recording) that activates only after the visitor gives consent.

= What you can measure =

**AI agent traffic**
* Which AI agents visit your site: ChatGPT Browser, Perplexity Comet, Claude Browser, Gemini and others
* Which pages AI agents access and how often
* Citation tracking — when an LLM references your content
* AI agent conversion attribution — traffic and goals driven by AI referrals
* Browser type classification: Visual / Headless / Text-based

**Human visitor behaviour**
* Page views, sessions, bounce rate, time on site
* Traffic sources: organic, direct, referral, paid, social
* Click heatmaps — exact click positions per page and device type
* Scroll depth heatmaps — funnel showing how far visitors scroll (25 / 50 / 75 / 100%)
* Form analytics — field-level drop-off analysis
* Session recording — full replay of visitor interactions (with data masking for sensitive fields)
* User journey and navigation flow

**Conversion & testing**
* Goal tracking and conversion funnels
* A/B testing with statistical significance
* UTM campaign tracking

**Technical**
* Core Web Vitals (LCP, FID/INP, CLS)
* Device, browser and geographic breakdown
* Data Warehouse export (BigQuery, Snowflake, Redshift, PostgreSQL)

= Privacy & GDPR =

Cookie-free tracking runs by default with no cookies and no personal data stored in the browser. This is legal under GDPR legitimate interest (Art. 6.1.f) — no cookie banner required for this layer.

Enhanced tracking (heatmaps, sessions) activates only after the visitor consents via the built-in cookie banner. The banner implements:
* Granular categories (Necessary / Preferences / Statistics / Marketing)
* No pre-ticked boxes for non-essential categories
* Consent ID and timestamp logging
* Google Consent Mode v2 — wired automatically if GA4 is configured
* IP anonymisation enabled by default

All data is stored in the EU.

= Requirements =

* A CortIQ account — [sign up at cortiq.se](https://cortiq.se)
* Site ID from the CortIQ dashboard (Settings → Setup)
* Tracking ID (API key) from the CortIQ dashboard

== Installation ==

1. Upload the `cortiq-analytics` folder to `/wp-content/plugins/`
2. Activate the plugin via the Plugins menu in WordPress
3. Go to **Settings → CortIQ Analytics**
4. Enter your **Site ID** (UUID from CortIQ dashboard → Settings → Setup)
5. Enter your **Tracking ID** (API key from the same page)
6. Optionally enter your **GA4 Measurement ID** (e.g. `G-XXXXXXXXXX`)
7. Save. Tracking starts immediately.

The plugin loads the CortIQ tracking script in `<head>` and shows the cookie consent banner in the footer. Both can be disabled independently.

== Frequently Asked Questions ==

= Do I need a cookie banner? =

Not for the cookie-free layer. CortIQ's server-side analytics collect no personal data and require no consent. The built-in cookie banner is only needed if you want enhanced tracking (heatmaps, sessions) or Google Analytics.

= Does this work alongside Google Analytics? =

Yes. Enter your GA4 Measurement ID in the plugin settings. CortIQ wires Google Consent Mode v2 automatically — GA4 only fires after the visitor accepts analytics cookies.

= Where is my data stored? =

All data is stored in the EU (AWS eu-north-1 via Supabase).

= Does the plugin slow down my site? =

The tracking script is loaded with `defer` so it does not block rendering. Cookie-free tracking is server-side and adds no client-side weight beyond the script tag.

= Can I mask sensitive fields in session recordings? =

Yes. Add `data-cortiq-mask` to any input or element. The field content is replaced with asterisks in the recording. See the [GDPR guide](https://github.com/expandtalk/cortiq/blob/main/GDPR.md) for details.

== Changelog ==

= 5.1.0 =
* Unified single-file plugin — no class dependencies
* Full rebranding to CortIQ Analytics
* Improved settings page with live status indicators
* Legacy GA measurement ID migration (from pre-5.1 installs)

= 5.0.0 =
* AI agent detection: ChatGPT Browser, Perplexity Comet, Claude Browser
* Cookie-free server-side analytics
* GA4 server-side integration
* Agent-specific dashboards

= 4.2.0 =
* Google Site Kit integration
* Navigation sync

= 3.0.0 =
* Supabase backend integration
* Improved tracking with retry logic
