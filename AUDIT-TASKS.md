# CortIQ — Prioriterad åtgärdslista (audit 2026-07-06)

Sammanställd från sex perspektiv: säkerhet, juridik/GDPR, databas, UX, affär, agentic/AI.
Prioritet kalibrerad för nuläget (solo-projekt, ~1 användare):
**P0 = trasigt i produktion nu · P1 = blockerar riktiga kunder · P2 = skalning/härdning · P3 = polish.**

Tag-legend: `[SEC]` säkerhet · `[GDPR]` juridik · `[DB]` databas · `[UX]` användarupplevelse · `[BIZ]` affär · `[AI]` agentic.

---

## P0 — Trasigt i produktion (features returnerar fel/tom data nu)

**Status 2026-07-06 (verifierat mot kod + remote Supabase): P0-1 t.o.m. P0-8 är åtgärdade och utrullade i produktion. P0-5 hade en kvarvarande matchnings-bugg som nu också är fixad.**

- [x] **P0-1 `[AI]` AI-assistenten anropar en pensionerad modell.** ~~`ai-assistant/index.ts:493` använde `claude-sonnet-4-20250514`.~~ FIXAT: raden använder nu `claude-sonnet-5`; `ai-assistant` v3 deployad.
- [x] **P0-2 `[DB]` Hela attribution-pipelinen är död — join på kolumn som inte finns.** ~~`record-conversion` filtrerade `unified_visitors.session_id`.~~ FIXAT: `record-conversion` slår nu upp besökaren via `visitorId` (unified visitor UUID) med `first_session_id` som fallback; `record-conversion` v2 deployad.
- [x] **P0-3 `[DB]` Click-ID och konverteringar har inkompatibla join-nycklar.** ~~`record-conversion` fick bara `sessionId`.~~ FIXAT: `spa-tracking.js` skickar nu `visitorId: VISITOR_ID` till `record-conversion` (`spa-tracking.js:343`), så gclid-kontexten hittas.
- [x] **P0-4 `[DB][GDPR]` Data-retention-cron kraschar på första raden → ingen radering körs någonsin.** ~~`user_interactions` saknar `site_id`.~~ FIXAT: migration `20260706002239_fix_data_retention` (applicerad remote) scopar `user_interactions` via `tracking_sessions`, wrappar varje tabell i egen `exception`-block, och täcker nu även `conversion_events`, `unified_visitors`, `form_analytics`.
- [x] **P0-5 `[DB]` Conversion Goal Health filtrerar kolumn som inte finns.** ~~`useConversionGoalHealth.ts` räknade `tracking_sessions.created_at` (finns ej) och matchade mål på `element_selector` (sätts aldrig).~~ FIXAT i två steg: (1) nämnaren använder nu `started_at`; (2) mål matchas nu på `event_name === goal.name` (det `record-conversion` faktiskt skriver) med `element_selector` kvar som fallback. **OBS: kräver frontend-rebuild + deploy (Vercel).**
- [x] **P0-6 `[DB]` `campaign_performance` visar alltid 0 konverteringar.** ~~`aggregate_campaign_stats` joinar `conversion_events.session_id` som lämnades NULL.~~ FIXAT: `record-conversion` resolvar nu `tracking_sessions.id` från browser-session-strängen och sätter `conversion_events.session_id`.
- [x] **P0-7 `[AI]` MCP/agent-API är sannolikt onåbart.** ~~`mcp-server`/`public-api` saknades i `config.toml`.~~ FIXAT: båda har `verify_jwt = false` i `config.toml` och remote-funktionerna bekräftar `verify_jwt:false`.
- [x] **P0-8 `[UX]` Onboarding-wizarden är död kod; Overview-tabben är blank för nya användare.** ~~`OnboardingWizard.tsx` importerades ingenstans; `OverviewTab` gjorde `return null`.~~ FIXAT: `Dashboard.tsx:20-24` renderar `OnboardingWizard` när `sites.length === 0`; `OverviewTab.tsx` visar nu ett "No data yet"-empty-state.

---

## P1 — Blockerar riktiga kunder (cross-tenant, förfalskning, felaktig policy)

