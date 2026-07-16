# CortIQ — Prioriterad åtgärdslista

Sex perspektiv: säkerhet, juridik/GDPR, databas, UX, affär, agentic/AI.
Prioritet kalibrerad för nuläget (solo-projekt, ~1 användare):
**P0 = trasigt/serverar fel data i produktion nu · P1 = blockerar riktiga kunder · P2 = skalning/härdning · P3 = polish.**

Tag-legend: `[SEC]` säkerhet · `[GDPR]` juridik · `[DB]` databas · `[UX]` användarupplevelse · `[BIZ]` affär · `[AI]` agentic · `[VERIFY]` kräver verifiering mot remote.
Källa-tag: `(NY)` = fynd i 2026-07-15-auditen (kod tillkommen sedan 07-06) · `(KVAR)` = öppen sedan 2026-07-06-auditen.

> **Denna lista uppdaterad 2026-07-16** efter en ny sex-perspektiv-audit (2026-07-15) av all kod som tillkommit sedan baslinjen `4a5f6c5` (Cloudflare-sync, cookieless-läge, geo-gating, Consent Impact, Setup health check, tredjepartsdetektering, WP-plugin v5.3.x, tk_-credential). Den ursprungliga 2026-07-06-auditens P0/P1 är åtgärdade — se **Historik** längst ner.
>
> **Status-legend:** `[x]` = klar & utrullad · `[~]` = kod/dok klar, väntar på utrullning (deploy/rebuild+FTP) eller din åtgärd · `[ ]` = ej påbörjad.
>
> **Läge 2026-07-16:** `[x]` P0-1, P1-1 (deployade). `[~]` P1-2, P1-3, P1-4, P1-5, P1-6, P1-7, P2-2, P2-7, P2-9, P2-10 (kod/dok klar — se resp. post för vad som återstår att rulla ut). `[ ]` P0-2 (blockerad på `/mcp`) + P2-1/3/4/5/6/8/11/12/13/14 + alla P3.
>
> **Verifierat 2026-07-16 (avbruten session återupptagen):** alla 16 filändringar finns kvar i working tree och är intakta. `tsc --noEmit` går igenom rent (exit 0); `spa-tracking.js` syntaktiskt giltig; edge-function-diffarna matchar det som deployades. **⚠️ INGET ÄR COMMITTAT** — se **P0-3** nedan (deployade funktioner matchar ingen commit → git-drift). Fullt `npm run build` (SSR-prerender) ännu ej kört till slut på denna Windows-maskin; kör det innan FTP.

---

## P0 — Trasigt / serverar fel data i produktion nu

- [x] **P0-1 `[AI]` Agent-ytan klassificerar bottar från en död kolumn — flaggskeppsfeaturen levereras fel.** `(NY)` — **✅ DEPLOYAD 2026-07-15 (mcp-server + ai-assistant).** Båda funktionerna läser nu `request_type` (mappat till `category`, faktiskt returnerat i ai-assistant), `describe_schema` dokumenterar `request_type` + märker `bot_category` legacy.
  `mcp-server/index.ts:933,942,955` (+ `describe_schema:463`) och `ai-assistant/index.ts:415,419,425` läste `ai_bot_traffic.bot_category` — en legacy-kolumn som **default `'other'`** och som **ingenting skriver till** längre. Den riktiga 3-vägs-taxonomin (`training|agentic|citation`) skrivs av `ai-bot-tracker/index.ts:235` till **`request_type`**. Följd: MCP-verktyget `cortiq_ai_bot_analysis` returnerar `"other"` för *varje* bot, `describe_schema` styr `cortiq_execute_query`-agenter till fel kolumn, och ai-assistenten tappar bort träning/agentic/citation-dimensionen helt — medan dashboarden (som läser `request_type` via `get_ai_bot_tracking`) är korrekt. Kärndifferentiatorn serveras alltså trasig till den primära agent-ytan.
  **Fix:** selecta `request_type` i båda funktionerna och mappa till returfältet; uppdatera `describe_schema:463` att dokumentera `request_type` och märka `bot_category` legacy. Verifiera mot `BotTrafficClassification`-semantiken (unknown → citation).

- [ ] **P0-2 `[VERIFY]` Bekräfta att 2026-07-06-auditens utrullningar faktiskt gick ut.** `(NY)`
  Många fixar från förra auditen krävde `supabase functions deploy` + frontend-rebuild+FTP som du skulle köra manuellt (bl.a. `ai-bot-tracker`, `data-retention`, `visitor-identification`, `ai-assistant`, `store-consent`, `track-event`; frontend för P0-5 goal-health, P2-9, P2-16). **Om någon inte rullades ut är den fixen fortfarande mörk i produktion** trots att koden är rätt. Verifiera funktionsversioner + att `dist` på hosten är den senaste byggen. (Kräver Supabase-MCP-inloggning — de två MCP-servrarna behöver autentiseras: kör `/mcp`.)

