=== Heatmap Analytics by Expandtalk.se ===
Contributors: expandtalk
Tags: agentic-analytics, ai-tracking, heatmap, cookiefree, serverside-analytics, gdpr, chatgpt-browser, perplexity
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 5.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

First on the market with Agentic Browser Analytics + Cookiefree Serverside Tracking. Track AI agents and eliminate cookie banners.

== Description ==

**Heatmap Analytics by Expandtalk.se** is the first on the market with dedicated **Agentic Browser Analytics** - track when AI agents like ChatGPT Browser, Perplexity Comet, and Claude Browser visit your website. Combined with **cookiefree serverside tracking**, you get 100% GDPR-compliant analytics without any cookie banners.

### 🤖 Agentic Browser Analytics (World First!)

* **Track AI Agents** - ChatGPT Browser, Perplexity Comet, Claude Browser and more
* **Agent-specific dashboards** - See how AI agents interact with your website
* **Structured data analysis** - Understand how well your site is prepared for the agentic web
* **Agent conversion attribution** - Measure conversions from AI-driven traffic
* **Future-proof** - Ready for when 10-15% of all traffic comes from bots within three years

### 🍪 Cookiefree Serverside Analytics

* **No cookie banners** - Eliminate cookie disruptions completely
* **100% GDPR-compliant** - Serverside tracking without personal data in browser
* **Better conversion** - No annoying banners reducing conversion rates
* **Complete data** - All the analytics you need without cookies
* **GA4 Server-Side** - Want to keep Google Analytics? We run it serverside

### 🔥 Traditional Analytics (Also Included)

* **Heatmap visualization** - Click, scroll and attention maps
* **Google Analytics 4 integration** - Combine with GA4 data
* **A/B Testing** - Built-in testing platform
* **Form Analytics** - Detailed form analysis
* **Real-time data** - Live tracking with batch optimization

### 🚀 Why Choose Us?

* **Unique features** - No one else has agentic browser tracking + cookiefree analytics
* **Competitive advantage** - Stay ahead of your competitors in the new agentic web
* **Expert support** - Personal help when you need it
* **GDPR expert** - We understand European data protection requirements perfectly

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/heatmap-analytics` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings → Heatmap Analytics for configuration
4. Enter your tracking ID from Expandtalk.se dashboard
5. Choose between cookiefree serverside or traditional tracking
6. Enable Agentic Browser Analytics to track AI agents
7. Configure Google Analytics integration (optional)

== Changelog ==

= 5.0.0 =
* NEW: Agentic Browser Analytics - first on the market!
* NEW: Track ChatGPT Browser, Perplexity Comet and Claude Browser
* NEW: Cookiefree Serverside Analytics - eliminate cookie banners completely
* NEW: GA4 Server-Side Integration capability
* Agent-specific dashboards and insights
* Structured data readiness scoring
* Agent conversion attribution
* Improved user experience without cookie banners
* 100% GDPR-compliant without cookies

= 4.2.0 =
* Google Site Kit integration
* TikTok Pixel integration
* Navigation sync improvements

= 3.0.0 =
* Proper Supabase integration
* Improved tracking with retry logic
* Advanced IP exclusion with CIDR support
* Sampling functionality
* Mobile tracking control



*****************


<!-- Add this to <head> BEFORE all other tracking scripts -->
<script src="/wp-content/plugins/heatmap-analytics/assets/gdpr-compliant-analytics-loader.js"></script>

<!-- Google Analytics and other scripts load AFTER -->



What the script does:

Automatically blocks Google Analytics and other tracking scripts
Implements Google Consent Mode v2 with correct default settings
Prevents cookies from being set before consent
Loads scripts only after user has given consent



Update your WordPress header (functions.php or theme):

phpfunction add_gdpr_scripts() {
    // GDPR loader FIRST
    wp_enqueue_script('gdpr-loader', 
        get_template_directory_uri() . '/js/gdpr-compliant-analytics-loader.js', 
        array(), 
        '1.0.0', 
        false // In head, not footer
    );
    
    // Google Analytics AFTER (will be blocked until consent)
    wp_enqueue_script('google-analytics', 
        'https://www.googletagmanager.com/gtag/js?id=YOUR-GA-ID', 
        array('gdpr-loader'), 
        null, 
        false
    );
}
add_action('wp_enqueue_scripts', 'add_gdpr_scripts', 5); // Priority 5 = early



4. Test that it works

Clear all cookies and reload the page
Open Developer Tools → Network tab
Verify that:

Google Analytics scripts have type="text/blocked"
No _ga cookies are set
Console shows "Blocked script: google-analytics.com"


Accept analytics in cookie banner
See that scripts load and cookies are set

This follows GDPR 100% because:

✅ No tracking cookies before consent
✅ Google Consent Mode v2 implemented
✅ User has full control
✅ Clear cookie categorization
RetryClaude can make mistakes. Please double-check responses.