**Status 2026-07-06 (verifierat mot kod + remote): 12 av 13 åtgärdade. P1-1 och P1-9 hade kvarvarande luckor som nu fixats i denna session. P1-5 har en kvarvarande designfråga (plattformsnyckel-fallback) — se not.**

### Säkerhet
- [x] **P1-1 `[SEC][AI]` `ai-bot-tracker` — oautentiserad, ingen validering, cross-tenant write.** FIXAT: `siteId` valideras mot `sites` (rad 145-149), UA härleds från request-header (rad 159), rate limit finns. **Denna session:** rate limit var per-sajt (`aibot:${siteId}`) — la till en andra per-IP-gräns (`aibot-ip:${ip}`) så en källa inte kan rotera siteId och flöda många tenants. **Kräver `supabase functions deploy ai-bot-tracker`.**
- [x] **P1-2 `[SEC]` `record-conversion` — oautentiserad konverterings-injektion.** FIXAT: per-sajt rate limit (`conv:${siteId}`, 120/60s) + site-active-koll (rad 43-53).
- [x] **P1-3 `[SEC][GDPR]` `store-consent` — förfalskningsbara GDPR-consent-poster.** FIXAT: `site_id` existens-kollas mot `sites`, rate-limit (`consent:${site_id}`), och catch-blocket returnerar inte längre `error.stack`.
- [x] **P1-4 `[SEC]` SSRF i `form-detector`.** FIXAT: scheme-allowlist (http+https), avvisar privata/loopback/link-local-IP + DNS-rebinding-koll, 5s timeout + 2 MB storleksgräns.
- [x] **P1-5 `[SEC][AI]` `geo-analyze` — ingen ägarkontroll + plattformsnyckel-fallback + SSRF.** FIXAT: ägarkoll via RLS-scoped user-klient (rad 402-417) ✅, SSRF-block (`assertSafeUrl`, rad 429) ✅, och **plattforms-fallbacken borttagen** → BYOK-only, konsekvent med `ai-assistant`. Sajt utan företagsnyckel får full non-AI-audit (`citabilityAnalysis` blir null, ingen krasch). Ägaren kör den genom att lägga sin egen nyckel i `company_secrets` via BYOK-inställningen. Nya `ai_provider`/`ai_model`-kolumner (migration `ai_usage_and_budget`) framtidssäkrar för OpenRouter/annat provider-val. **Kräver `supabase functions deploy geo-analyze` + migration.**
- [x] **P1-6 `[SEC]` Kvarvarande `WITH CHECK (true)` INSERT-policies.** FIXAT: de fem tabellerna droppade sina anon/authenticated INSERT-policies i `20260603000001_restrict_anon_inserts.sql`; writes går via service-role edge functions. Kompletterande sweep i `restrict_anon_inserts_sweep` + `rls_hardening`.

### GDPR
- [x] **P1-7 `[GDPR]` Consent-bannern skriver aldrig server-side bevis.** FIXAT: `consent-banner.js` POSTar nu till `store-consent` vid varje accept/reject (`postConsent()`/`saveConsent()`), som skriver timestamp/version/anonymiserad IP/UA till `cookie_consents`.
- [x] **P1-8 `[GDPR]` Integritetspolicyn motsäger koden.** FIXAT: `Privacy.tsx` beskriver nu SHA-256-hashad e-post + gclid → Google Ads (US), HubSpot, Anthropic (US), har session replay-avsnitt (5A), processor-/sub-processor-lista (5B) och överföringsmekanism SCC + EU-US DPF (5C, Art. 46).
- [x] **P1-9 `[GDPR][DB]` Retention täcker inte de känsligaste tabellerna.** FIXAT: `run_data_retention()` (migration `fix_data_retention`) täcker nu `conversion_events`, `unified_visitors`, `form_analytics`. **Denna session:** konsoliderade den motstridiga manuella pathen — `data-retention/index.ts` gjorde en global 30-dagars-purge utan sajt-scoping; den delegerar nu till `run_data_retention()` (per-sajt, 730 default). **Kräver `supabase functions deploy data-retention`.**
- [x] **P1-10 `[GDPR]` `visitor-identification` gör fingerprinting utan server-side consent-koll.** FIXAT: slår upp `cookie_consents` server-side (rad 397-409); click-IDs skrivs bara när `serverMarketingConsent && clickIdConsentGiven`. Klient-booleanen ensam räcker inte längre.
- [x] **P1-11 `[GDPR]` Session replay maskerar inte skärmtext + oprocessade inspelningar raderas aldrig.** FIXAT: migration `session_replay_privacy` sätter `mask_all_text DEFAULT TRUE` (+ backfill), och `cleanup_expired_recordings()` raderar nu enbart på `expires_at` (kravet `processed=TRUE` borttaget).
- [x] **P1-12 `[GDPR]` Controller-identiteten är ofullständig.** FIXAT: `Privacy.tsx` anger nu Expandtalk Corporation AB, org.nr 559358-8824, adress, e-post, och controller/processor-roll (Art. 13).
- [x] **P1-13 `[GDPR]` Formulär-tracking körs utan consent-gate.** FIXAT: `form-tracking-script.js` gate:ar via `cortiqHasAnalyticsConsent()` och startar bara vid consent, annars väntar den på `siteConsentUpdated`-eventet.