- [~] **P0-3 `[SEC][BIZ]` Hela 2026-07-15-auditens arbete är OCOMMITTAT — deployad produktion matchar ingen commit (git-drift).** `(NY, 2026-07-16)` — **✅ COMMITTAT 2026-07-16 lokalt på branch `audit-2026-07-15-fixes` (8 commits, logiskt grupperade). Kvar: push + ev. PR/merge till `main`.**
  P0-1 + P1-1 är **live i produktion** (deployade från working tree 2026-07-15) men existerar bara som osparade ändringar i 16 filer. Ingenting är committat. Följd: en ren checkout, en omdeploy från git, eller en förlorad working tree **återställer produktionen** till den sårbara koden (död bot-kolumn + cross-tenant-bryggan) utan varning. Alla de `[~]`-kodfixar som väntar på frontend-deploy riskerar också gå förlorade. Detta är den enskilt viktigaste öppna åtgärden.
  **Fix:** committa arbetet (branch först — nuvarande gren är `main`), t.ex. `git checkout -b audit-2026-07-15-fixes`, granska diffen, committa i logiska grupper (edge-functions / cookieless-consent / docs-GDPR / install-snippets). Överväg push + PR. **Blockerar inget tekniskt men måste göras innan nästa checkout/deploy.** *(Kräver din bekräftelse — jag committar inte på `main` utan att du säger till.)*

---

## P1 — Blockerar riktiga kunder (cross-tenant, förfalskning, felaktig policy)

- [x] **P1-1 `[SEC]` Cross-tenant pageview/session-förfalskning via `track-event` → `ingest_pageview`-bryggan.** `(NY)` — **✅ DEPLOYAD 2026-07-15 (track-event).** Bryggan resolvar nu sajten via `resolve_site_by_domain`, hämtar `sites.user_id` och kör `ingest_pageview` endast om `user_id === company.id` (autentiserad tenant); annars skippas + loggas.
  `track-event/index.ts:224-241` + `pageview_bridge.sql:23-68`. Bryggan router:ade skrivningen enbart på URL:ens domän (`metadata.url`, klient-kontrollerad) via `SELECT id FROM sites WHERE _norm_host(domain)=_norm_host(p_url)` — **utan** att kolla att den upplösta sajten tillhör den autentiserade tenanten. En tenant som autentiserar med sin egen giltiga nyckel kan sätta `metadata.url` till en annan kunds domän och pumpa in upp till 10k förfalskade pageviews/timme i den kundens dashboard (rate limit är keyad på angriparens `company_id`). Migrationens egen kommentar erkänner antagandet "alla sajter tillhör en användare" — det bryts i samma stund kund #2 onboardas. Bara data-förorening (ingen läsning läcker), men det upphäver tenant-isolering på write.
  **Fix:** upplös sajt via domän, verifiera sedan att ägaren/företaget matchar credentialet innan `ingest_pageview` anropas; annars avvisa/droppa tyst.

