<?php
/**
 * Plugin Name: CortIQ Analytics
 * Plugin URI: https://cortiq.se
 * Description: Analytics for the agentic web. Track AI agents (ChatGPT Browser, Perplexity, Claude, Gemini) and human visitors — cookie-free, GDPR-compliant, with heatmaps, session recording and A/B testing.
 * Version: 5.2.0
 * Author: CortIQ
 * Author URI: https://cortiq.se
 * Requires at least: 5.6
 * Tested up to: 6.8
 * Requires PHP: 7.4
 * License: GPL v2 or later
 * Text Domain: cortiq
 */

// Block direct access
if ( ! defined( 'ABSPATH' ) ) exit;

// Prevent double-loading
if ( defined( 'CORTIQ_LOADED' ) ) return;
define( 'CORTIQ_LOADED', true );

define( 'CORTIQ_VERSION',    '5.2.0' );
define( 'CORTIQ_OPTION_KEY', 'cortiq_options' );
define( 'CORTIQ_CDN',        'https://cortiq.se' );
// Supabase Edge Functions base — used for the GDPR consent ledger (store-consent).
define( 'CORTIQ_API',        'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1' );

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function cortiq_defaults() {
    return array(
        'site_id'               => '',   // UUID from CortIQ dashboard
        'tracking_id'           => '',   // tk_xxx (legacy, kept for reference)
        'ga4_id'                => '',   // Google Analytics 4 Measurement ID (G-XXXXXXXXXX)
        'tracking_enabled'      => true,
        'gdpr_enabled'          => true,
        'anonymize_ip'          => true,
        'excluded_roles'        => array( 'administrator' ),
    );
}

function cortiq_options() {
    $saved = get_option( CORTIQ_OPTION_KEY, array() );

    // Migrate legacy key from class-based plugin versions (< 5.1)
    if ( empty( $saved['ga4_id'] ) && ! empty( $saved['ga_measurement_id'] ) ) {
        $saved['ga4_id'] = $saved['ga_measurement_id'];
    }

    return wp_parse_args( $saved, cortiq_defaults() );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activation / Uninstall
// ─────────────────────────────────────────────────────────────────────────────

register_activation_hook( __FILE__, 'cortiq_activate' );
function cortiq_activate() {
    $existing = get_option( CORTIQ_OPTION_KEY, array() );

    // Migrate legacy ga_measurement_id → ga4_id (class-based plugin versions < 5.1)
    if ( empty( $existing['ga4_id'] ) && ! empty( $existing['ga_measurement_id'] ) ) {
        $existing['ga4_id'] = $existing['ga_measurement_id'];
        unset( $existing['ga_measurement_id'] );
    }

    update_option( CORTIQ_OPTION_KEY, wp_parse_args( $existing, cortiq_defaults() ) );
}

register_uninstall_hook( __FILE__, 'cortiq_uninstall' );
function cortiq_uninstall() {
    delete_option( CORTIQ_OPTION_KEY );
}

// ─────────────────────────────────────────────────────────────────────────────
// Frontend: enqueue tracking scripts
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'wp_enqueue_scripts', 'cortiq_enqueue' );
function cortiq_enqueue() {
    $opts = cortiq_options();

    if ( empty( $opts['tracking_enabled'] ) ) return;
    if ( empty( $opts['site_id'] ) ) return;

    // Skip excluded roles
    if ( is_user_logged_in() ) {
        $user  = wp_get_current_user();
        $roles = (array) $opts['excluded_roles'];
        if ( array_intersect( $roles, (array) $user->roles ) ) return;
    }

    // spa-tracking.js is the unified script:
    // Heatmaps · Sessions · AI Agent Detection · Bot Tracking · Citations · UTM/Paid Ads
    wp_enqueue_script(
        'cortiq-tracking',
        CORTIQ_CDN . '/spa-tracking.js',
        array(),
        CORTIQ_VERSION,
        false // load in <head>, defer added via filter below
    );
    add_filter( 'script_loader_tag', 'cortiq_add_script_attrs', 10, 2 );
}