---

## P2 — Skalning & härdning (innan volym / fler kunder)

**Status 2026-07-06 (verifierat mot kod + remote): P2-1/10/15 var redan gjorda. P2-4/5/12/13/14 fixade denna session (kräver migration `conversion_events_hardening` + funktionsdeploy). P2-11 kräver ditt beslut. Resten (P2-2/3/6/7/8-rest/9/16) kvarstår.**

- [x] **P2-1 `[DB]` `page_views` saknar index på `(site_id, viewed_at)`.** FIXAT: `idx_page_views_site_viewed` i migration `perf_indexes` (redan applicerad remote).
- [x] **P2-2 `[DB]` RLS re-evaluerar `auth.uid()` per rad på stora tabeller.** FIXAT + applicerat remote: migration `rls_initplan_wrap` återskapar SELECT-policyerna på `unified_visitors` och `conversion_events` med `(select auth.uid())` (InitPlan, en evaluering per query).
- [ ] **P2-3 `[DB]` Dashboard-hooks hämtar obegränsade rader och aggregerar i JS.** KVAR: `useAttributionGap`, `useLeadQualityPipeline`, `useConversionGoalHealth`, `useAIBotTracking` drar 7-30 dagars rådata utan `.limit()`. Flytta aggregering till SECURITY DEFINER-RPC:er/vyer.
- [x] **P2-4 `[DB]` Ingen dedup/idempotens på konverterings-ingest.** FIXAT: partiellt unikt index `uq_conversion_events_dedup (site_id, session_id, event_name)` (migration `conversion_events_hardening`); `record-conversion` behandlar 23505 som idempotent success.
- [x] **P2-5 `[DB]` `upload_status`-state machine saknar recovery.** FIXAT: `upload_claimed_at`-kolumn + `google-ads-quality-upload` reclaimar `uploading`-rader äldre än 30 min (eller utan claim-tid) till `pending` vid körstart. (`failed`-retry med räknare kan läggas senare.)
- [ ] **P2-6 `[SEC][GDPR][DB]` Fingerprint använder icke-krypto 32-bit-hash.** KVAR: `visitor-identification/index.ts:198-209` använder fortfarande 32-bit-hash (kommentaren säger "in production use crypto.subtle"). Byt till SHA-256 med per-sajt-salt.
- [ ] **P2-7 `[SEC]` BYOK Anthropic-nycklar lagras i klartext.** KVAR: `company_secrets.anthropic_api_key` är fortfarande `text`. Kryptera med pgsodium/Vault. (Browserexponering redan löst via service-role-only-tabellen.)
- [~] **P2-8 `[AI]` Ingen per-user rate limit på `ai-assistant`; upp till 5 Claude-anrop/tur + 100k-radsladdningar.** DELVIS: **månatligt kostnadstak infört** — `ai_usage`-tabell + `check_ai_budget()`/`record_ai_usage()` RPC:er (migration `ai_usage_and_budget`), enforce:at före anrop i både `ai-assistant` (429 vid tak) och `geo-analyze` (skippar AI-delen), token-usage loggas per anrop. **KVAR:** per-user rate limit (till skillnad från kostnadstak), pusha aggregering till SQL istället för `.limit(100000)` + JS-reduce, `cache_control` på stabila tools+system-prefix, höj `max_tokens` + hantera `stop_reason==='max_tokens'`.
- [x] **P2-9 `[AI]` Bot-taxonomin driftar mellan ingest och dashboard.** FIXAT: dashboarden om-klassificerar inte längre. `ai-bot-tracker` klassificerar en gång vid ingest och lagrar kategorin (`ai_bot_traffic.request_type`); `useAIBotTracking` bär nu med `category` per bot och `BotTrafficClassification` grupperar på den — de dubbla mönsterlistorna (`TRAINING_PATTERNS`/`AGENTIC_PATTERNS`) och override-hacket är borttagna. Enda källan är nu edge-registryt. (2026-uppdatering av själva registryt — Grok/DuckAssistBot/YouBot m.fl. — kvarstår som separat innehållsuppdatering i `AI_BOT_REGISTRY`.)
- [x] **P2-10 `[AI]` Träningscrawlers kan inte upptäckas via JS-pixeln.** REDAN DOKUMENTERAT: README + CLAUDE.md + llms-full.txt beskriver att training-crawler-detektering går via server-log/edge-ingest, inte pixeln.
- [ ] **P2-11 `[AI]` `google-ads-quality-upload` `adjustmentType`.** BESLUT KRÄVS (ej ändrat): koden använder `RESTATEMENT` med `restatementValue` baserat på lead-kvalitet mot en gclid-attribuerad konvertering — vilket är korrekt för *value-restatement*. `ENHANCEMENT` är för offline-lead-import (leaden ÄR konverteringen). Vilket är intentionen? Fel val skickar felaktig data till Google Ads. Verifiera mot din conversion-action-konfig.
- [x] **P2-12 `[SEC]` HubSpot-webhook.** FIXAT: konstant-tidsjämförelse (`timingSafeEqual`), v3-signaturstöd (HMAC-SHA256 + timestamp-replay-skydd, fallback v1), atomiskt radclaim (`.is('quality_classified_at', null)` på update), och test-pingen kräver nu ägar-autentisering istället för att avslöja sajt-existens.
- [x] **P2-13 `[DB]` `conversion_events` saknar foreign keys.** FIXAT: `conversion_events_site_id_fkey` (REFERENCES sites ON DELETE CASCADE) + `created_at NOT NULL` (migration `conversion_events_hardening`; orphan-rader rensas först).
- [x] **P2-14 `[GDPR]` `hashed_email` lagras oavsett marketing-consent.** FIXAT: `record-conversion` lagrar `hashed_email` bara när `consent === true` (samma gate som gclid).
- [x] **P2-15 `[UX]` Dashboard-IA:n är överväldigande (~44 destinationer).** REDAN GJORT: `DashboardTabs.tsx` grupperar i 5 dropdown-`NAV_GROUPS` + Overview + Settings (~7 toppnivå) med progressive disclosure.
- [x] **P2-16 `[UX]` Aktiv tabb är komponent-lokal state, inte i URL.** FIXAT: `DashboardTabs` läser/skriver `activeTab` via `useSearchParams` (`?tab=`), så deep-linking, refresh och back-knappen fungerar. Kräver frontend-rebuild + FTP-deploy.