- [~] **P1-2 `[GDPR]` "Cookieless / consent-exempt"-läget spelar in klick/scroll/heatmaps + konvertering utan samtycke — överskrider audience-measurement-undantaget.** `(NY)` — **KOD KLAR 2026-07-15 (val #1 aggregerad-only), kräver frontend-rebuild + FTP.** `spa-tracking.js`: nytt `hasInteractionConsent()` (utan cookieless-bypass) + `deferUntilInteractionConsent()`; klick/scroll/konvertering gate:ade och defer:ar tills consent även i cookieless; aggregerad `trackPageView` förblir banner-fri. `requireConsent=false` respekteras fortsatt (bakåtkompatibelt).
  `spa-tracking.js:387-389` (`hasAnalyticsConsent()` returnerar `true` villkorslöst i COOKIELESS), `:401-411` (scroll-gate förbikopplad), `:515-525` (`startAnalytics()` kör `setupClickTracking`/`setupScrollTracking`/`setupConversionTracking`). CNIL/EDPB-undantaget är smalt (aggregerade räkningar, populära sidor, referrer) och täcker **inte** heatmaps eller granulär klick/scroll-spårning. Ditt eget `docs/consent-banner-strategy.md:13-21` listar kriterierna korrekt — men implementationen kör utanför dem, och med geo-gating dessutom utan banner. Blir P0 i samma stund en kund slår på cookieless.
  **Fix:** i cookieless-läge begränsa till aggregerad pageview-räkning; starta inte klick/scroll/konvertering utan analytics-consent oavsett läge.

- [~] **P1-3 `[GDPR]` Publicerad integritetspolicy motsäger cookieless-implementationen.** `(NY)` — **KOD KLAR 2026-07-15, kräver frontend-rebuild + FTP + juridisk granskning av ordalydelsen.** `Privacy.tsx §3B`: nytt "Cookieless JavaScript audience measurement"-avsnitt (in-memory session-id, ingen fingerprint/cross-visit, laglig grund Art. 5.3 + 6.1.f) + explicit att beteendedata (klick/scroll/heatmap/konvertering) kräver consent i alla lägen — stämmer nu med §5.
  `Privacy.tsx:256-274` listar Session ID/Click data/Scroll depth/Heatmap som "Requires consent … Art. 6.1.a"; `:479-485` påstår att banner-free-läget inte gör fingerprinting; `:135-196` beskriver bara den *server-log*-baserade modellen. Cookieless är en **klient-side JS-beacon** som gör klick/scroll/heatmap/session banner-free — inget av det beskriver policyn. `PrivacyPolicy.tsx:59-63,89-92` (per-sajt-mallen) säger likaså att heatmaps är consent-baserade. Art. 13/14 (transparens) + 5(1)(a). Måste landa **samtidigt** som P1-2, annars är policyn bevisligt falsk.
  **Fix:** lägg ett avsnitt som korrekt beskriver cookieless JS-audience-measurement (vad, laglig grund, att det körs utan Statistics-toggeln) och reconcilera §5/§10.

- [~] **P1-4 `[GDPR]` Cloudflare är en oredovisad underleverantör + US-överföring.** `(NY)` — **DOK KLAR 2026-07-15, kräver att DU skickar 30-dagarsvarslet till kunder + juridisk granskning.** Cloudflare, Inc. (US, EU-US DPF) tillagd som underleverantör i `DPA.md §6`, `GDPR.md`, `Privacy.tsx §5B`; EU-only-påståendena i `DPA.md §7` + `Privacy.tsx §5C` reconcilerade (Cloudflare edge/geo som optional US-överföring). **OBS:** `DPA.md` lovar 30 dagars förhandsvarsel — skicka det innan Cloudflare aktiveras på kundsajter.
  `geo-check/index.ts:16` (läser `cf-ipcountry`, härlett ur besökarens IP), `cloudflare-ingest/index.ts:240-254` (lagrar UA, referrer, country, `ip_subnet`, `ray_id`), `cloudflare-analytics/index.ts:74-107` (drar per-land-data via Cloudflare GraphQL). **Saknas helt** i `DPA.md`, `GDPR.md`, `Privacy.tsx`, `PrivacyPolicy.tsx`. `DPA.md:89-97` listar bara Supabase/Google/AWS och **lovar 30 dagars förhandsvarsel** innan underleverantörslistan ändras; `DPA.md:103` + `Privacy.tsx:337-354` påstår EU-only-infrastruktur. Art. 28 + 44-46.
  **Fix:** lägg Cloudflare, Inc. i `DPA.md §6` (edge-analytics/geo, US, SCC), redovisa i `Privacy.tsx §5B/§5C`, och skicka 30-dagarsvarslet innan det aktiveras på kundsajter.

- [~] **P1-5 `[BIZ]` Install-snippeten regresserade till hårdkodade prod-URL:er → self-host-läcka.** `(NY, regression)` — **KOD KLAR 2026-07-15, kräver frontend-rebuild + FTP.** `InstallationGuide.tsx` + `SetupTab.tsx` (Headless + AEM) bygger nu `apiUrl` från `import.meta.env.VITE_SUPABASE_URL` och scriptet från `window.location.origin`.
  `InstallationGuide.tsx:52,59` (+ `SetupTab.tsx:129,136,183,189`). Snippeten som dashboarden delar ut hårdkodar nu `apiUrl: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1'` och `src="https://cortiq.se/spa-tracking.js"` (tidigare `window.location.origin`). För en uttalat self-hostbar produkt betyder det att varje self-hoster som kopierar dashboardens egen snippet skickar sina besökares data in i **original-projektets** Supabase och laddar script från `cortiq.se` — tyst dataläcka + trasig tracking på egen instans. Ersätter gamla P3-11.
  **Fix:** bygg `apiUrl` från `import.meta.env.VITE_SUPABASE_URL` och servera scriptet från `window.location.origin`. Samma i SetupTabs Headless/AEM-snippets.

- [~] **P1-6 `[UX][BIZ]` Tracking-mode har dubbel sanning — health-checken kan felaktigt intyga "consent-exempt" medan sajten fortfarande fingerprintar.** `(NY)` — **KOD KLAR 2026-07-15 (val: ärlig copy-fix), kräver frontend-rebuild + FTP.** `SetupHealthCheck.tsx` intygar inte längre compliance från enbart DB-toggeln: "Tracking mode (dashboard setting)" + consent-logg-raden säger nu explicit att det speglar dashboarden, att man måste verifiera att det installerade scriptet matchar, och att beteendedata kräver consent. **Full single-source (script/plugin läser `sites.tracking_mode` via ny endpoint) loggad som P2-uppföljning nedan (P2-14).**
  `SetupHealthCheck.tsx:42-62` + `CMPDashboard.tsx:87-96` läser `sites.tracking_mode` och deklarerar "Cookieless (consent-exempt, banner-free statistics)" + markerar GDPR-consent-loggen "na — Not needed". Men det faktiska script-beteendet styrs av en **separat** plugin-inställning (`cortiq-analytics.php:43,636`, default `full`). CMPDashboard erkänner det själv ("Make sure the tracking script sends the matching mode"). Följd: användaren slår på cookieless i dashboarden, health-checken blir grön och säger "compliant", men pluginen är kvar i `full` → scriptet fingerprintar fortfarande utan consent-logg. Dashboarden intygar aktivt compliance som kanske inte gäller — värsta sortens vilseledande för en GDPR-först-produkt.
  **Fix:** en enda källa till mode (servern pushar mode till scriptet / pluginen läser `sites.tracking_mode`), eller nedgradera texten till "konfigurerat läge (verifiera att scriptet matchar)" + varning vid mismatch.

- [~] **P1-7 `[SEC]` Läs-kapabel produktions-API-nyckel hårdkodad + incheckad i publikt repo.** `(NY)` — **✅ LÄCKAN NEUTRALISERAD (verifierat 2026-07-16): den läckta nyckeln `7wUAo/…` finns inte längre i `companies.api_key` — redan roterad ut, dvs. död.** Kvar: koden är env-baserad (`%VITE_CORTIQ_*%`), men self-tracking-snippet:et ligger under company `1174dce9…` ("Ekonom.biz") vars levande nyckel `dle…` är läs-kapabel → får inte publiceras i klient-side `index.html`. **✅ LÖST 2026-07-16 (Väg B):** self-tracking-blocket borttaget ur `index.html` (dogfooding avstängt, kommentar pekar på hur det återinförs säkert). Ingen kundnyckel exponeras; bygget är rent utan `%VITE_CORTIQ_*%`-platshållare. **Kvar (framtid, ej blockerande):** återinför dogfooding med en dedikerad cortiq.se-company + **ingest-only**-nyckel (inte en läs-kapabel account-key). **Djupare (P3):** dela nyckeln så den klient-exponerade bara kan ingesta. — Föregående status: `index.html` återställd till `%VITE_CORTIQ_TRACK_URL/COMPANY_ID/API_KEY%`-platshållare; `.env.example` rättad (TRACK_URL = bas-URL utan `/track-event`). **DU MÅSTE:** (1) **rotera** den läckta nyckeln `7wUAo/…` i Supabase (den är redan publik); (2) sätta `VITE_CORTIQ_*` i byggmiljön med en **ingest-only**-nyckel innan nästa build — annars skeppas platshållaren literalt och cortiq.se-tracking bryts. **Kvarstår (P3):** dela dubbla nyckeln så den klient-exponerade bara kan ingesta, inte läsa `analytics-content` (se P3-nedan). Not: `spa-tracking.js:20` har också en hårdkodad projekt-fallback-URL — ofarlig men kan env-styras.
  `index.html:90-98` (commit `98600e1`) checkar in `window.cortiqConfig.apiKey = '7wUAo/…='` i klartext — en tidigare commit tog explicit bort just detta ("rotated out — never hardcode"). Det är en `companies.api_key`, och den är **inte** bara ingest: `analytics-content/index.ts:45-73` (publik, `verify_jwt=false`) accepterar den som Bearer och returnerar `analytics_summary`. Vem som helst som läser repot (open-source) kan läsa CortIQ:s egen content-analytics och skriva events under kontot. Egen-tenant-scope, men en incheckad läs-nyckel i publikt repo är en äkta credential-läcka.
  **Fix:** **rotera nyckeln nu.** Återställ build-time-injektionen (`%VITE_CORTIQ_*%`). Djupare: samma nyckel dubblar som publik tracking-credential *och* läs-API-nyckel — dela dem så den klient-exponerade bara kan ingesta.

---

## P2 — Skalning & härdning (innan volym / fler kunder)

- [ ] **P2-1 `[SEC][DB]` `cloudflare-analytics` saknar ägarkoll.** `(NY)`
  `cloudflare-analytics/index.ts:55-105`. `verify_jwt=true` garanterar bara *någon* inloggad användare; funktionen laddar sajten på `id` under service-role utan `user_id`-filter. Vilken inloggad användare som helst kan posta `{site_id: <annan tenant>}` och trigga en Cloudflare-API-pull mot offrets zon + skriva i offrets `cloudflare_analytics` (ingen läsning returneras, RLS blockar). Cross-tenant write + bränner offrets CF-kvot. Fixa som `ai-assistant:623-631` gör det.

- [~] **P2-2 `[GDPR]` Cookieless konverterings-capture skickar hashad e-post utan samtycke.** `(NY)` — **KOD KLAR 2026-07-15 (löst ihop med P1-2), kräver frontend-rebuild + FTP.** `recordConversion` har nu `if (!hasInteractionConsent()) return;` + `setupConversionTracking` gate:ad — hashad e-post skickas aldrig utan consent, i något läge.
  `spa-tracking.js:523` (`setupConversionTracking` körs i cookieless `startAnalytics`), `:340-367` (`recordConversion` SHA-256-hashar formulär-e-post och POSTar oavsett consent). En SHA-256-hash är personuppgift (policyn medger det, `Privacy.tsx:326-332`) → ingen laglig grund i "consent-exempt"-läge. Opt-in via `data-wfa-conversion`, därav P2. **Fix:** gate:a `recordConversion` på marketing/analytics-consent även i cookieless.

- [ ] **P2-3 `[GDPR]` `cortiq_session_id` skrivs till sessionStorage före consent (full-läge).** `(NY)`
  `spa-tracking.js:156` (`getOrCreateSessionId()` körs vid load), `:54-65` (`sessionStorage.setItem` före consent-koll i non-cookieless). ePrivacy 5(3): att lagra en identifierare på enheten är consent-triggern, oberoende av senare analytics-gate. `Privacy.tsx:370-379` påstår motsatsen. **Fix:** skjut upp storage-skrivningen till consent, eller håll id:t i minne tills consent (som cookieless redan gör).

- [ ] **P2-4 `[GDPR]` `cloudflare_traffic` saknar retention/purge.** `(NY)`
  `cloudflare-ingest/index.ts:240-254` skriver per-request-rader (/24-IP + full UA + referrer + timestamp) men migration `20260707140000` definierar bara den aggregerade `cloudflare_analytics` — ingen TTL för row-level-tabellen. Art. 5(1)(e). `Privacy.tsx:434-439` lovar 7-30 dagars radering av logg-data. Ingest är fail-closed/dormant idag, därav P2. **Fix:** lägg retention för `cloudflare_traffic` innan Worker-ingesten aktiveras.

- [ ] **P2-5 `[GDPR]` Geo-gating är oredovisad i policyn och vilar på cookieless-undantaget.** `(NY)`
  `cortiq-analytics.php:495-503,759`. Mekaniken är i sig sund (fail-open visar bannern; full-läge väntar på `siteConsentUpdated` så ingen ofrivillig fingerprinting utanför EEA). Kvar: (1) att dölja bannern utanför EEA är bara försvarbart om tracken som fortsätter är genuint undantagen — vilket P1-2 bestrider för heatmaps; (2) geo-gating nämns inte i `Privacy.tsx`. **Fix:** knyt geo-gating till korrigerad cookieless-scope (P1-2) + en rad i policyn.

- [ ] **P2-6 `[AI]` `AI_BOT_REGISTRY` är stale för 2026.** `(NY)`
  `ai-bot-tracker/index.ts:21-55`. Saknar **YouBot** (listad som Citation Crawler i `CLAUDE.md`), **DuckAssistBot**, och de agentic-browsers produkten marknadsför vid namn — Perplexity **Comet**, **ChatGPT Atlas**, **Claude browser** (`llms.txt` toppar med dem). Följd: YouBot/DuckAssistBot faller till `GENERIC_BOT_PATTERN` → "Other Bot"; agentic-browsers skickar Chrome-lika UA utan bot-token → matchar inget → **räknas som vanlig människotrafik**, så "Agentic Browsers"-KPI:n under-räknar tyst. Reconcilera även `Google-Extended` (registry=`training` vs `CLAUDE.md`=citation). **Fix:** lägg signaturer för ovanstående.

- [~] **P2-7 `[AI]` `llms.txt` säger att CortIQ saknar en feature den har (scroll-heatmaps).** `(NY)` — **KOD KLAR 2026-07-15, kräver frontend-rebuild (kopieras till `dist`).** Scroll-depth-heatmaps flyttade till feature-listan i `llms.txt` + `llms-full.txt`; "does NOT offer" begränsad till spatiala attention/mouse-movement-overlays.
  `public/llms.txt:23` + `public/llms-full.txt:117` listar "Scroll heatmaps" under "What CortIQ does NOT offer" — men scroll-depth-heatmaps finns (`ScrollDepthChart.tsx`, dokumenterat i `CLAUDE.md`). `llms.txt` är just GEO-ytan AI-modeller läser → ChatGPT/Perplexity/Gemini kommer säga till prospekt att produkten inte kan scroll-analys, på exakt den AI-visibility-kanal produkten säljer. **Fix:** ta bort exkluderingen (eller nyansera till "spatial scroll heatmaps only") i båda + `dist`-kopiorna vid nästa bygge.

- [ ] **P2-8 `[AI]` Nya kapabiliteter är osynliga för agenter (MCP-ytan släpar).** `(NY)`
  `mcp-server/index.ts` (24-verktygslistan) + `SKILL.md`. Cloudflare-edge-bot-data (`cloudflare-analytics`, `bot_detections`), cookieless/`tracking_mode` och Consent Impact har **inget MCP-verktyg och ingen `describe_schema`-post**. En agent kan inte svara på "hur mycket bot-trafik blockade Cloudflare?" eller "vad är min consent-coverage-gap?" fastän dashboarden visar det. **Fix:** lägg läs-verktyg (`cortiq_cloudflare_bots`, `cortiq_consent_coverage`) eller minst exponera tabellerna i `describe_schema`; uppdatera `SKILL.md`.

- [~] **P2-9 `[UX]` Stale "Version 2.0 — Red theme"-kort på Setup-tabben.** `(NY)` — **KOD KLAR 2026-07-15, kräver frontend-rebuild + FTP.** Kortet omskrivet till WP-plugin v5.3.4 (cookieless, Consent Mode v2, geo-gating, i18n, GDPR-safe UX); "red theme"-raden borttagen.
  `SetupTab.tsx:254-303` visar ett "Latest updates - Version 2.0"-kort ("Red theme = Cookie management! Remove old versions first") medan pluginen är `5.3.4` (`readme.txt:6`) med i18n/Consent Mode v2/geo-gating. Vilseleder vid onboarding. **Fix:** ta bort/skriv om mot 5.3.x eller peka på changelog.

- [~] **P2-10 `[BIZ]` Kvarvarande svenska i engelska install-snippets.** `(NY, ersätter delvis gamla P3-12)` — **KOD KLAR 2026-07-15, kräver frontend-rebuild + FTP.** Alla svenska strängar i `SetupTab.tsx` (REST-API-kommentarer, AEM-kommentarer, Adobe-hybrid-texten) + `ExternalIntegrationsTab.tsx:52` översatta till engelska.
  `SetupTab.tsx:141,143,145,203,207,217-218,279` + `ExternalIntegrationsTab.tsx:52`: `// REST API för cookiefree analytics`, `X-API-Key: din-api-nyckel`, `För GDPR-kompatibel tracking`, `Developer Token (för Enhanced Conversions)` m.fl. Headless/AEM-prospekten (högsta värdesegmentet) ser halv-svensk kod → ser ofärdigt ut. **Fix:** översätt vid touch (CLAUDE.md UI-copy-policy).

- [ ] **P2-11 `[UX]` Vilseledande flaggskeppsstat + svensk sifferlokalisering i ConsentImpact.** `(NY)`
  `ConsentImpact.tsx:114-116` skriver `{100 - gaVisibilityPct}% more` — om GA4=40% blir det "CortIQ measures 60% more", men CortIQ mäter de saknade 60 procent-*enheterna* ≈ 150% mer än GA4:s 40. Understryker och läses som ett ratio det inte är — bryter "Verify-path / inga hallucinerade insikter"-principen. `:93` formaterar med `toLocaleString('sv-SE')` i engelskt UI. **Fix:** "GA4 misses ~60% of your traffic that CortIQ captures" (eller räkna verkligt ratio); `en`-locale.

- [ ] **P2-12 `[SEC]` BYOK Anthropic-nycklar lagras i klartext.** `(KVAR — rekommenderad defer)`
  `company_secrets.anthropic_api_key` är fortfarande `text`. Access-control är redan solid (service-role-only sedan förra auditen); residualrisken är bara klartext-at-rest. Vault/pgsodium-migration rör write- (`anthropic-key`) + read-vägarna (`ai-assistant`, `geo-analyze`) och riskerar bryta live BYOK — lågt värde/hög risk för ~1-användare, gör isolerat senare.

- [ ] **P2-13 `[AI]` `google-ads-quality-upload` `adjustmentType`.** `(KVAR — beslut krävs)`
  Koden använder `RESTATEMENT` (value-restatement mot en gclid-attribuerad konvertering). `ENHANCEMENT` är för offline-lead-import. Vilket är intentionen? Fel val skickar felaktig data till Google Ads — verifiera mot din conversion-action-konfig.

- [ ] **P2-14 `[UX][BIZ]` Full single-source för tracking-mode (uppföljning på P1-6).** `(NY)`
  P1-6 löstes med ärlig copy (dashboarden intygar inte längre compliance). Robustare vore att göra `sites.tracking_mode` till *enda* källa: lägg en lättviktig publik `get-site-config`-edge-funktion (returnerar `{ tracking_mode }` per site_id/domän) som `spa-tracking.js` + WP-pluginen läser vid init, i stället för den lokalt konfigurerade `config.cookieless`/plugin-inställningen. Kostar en nätverksrunda + ny publik yta — därav P2, inte P1. Alternativt: härled faktiskt läge från inkommande data (fingerprints/consent-rader) och visa mismatch-varning i dashboarden.

---

## P3 — Polish & mognad

- [ ] **P3-1 `[SEC]` `geo-check` litar på klient-satt `cf-ipcountry`.** `(NY)` `geo-check/index.ts:16-18`. En besökare kan skicka `cf-ipcountry: US` för att undertrycka sin egen banner. Self-scoped + fail-safe (unknown → in scope). Bekräfta att plattformen skriver över headern; annars är geo-gating enbart rådgivande.
- [ ] **P3-2 `[SEC]` `resolve_site_by_domain` är grantad till `anon`.** `(NY)` `20260706210000_resolve_site_by_domain.sql:10`. Anonym uppräkning domän→`site_id`. Site-ID är redan semi-publika, men revoka `anon`/`authenticated`, behåll `service_role`-only.
- [ ] **P3-3 `[AI]` `generate-kpi-insights` defaultar till off-convention `claude-sonnet-4-6`.** `(NY)` `generate-kpi-insights/index.ts:131`. Inte pensionerad, men avviker från `claude-sonnet-5`. Om `CLAUDE_MODEL` är osatt i prod körs tyst en äldre modell. Aligna default.
- [ ] **P3-4 `[AI]` `ai-assistant` litar på klient-levererad `history` (osaniterad).** `(NY, = gamla P3-14)` `ai-assistant/index.ts:676` (`history.slice(-10)`). `content` accepterar godtyckliga `ContentBlock[]` inkl. förfalskade `tool_use`/`tool_result` → klient kan injicera fabricerad analytics i modellens kontext. Egen-tenant-scope. Begränsa `history` till `{role, text}`, avvisa klient-tool-block. **Djupare:** persistera konversation server-side keyed till user (auditbarhet, överlever reload).
- [ ] **P3-5 `[AI]` Klient-side AI-referrer-map är stale.** `(NY)` `ai-tracking-unified.js:23-48`. `AI_PLATFORMS` saknar `grok.com`/`x.ai`, Comet, nyare Copilot-hosts → human-via-AI-attribution (`ai_search_traffic`) missar Grok/Comet. Uppdatera ihop med P2-6.
- [ ] **P3-6 `[UX]` AI-bot-differentiatorn saknas på de nya onboarding-ytorna.** `(NY)` `SetupHealthCheck.tsx`, `ConsentImpact.tsx` nämner aldrig Training/Agentic/Citation. Lägg en AI-crawler-rad på Cloudflare-kortet + ett health-check-item ("AI bot detection active").
- [ ] **P3-7 `[GDPR]` ConsentImpact märker alla pageviews "cookieless — no consent needed" oavsett sajtens läge.** `(NY)` `ConsentImpact.tsx:143-151`. För en `full`-sajt kommer de från consentade fingerprintade besökare → etiketten missrepresenterar grunden. Läs `selectedSite.tracking_mode`.
- [ ] **P3-8 `[DB]` `cloudflare-ingest` config vs kommentar-mismatch.** `(NY)` `config.toml` sätter `verify_jwt=false` men kommentaren säger "stays JWT-gated (dormant)". Handlern är fail-closed på `CLOUDFLARE_INGEST_SECRET` (503 om osatt), så ingen funktionell bugg — reconcilera kommentaren.
- [ ] **P3-9 `[SEC]` Wildcard-CORS på autentiserade funktioner.** `(KVAR)` Begränsa `Allow-Origin` till app-origin för `anthropic-key`, `ai-assistant`, `google-ads-quality-upload`.
- [ ] **P3-10 `[SEC]` DOM-XSS i `public/consent-banner.js`.** `(KVAR)` `cfg.policyUrl`/`cfg.company` in i `innerHTML` utan escaping. Escapa, validera URL-schema, använd `textContent`.
- [ ] **P3-11 `[AI]` BYOK-nyckel valideras inte live + ingen modell-allowlist.** `(KVAR)` Testanrop mot Anthropic vid sparning; begränsa till tillåtna modell-ID:n.
- [ ] **P3-12 `[GDPR]` GPC/DNT fångas men respekteras inte.** `(KVAR)` `gpc_signal` lagras men suppar inte tracking. Behandla `navigator.globalPrivacyControl` som opt-out.
- [ ] **P3-13 `[UX]` Empty/loading/error-states i äldre tabbar.** `(KVAR — nya komponenter nu OK)` `AttributionTab` + HubSpot-wizarden gör fortfarande `return null` utan förklaring. (De nya ConsentImpact/SetupHealthCheck/DetectedTools hanterar empty/loading — verifierat.)
- [ ] **P3-14 `[UX]` HubSpot-wizarden är inte återupptagbar + a11y.** `(KVAR)` State i `useState` tappas vid remount; tunn per-steg-validering; saknar `htmlFor`/`id` på labels. Persistera progress.
- [ ] **P3-15 `[UX]` Debug `console.log` i Dashboard render-path.** `(KVAR)` `Dashboard.tsx:20` loggar sajt-lista varje render. Ta bort/gate:a.
- [ ] **P3-16 `[BIZ]` Differentiatorn saknas i marknadsföringen.** `(KVAR)` `Features.tsx`/`Pricing.tsx` leder med commodity-features, nämner aldrig tre-kategori-modellen. Lägg "AI Bot Intelligence"-sektion högst upp.
- [ ] **P3-17 `[BIZ]` LICENSE är en stub, inte full AGPL-3.0-text.** `(KVAR)` Ersätt med officiell AGPL-3.0 + Section-7-tillägg.
- [ ] **P3-18 `[BIZ]` Monetisering är bara DB-schema.** `(KVAR)` `stripe_customer_id`/`subscription_tier` finns men ingen billing-UI/feature-gating. Lägg lättvikts-plan-gating-hook (även stub). *Not: Cloudflare-sync + consent-gap är premium-grade utan gating; `CLOUDFLARE_API_TOKEN` är dessutom projekt-globalt → kan inte säljas per-tenant förrän per-sajt-krypterade secrets finns.*
- [ ] **P3-19 `[UX]` Kvarvarande svenska i CMP-banner + WP-plugin.** `(KVAR — delvis åtgärdat)` WP-pluginen har nu i18n (sv/en/de/fr/pt). `SiteCookieBanner.tsx` + svenska kommentarer i nya komponenter kvarstår. Routa banner-copy via i18n per-sajt-språk.
- [ ] **P3-20 `[BIZ]` Doc-drift.** `(KVAR)` README (62/51/60+) vs CLAUDE.md (66/55/64+); README-screenshots/exempel är "coming soon". Reconcilera + riktiga screenshots.
- [ ] **P3-21 `[DB]` Status-kolumner är fri text utan CHECK.** `(KVAR)` `lead_quality`, `visitor_type`, `event_type` → typos bryter lookups tyst. Lägg CHECK/enum. Konsolidera dubbla UTM-migrationer.

---

## Kvar att göra (uppdaterad 2026-07-16)

**✅ Klart & deployat:** P0-1, P1-1. **✅ Verifierat 2026-07-16:** working tree intakt, `tsc --noEmit` rent, spa-tracking.js giltig.

**Väntar på DIN åtgärd:**
0. **P0-3 — COMMITTA arbetet (viktigast).** 16 filer, inkl. redan deployade P0-1/P1-1, ligger osparade. Branch från `main` först, committa, överväg PR. Utan detta kan en omdeploy från git återställa produktionen till sårbar kod. *(Jag committar inte utan din bekräftelse.)*
1. **Frontend rebuild + FTP** rullar ut P1-2, P1-3, P1-5, P1-6, P2-2, P2-7, P2-9, P2-10 (spa-tracking.js, Privacy.tsx, SetupTab, InstallationGuide, SetupHealthCheck, llms.txt/llms-full.txt). **✅ `npm run build` verifierat 2026-07-16 (38s klient + SSR + 11 prerenderade sidor). ✅ P1-7-blockeraren löst (Väg B):** self-tracking-blocket borttaget → inga `%VITE_CORTIQ_*%`-platshållare kvar, bygget är rent och deploybart. **Kvar:** bygg om (senaste build) → FTP:a `dist/`.
2. **P1-4** — skicka 30-dagarsvarslet om Cloudflare-underleverantören innan det aktiveras på kundsajter.
3. **P1-3** — juridisk granskning av det nya policy-avsnittets ordalydelse.
4. **P0-2** — kör `/mcp` så verifieras 07-06-deployerna mot remote.

**Ej påbörjat (nästa arbetsblock), föreslagen ordning:**
5. **P2-6** (bot-registret — Comet/Atlas/YouBot m.fl. räknas idag som människor; hänger ihop med nyss deployade P0-1) + **P3-5** (klient-side referrer-map, samma tema).
6. **P2-1** (cloudflare-analytics ägarkoll), **P2-3** (session-id före consent), **P2-4** (cloudflare_traffic-retention), **P2-5** (geo-gating i policy) — P2 säkerhet/GDPR före volym.
7. **P2-8** (MCP-ytan släpar), **P2-11** (ConsentImpact-stat), **P2-14** (full single-source tracking-mode).
8. **P2-13** (kräver ditt Google Ads-beslut), **P2-12** (BYOK-kryptering, rekommenderad defer).
9. P3 löpande.

---

## Positiva fynd (verifierat rätt i 2026-07-15-auditen)
- **Databas ren:** varje tabell/kolumn i den nya koden verifierad mot migrationerna — ingen upprepning av "join mot kolumn som inte finns". Nya `cloudflare_analytics` har RLS på, ägar-scopad SELECT, ingen anon-INSERT.
- **Modell-ID:er rena:** inga pensionerade modeller i aktiva anrop (`ai-assistant`=`claude-sonnet-5`, `geo-analyze`=`claude-haiku-4-5`). `web_vitals`-fixen höll.
- **`ai-assistant`-loopen solid:** `getUser()`-auth, RLS-scopad ägarkoll, service-nyckel exponeras aldrig, per-user rate limit + månatligt budgettak, `max_tokens`/`stop_reason` hanterat.
- **`visitor-identification`:** hård-blockar fingerprinting i cookieless server-side; click-ID gate:at på server-verifierat marketing-consent (klient-flagga bara rådgivande); SHA-256 per-sajt-saltat.
- **WP-plugin (595 rader):** Settings API med nonces, `manage_options`-gate, all output escapad, hex-validerad accentfärg, inga secrets lagrade, ingen custom AJAX/REST. Ren.
- **Consent Mode v2 (GA4):** korrekt deny-by-default med alla sex v2-signaler + region-list matchar geo-listan. **Reopen-nudge:** compliant mot EDPB dark-pattern-guidance (statisk pill, X sparar necessary-only, reject respekteras hela cooldownen).
- **`store-consent`:** giltig Art. 7-proof (riktigt beslut, anonymiserad IP, trunkerad UA, sajt-existens + rate limit).
- **PublicNavigation SSR-fix sund:** `mounted`-gate renderar identisk placeholder pre-hydration, ingen regression.

---

## Historik — Audit 2026-07-06 (LÖST)
Den ursprungliga sex-perspektiv-auditen: **P0-1..P0-8 och P1-1..P1-13 alla åtgärdade och utrullade 2026-07-06** (pensionerad AI-modell, död attribution-pipeline, retention-krasch, goal-health, MCP-gate, onboarding; + oautentiserade/oscopade ingest-endpoints, SSRF-guards, consent-proof, fingerprint-consent-gate, integritetspolicy-omskrivning, RLS-sweep). **P2:** 14/16 klara (aggregations-RPC:er, RLS InitPlan, dedup/FK, SHA-256-fingerprint, single bot-taxonomi, tab-i-URL, AI-kostnadstak); kvar → P2-12/P2-13 i listan ovan. Detaljer i git-historiken (`4a5f6c5`→`b085742`) och i projektminnet `cortiq-audit-2026-07.md`. **OBS:** flera av dessa fixar krävde manuell deploy — se **P0-2** ovan.