function cortiq_add_script_attrs( $tag, $handle ) {
    if ( 'cortiq-tracking' !== $handle ) return $tag;
    $opts        = cortiq_options();
    $site_id     = esc_attr( $opts['site_id'] );
    $tracking_id = esc_attr( $opts['tracking_id'] );
    $attrs = ' data-site-id="' . $site_id . '"';
    if ( $tracking_id ) {
        $attrs .= ' data-api-key="' . $tracking_id . '"';
    }
    $tag = str_replace( ' src=', $attrs . ' defer src=', $tag );
    return $tag;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cookie consent banner
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'wp_footer', 'cortiq_cookie_banner', 100 );
function cortiq_cookie_banner() {
    $opts = cortiq_options();
    if ( empty( $opts['gdpr_enabled'] ) ) return;
    ?>
<style>
#cq-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;align-items:flex-end;justify-content:center;padding:0}
#cq-box{background:#1e1e2e;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;width:100%;max-width:680px;border-radius:12px 12px 0 0;border-top:1px solid #6366f1;box-shadow:0 -8px 40px rgba(0,0,0,.5);max-height:90vh;overflow-y:auto}
#cq-box h2{margin:0;font-size:16px;font-weight:700;color:#a5b4fc}
#cq-box p{margin:8px 0 0;font-size:13px;color:#94a3b8;line-height:1.5}
.cq-head{padding:20px 20px 12px}
.cq-cats{padding:0 20px}
.cq-cat{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-top:1px solid #2d2d45}
.cq-cat-info{flex:1}
.cq-cat-name{font-weight:600;font-size:13px;color:#e2e8f0}
.cq-cat-desc{font-size:12px;color:#64748b;margin-top:2px}
.cq-toggle{position:relative;width:40px;height:22px;flex-shrink:0;margin-top:1px}
.cq-toggle input{opacity:0;width:0;height:0;position:absolute}
.cq-slider{position:absolute;inset:0;border-radius:22px;background:#374151;cursor:pointer;transition:.2s}
.cq-slider:before{content:'';position:absolute;width:16px;height:16px;left:3px;top:3px;border-radius:50%;background:#fff;transition:.2s}
.cq-toggle input:checked+.cq-slider{background:#6366f1}
.cq-toggle input:checked+.cq-slider:before{transform:translateX(18px)}
.cq-toggle input:disabled+.cq-slider{opacity:.5;cursor:not-allowed}
.cq-details-toggle{display:flex;align-items:center;gap:6px;background:none;border:none;color:#6366f1;font-size:12px;cursor:pointer;padding:10px 20px 4px;font-family:inherit}
.cq-details{display:none;margin:0 20px 12px;padding:12px;background:#161625;border-radius:8px;font-size:12px;color:#64748b;border:1px solid #2d2d45}
.cq-details dt{color:#94a3b8;font-weight:600;margin-top:8px}
.cq-details dt:first-child{margin-top:0}
.cq-details dd{margin:2px 0 0;word-break:break-all;color:#6b7280}
.cq-btns{display:flex;flex-wrap:wrap;gap:8px;padding:16px 20px 20px;border-top:1px solid #2d2d45}
.cq-btn{flex:1;min-width:120px;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit}
.cq-btn-primary{background:#6366f1;color:#fff}
.cq-btn-primary:hover{background:#5558e8}
.cq-btn-secondary{background:#1e293b;color:#94a3b8;border:1px solid #374151}
.cq-btn-secondary:hover{color:#e2e8f0;border-color:#6366f1}
#cq-reopen{display:none;position:fixed;bottom:20px;left:20px;z-index:99997;width:44px;height:44px;border-radius:50%;border:none;background:#6366f1;color:#fff;cursor:pointer;font-size:20px;box-shadow:0 4px 12px rgba(99,102,241,.5);font-family:inherit}
</style>

<div id="cq-overlay">
  <div id="cq-box" role="dialog" aria-modal="true" aria-label="Cookie settings">
    <div class="cq-head">
      <h2>🍪 Cookie settings</h2>
      <p>We use cookies to analyse traffic, remember preferences and personalise content. Choose which categories you allow below.</p>
    </div>

    <div class="cq-cats">
      <div class="cq-cat">
        <div class="cq-cat-info">
          <div class="cq-cat-name">Necessary</div>
          <div class="cq-cat-desc">Required for the site to function. Cannot be disabled.</div>
        </div>
        <label class="cq-toggle"><input type="checkbox" id="cq-necessary" checked disabled><span class="cq-slider"></span></label>
      </div>
      <div class="cq-cat">
        <div class="cq-cat-info">
          <div class="cq-cat-name">Preferences</div>
          <div class="cq-cat-desc">Remembers settings like language, region and layout.</div>
        </div>
        <label class="cq-toggle"><input type="checkbox" id="cq-preferences"><span class="cq-slider"></span></label>
      </div>
      <div class="cq-cat">
        <div class="cq-cat-info">
          <div class="cq-cat-name">Statistics</div>
          <div class="cq-cat-desc">Helps us understand how visitors use the site (page views, heatmaps, session data).</div>
        </div>
        <label class="cq-toggle"><input type="checkbox" id="cq-analytics"><span class="cq-slider"></span></label>
      </div>
      <div class="cq-cat">
        <div class="cq-cat-info">
          <div class="cq-cat-name">Marketing</div>
          <div class="cq-cat-desc">Used to show relevant ads and measure ad campaign performance.</div>
        </div>
        <label class="cq-toggle"><input type="checkbox" id="cq-marketing"><span class="cq-slider"></span></label>
      </div>
    </div>

    <button class="cq-details-toggle" onclick="document.getElementById('cq-details').style.display=document.getElementById('cq-details').style.display==='block'?'none':'block';this.querySelector('span').textContent=document.getElementById('cq-details').style.display==='block'?'Hide details':'Show details'">
      ▸ <span>Show details</span>
    </button>
    <dl class="cq-details" id="cq-details"></dl>

    <div class="cq-btns">
      <button class="cq-btn cq-btn-primary" id="cq-reject">Only necessary</button>
      <button class="cq-btn cq-btn-secondary" id="cq-save">Save selection</button>
      <button class="cq-btn cq-btn-primary" id="cq-accept-all">Accept all</button>
    </div>
  </div>
</div>

<button id="cq-reopen" title="Cookie settings">🍪</button>

<script>
(function(){
  var CQ_API = '<?php echo esc_js( CORTIQ_API ); ?>';
  var CQ_SITE_ID = '<?php echo esc_js( $opts['site_id'] ); ?>';
  var CQ_TRACKING_ID = '<?php echo esc_js( $opts['tracking_id'] ); ?>';
  var KEY = 'site_cookie_consent';
  var overlay   = document.getElementById('cq-overlay');
  var chkPref   = document.getElementById('cq-preferences');
  var chkAnal   = document.getElementById('cq-analytics');
  var chkMark   = document.getElementById('cq-marketing');
  var details   = document.getElementById('cq-details');
  var reopen    = document.getElementById('cq-reopen');

  function genId(){
    var arr=new Uint8Array(33);
    (window.crypto||window.msCrypto).getRandomValues(arr);
    return btoa(String.fromCharCode.apply(null,arr)).replace(/[+/]/g,function(c){return c==='+'?'-':'_'}).substring(0,44)+'==';
  }

  function fmt(ts){
    var d=new Date(ts);
    return d.toLocaleDateString('sv-SE',{day:'numeric',month:'short',year:'numeric'})+
      ' - '+d.toLocaleTimeString('sv-SE')+' '+
      (d.toLocaleTimeString('en-US',{timeZoneName:'short'}).split(' ').pop()||'');
  }

  function save(pref,anal,mark){
    var c={
      necessary:true, preferences:pref, analytics:anal, marketing:mark,
      timestamp:Date.now(), consentId:genId(), policyVersion:POLICY_VERSION
    };
    localStorage.setItem(KEY,JSON.stringify(c));
    window.dispatchEvent(new CustomEvent('siteConsentUpdated',{detail:c}));
    // GDPR Art. 7: record server-side proof of consent (the source of truth). The
    // backend resolves the site by page domain, so this lands under the right site.
    try {
      fetch(CQ_API + '/store-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          site_id: CQ_SITE_ID || undefined,
          tracking_id: CQ_TRACKING_ID || undefined,
          session_id: c.consentId,
          page_url: location.href,
          consent_types: { necessary:true, analytics:anal, marketing:mark, preferences:pref },
          source: 'cookie_banner',
          gpc_signal: (navigator.globalPrivacyControl === true),
          policy_version: POLICY_VERSION,
          locale: (navigator.language || 'sv').substring(0,10)
        })
      }).catch(function(){});
    } catch(e){}
    overlay.style.display='none';
    reopen.style.display='block';
    showDetails(c);
  }

  function showDetails(c){
    if(!c) return;
    details.innerHTML=
      '<dt>Consent date</dt><dd>'+fmt(c.timestamp)+'</dd>'+
      '<dt>Consent ID</dt><dd>'+c.consentId+'</dd>'+
      '<dt>Categories</dt><dd>Necessary'+(c.preferences?', Preferences':'')+(c.analytics?', Statistics':'')+(c.marketing?', Marketing':'')+'</dd>';
  }

  document.getElementById('cq-accept-all').onclick=function(){ chkPref.checked=chkAnal.checked=chkMark.checked=true; save(true,true,true); };
  document.getElementById('cq-reject').onclick=function(){ chkPref.checked=chkAnal.checked=chkMark.checked=false; save(false,false,false); };
  document.getElementById('cq-save').onclick=function(){ save(chkPref.checked,chkAnal.checked,chkMark.checked); };
  reopen.onclick=function(){ overlay.style.display='flex'; reopen.style.display='none'; };

  var POLICY_VERSION = '1';
  var existing;
  try{ existing=JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  if(!existing || existing.policyVersion !== POLICY_VERSION){
    overlay.style.display='flex';
  } else {
    chkPref.checked=!!existing.preferences;
    chkAnal.checked=!!existing.analytics;
    chkMark.checked=!!existing.marketing;
    reopen.style.display='block';
    showDetails(existing);
  }
})();
</script>
    <?php
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Analytics 4
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'wp_head', 'cortiq_ga4_output', 1 );
function cortiq_ga4_output() {
    $opts = cortiq_options();
    if ( empty( $opts['tracking_enabled'] ) ) return;
    if ( empty( $opts['ga4_id'] ) ) return;

    if ( is_user_logged_in() ) {
        $user  = wp_get_current_user();
        $roles = (array) $opts['excluded_roles'];
        if ( array_intersect( $roles, (array) $user->roles ) ) return;
    }

    $ga4_id  = esc_js( $opts['ga4_id'] );
    $gdpr_on = ! empty( $opts['gdpr_enabled'] );
    ?>
<!-- Google Analytics 4 via CortIQ (Consent Mode v2) -->
<script>
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
<?php if ( $gdpr_on ) : ?>
// Default: deny until the cookie banner grants consent
gtag('consent','default',{
  analytics_storage:'denied',
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  wait_for_update:2000
});
// Listen for CortIQ banner consent event
window.addEventListener('siteConsentUpdated',function(e){
  var granted=e.detail&&e.detail.analytics?'granted':'denied';
  gtag('consent','update',{
    analytics_storage:granted,
    ad_storage:e.detail&&e.detail.marketing?'granted':'denied',
    ad_user_data:e.detail&&e.detail.marketing?'granted':'denied',
    ad_personalization:e.detail&&e.detail.marketing?'granted':'denied'
  });
});
// Also check localStorage on load (returning visitors who already consented)
(function(){
  try{
    var c=JSON.parse(localStorage.getItem('site_cookie_consent')||'null');
    if(c&&c.analytics){
      gtag('consent','update',{analytics_storage:'granted'});
    }
  }catch(e){}
})();
<?php endif; ?>
gtag('js',new Date());
gtag('config','<?php echo $ga4_id; ?>');
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo esc_attr( $opts['ga4_id'] ); ?>"></script>
    <?php
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: settings page
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'admin_menu', 'cortiq_admin_menu' );
function cortiq_admin_menu() {
    add_options_page(
        'CortIQ Analytics',
        'CortIQ Analytics',
        'manage_options',
        'cortiq',
        'cortiq_settings_page'
    );
}

add_action( 'admin_init', 'cortiq_register_settings' );
function cortiq_register_settings() {
    register_setting( 'cortiq_settings_group', CORTIQ_OPTION_KEY, array(
        'sanitize_callback' => 'cortiq_sanitize_options',
    ) );
}

function cortiq_sanitize_options( $input ) {
    $clean                     = cortiq_defaults();
    $clean['site_id']          = isset( $input['site_id'] )
        ? sanitize_text_field( $input['site_id'] ) : '';
    $clean['tracking_id']      = isset( $input['tracking_id'] )
        ? sanitize_text_field( $input['tracking_id'] ) : '';
    $clean['ga4_id']           = isset( $input['ga4_id'] )
        ? sanitize_text_field( $input['ga4_id'] ) : '';
    $clean['tracking_enabled'] = ! empty( $input['tracking_enabled'] );
    $clean['gdpr_enabled']     = ! empty( $input['gdpr_enabled'] );
    $clean['anonymize_ip']     = ! empty( $input['anonymize_ip'] );
    $clean['excluded_roles']   = array( 'administrator' );
    return $clean;
}

function cortiq_settings_page() {
    if ( ! current_user_can( 'manage_options' ) ) return;
    $opts = cortiq_options();
    ?>
    <div class="wrap">
        <h1 style="display:flex;align-items:center;gap:10px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            CortIQ Analytics
        </h1>

        <?php settings_errors( 'cortiq_settings_group' ); ?>

        <form method="post" action="options.php">
            <?php settings_fields( 'cortiq_settings_group' ); ?>

            <table class="form-table" role="presentation">

                <tr>
                    <th scope="row"><label for="cortiq_site_id">Site ID</label></th>
                    <td>
                        <input id="cortiq_site_id"
                               name="<?php echo CORTIQ_OPTION_KEY; ?>[site_id]"
                               type="text"
                               value="<?php echo esc_attr( $opts['site_id'] ); ?>"
                               class="regular-text"
                               placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        <p class="description">
                            UUID from <a href="https://cortiq.se/dashboard" target="_blank">CortIQ Dashboard</a>
                            → Settings → Setup. Used for <strong>AI tracking</strong> (bots, search, citations).
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><label for="cortiq_tracking_id">Tracking ID</label></th>
                    <td>
                        <input id="cortiq_tracking_id"
                               name="<?php echo CORTIQ_OPTION_KEY; ?>[tracking_id]"
                               type="text"
                               value="<?php echo esc_attr( $opts['tracking_id'] ); ?>"
                               class="regular-text"
                               placeholder="tk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                        <p class="description">
                            tk_xxx key from Dashboard → Settings → Setup. Used for
                            <strong>heatmaps, sessions and page views</strong>.
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><label for="cortiq_ga4_id">Google Analytics 4</label></th>
                    <td>
                        <input id="cortiq_ga4_id"
                               name="<?php echo CORTIQ_OPTION_KEY; ?>[ga4_id]"
                               type="text"
                               value="<?php echo esc_attr( $opts['ga4_id'] ); ?>"
                               class="regular-text"
                               placeholder="G-XXXXXXXXXX" />
                        <p class="description">
                            Your GA4 Measurement ID. Found in
                            <a href="https://analytics.google.com" target="_blank">Google Analytics</a>
                            → Admin → Data Streams → your stream → Measurement ID.
                            Leave empty to disable GA4.
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row">Tracking</th>
                    <td>
                        <label>
                            <input type="checkbox"
                                   name="<?php echo CORTIQ_OPTION_KEY; ?>[tracking_enabled]"
                                   value="1"
                                   <?php checked( ! empty( $opts['tracking_enabled'] ) ); ?> />
                            Enable tracking
                        </label>
                    </td>
                </tr>

                <tr>
                    <th scope="row">Privacy</th>
                    <td>
                        <label>
                            <input type="checkbox"
                                   name="<?php echo CORTIQ_OPTION_KEY; ?>[gdpr_enabled]"
                                   value="1"
                                   <?php checked( ! empty( $opts['gdpr_enabled'] ) ); ?> />
                            Show cookie consent banner (GDPR)
                        </label>
                        <p class="description">Uncheck if your theme or another plugin already handles cookie consent.</p>
                        <br>
                        <label>
                            <input type="checkbox"
                                   name="<?php echo CORTIQ_OPTION_KEY; ?>[anonymize_ip]"
                                   value="1"
                                   <?php checked( ! empty( $opts['anonymize_ip'] ) ); ?> />
                            Anonymize IP addresses
                        </label>
                    </td>
                </tr>

            </table>

            <?php submit_button( 'Save Settings' ); ?>
        </form>

        <hr>
        <h2>Status</h2>
        <table class="widefat" style="max-width:520px;">
            <tbody>
                <tr>
                    <td><strong>Version</strong></td>
                    <td><?php echo esc_html( CORTIQ_VERSION ); ?></td>
                </tr>
                <tr>
                    <td><strong>Site ID</strong></td>
                    <td>
                        <?php if ( ! empty( $opts['site_id'] ) ) : ?>
                            <span style="color:green">&#10003; Configured</span>
                            &nbsp;<code><?php echo esc_html( $opts['site_id'] ); ?></code>
                        <?php else : ?>
                            <span style="color:#d63638">&#10007; Not set</span>
                            <span style="color:#777"> — AI tracking disabled</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <td><strong>Tracking ID</strong></td>
                    <td>
                        <?php if ( ! empty( $opts['tracking_id'] ) ) : ?>
                            <span style="color:green">&#10003; Configured</span>
                            &nbsp;<code><?php echo esc_html( $opts['tracking_id'] ); ?></code>
                        <?php else : ?>
                            <span style="color:#d63638">&#10007; Not set</span>
                            <span style="color:#777"> — heatmaps/sessions disabled</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <td><strong>Google Analytics 4</strong></td>
                    <td>
                        <?php if ( ! empty( $opts['ga4_id'] ) ) : ?>
                            <span style="color:green">&#10003; Active</span>
                            &nbsp;<code><?php echo esc_html( $opts['ga4_id'] ); ?></code>
                        <?php else : ?>
                            <span style="color:#777">Not configured</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <td><strong>Tracking</strong></td>
                    <td>
                        <?php echo ! empty( $opts['tracking_enabled'] )
                            ? '<span style="color:green">&#10003; Active</span>'
                            : '<span style="color:gray">Paused</span>'; ?>
                    </td>
                </tr>
            </tbody>
        </table>

        <hr>
        <h2>Script loaded</h2>
        <table class="widefat" style="max-width:520px;">
            <thead><tr><th>Script</th><th>Covers</th><th>Status</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>spa-tracking.js</code></td>
                    <td>Heatmaps · Sessions · AI Agents · Bots · Citations · UTM</td>
                    <td>
                        <?php echo ! empty( $opts['site_id'] ) && ! empty( $opts['tracking_enabled'] )
                            ? '<span style="color:green">&#10003; Active</span>'
                            : '<span style="color:#d63638">Needs Site ID</span>'; ?>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <?php
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin notice: missing IDs
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'admin_notices', 'cortiq_admin_notice' );
function cortiq_admin_notice() {
    if ( ! current_user_can( 'manage_options' ) ) return;
    $screen = get_current_screen();
    if ( $screen && $screen->id === 'settings_page_cortiq' ) return;

    $opts = cortiq_options();
    if ( ! empty( $opts['site_id'] ) ) return;

    $url = admin_url( 'options-general.php?page=cortiq' );
    echo '<div class="notice notice-warning is-dismissible"><p>'
        . '<strong>CortIQ Analytics:</strong> '
        . 'Add your Site ID to enable tracking. '
        . '<a href="' . esc_url( $url ) . '">Go to settings &rarr;</a>'
        . '</p></div>';
}