---

## P3 — Polish & mognad

- [ ] **P3-1 `[SEC]` Wildcard-CORS på autentiserade funktioner.** Begränsa `Allow-Origin` till app-origin för `anthropic-key`, `ai-assistant`, `google-ads-quality-upload`.
- [ ] **P3-2 `[SEC]` DOM-XSS i `public/consent-banner.js`.** `cfg.policyUrl`/`cfg.company` in i `innerHTML` utan escaping. Escapa, validera URL-schema, använd textContent.
- [ ] **P3-3 `[AI]` BYOK-nyckel valideras inte live och saknar modell-allowlist.** Gör ett test-anrop mot Anthropic vid sparning; begränsa till tillåtna modell-ID:n.
- [ ] **P3-4 `[GDPR]` GPC/DNT fångas men respekteras inte.** `gpc_signal` lagras men suppar inte tracking. Behandla `navigator.globalPrivacyControl` som opt-out.
- [ ] **P3-5 `[UX]` Empty/loading/error-states i nya tabbar.** `AttributionTab`, `FormDiscoveryWidget`, HubSpot-wizarden gör `return null` utan förklaring. Lägg empty-states som förklarar featuren och länkar till setup.
- [ ] **P3-6 `[UX]` HubSpot-wizarden är inte återupptagbar.** State i `useState` tappas vid remount, tunn per-steg-validering. Persistera progress (site-rad/localStorage). Lägg även `htmlFor`/`id` på wizard-labels (a11y).
- [ ] **P3-7 `[UX]` Debug `console.log` i Dashboard render-path.** `Dashboard.tsx:20` loggar sajt-lista varje render. Ta bort/gate:a.
- [ ] **P3-8 `[BIZ][UX]` Differentieraren (AI-bot-klassificering) saknas i marknadsföringen.** `Features.tsx` och `Pricing.tsx` leder med commodity-features och nämner aldrig tre-kategori-modellen. Lägg "AI Bot Intelligence"-sektion högst upp.
- [ ] **P3-9 `[BIZ]` LICENSE är en stub, inte full AGPL-3.0-text.** Ersätt med officiell AGPL-3.0-text + Section-7-tillägg som appendix.
- [ ] **P3-10 `[BIZ]` Monetisering är bara DB-schema.** `stripe_customer_id`/`subscription_tier` finns men ingen billing-UI eller feature-gating. Lägg en lättviktig plan-gating-hook (även stub) nu.
- [ ] **P3-11 `[UX][BIZ]` Onboarding/wizard hårdkodar prod-URL:er (`cortiq.se`, supabase-ref).** Bryter self-hosting-storyn. Härled från `VITE_`-env-vars.
- [ ] **P3-12 `[UX]` Kvarvarande svenska i UI + kod.** CMP-bannern (`SiteCookieBanner.tsx`) och WP-plugin är hårdkodat svenska; svenska kommentarer i nya komponenter. Routa banner-copy via i18n med per-sajt-språk.
- [ ] **P3-13 `[BIZ]` Doc-drift.** README (62/51/60+) vs CLAUDE.md (66/55/64+) siffror; README-screenshots/integration-exempel är "coming soon". Reconcilera och lägg riktiga screenshots.
- [ ] **P3-14 `[AI]` `ai-assistant` litar på klient-levererad konversationshistorik.** Kan förfalskas, tappas vid reload, oauditbar. Persistera server-side keyed till user.
- [ ] **P3-15 `[DB]` Status-kolumner är fri text utan CHECK.** `lead_quality`, `visitor_type`, `event_type` → typos bryter lookups tyst. Lägg CHECK/enum. Konsolidera även dubbla UTM-migrationer.

---

## Positiva fynd (redan rätt gjort)
- `ai-assistant` grundstruktur: JWT-auth, ägarkoll via RLS, service-nyckel exponeras aldrig, tools hårt scope:ade till verifierad siteId.
- BYOK-design: nyckel write-only, returneras aldrig (bara `hasKey`+`last4`), `sk-ant-`-prefix valideras.
- Agent-readiness är ovanligt stark: riktig MCP-server (23 tools, hashad nyckel-auth, rate limits), `llms.txt`, `SKILL.md`, `cortiq-relay`, telemetri.
- Nyligen härdade migrationer (`rls_hardening`, `fix_rls_policies`, `company_secrets`) stängde de värsta cross-tenant-läsen och klartext-nyckel-i-browsern.
- Consent-mitigeringar: click-ID är consent-gated klient-side, IP host-zeroas, jurisdiktion fail-closed till `eu_strict`, `form-detector` fångar bara metadata (aldrig fältvärden).
- `first-party-proxy` har korrekt path-allowlist mot SSRF.

---

### Föreslagen ordning att beta av
1. **P0-1** (byt modell — 1 rad, återställer flaggskeppet)
2. **P0-2/P0-3/P0-6** (attribution-pipelinens join-nycklar — annars är hela conversion-storyn tyst trasig)
3. **P0-4** (retention-krasch — GDPR-retention körs annars aldrig)
4. **P0-5, P0-7, P0-8** (goal health, MCP-gate, onboarding)
5. Därefter P1 säkerhet + GDPR i klump innan första riktiga kund.
