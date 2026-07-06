# CortIQ — Prioriterad åtgärdslista (audit 2026-07-06)

Sammanställd från sex perspektiv: säkerhet, juridik/GDPR, databas, UX, affär, agentic/AI.
Prioritet kalibrerad för nuläget (solo-projekt, ~1 användare):
**P0 = trasigt i produktion nu · P1 = blockerar riktiga kunder · P2 = skalning/härdning · P3 = polish.**

Tag-legend: `[SEC]` säkerhet · `[GDPR]` juridik · `[DB]` databas · `[UX]` användarupplevelse · `[BIZ]` affär · `[AI]` agentic.

---

## P0 — Trasigt i produktion (features returnerar fel/tom data nu)

- [ ] **P0-1 `[AI]` AI-assistenten anropar en pensionerad modell.** `supabase/functions/ai-assistant/index.ts:493` använder `claude-sonnet-4-20250514`, som pensionerades 2026-06-15 → 404 på varje anrop → flaggskeppsfunktionen ger alltid 500. Byt till `claude-sonnet-5` (släpp sampling-params, adaptive thinking på) eller `claude-opus-4-8`.
- [ ] **P0-2 `[DB]` Hela attribution-pipelinen är död — join på kolumn som inte finns.** `record-conversion/index.ts:48-55` filtrerar `unified_visitors.session_id`, men den kolumnen finns inte (bara `first_session_id`). → `gclid` blir alltid null → varje konvertering skrivs `skipped_no_gclid` → inget når Google Ads. Fixa genom att joina på `visitor_fingerprint` (skicka från browsern) eller lägg till + populera `session_id`.
- [ ] **P0-3 `[DB]` Click-ID och konverteringar har inkompatibla join-nycklar.** Click-IDs lagras per fingerprint på `unified_visitors`; `record-conversion` får bara `sessionId`, aldrig fingerprint. Även efter P0-2 kan en återkommande besökare aldrig matchas. Persistera resolved `visitor_id`/fingerprint i browsern efter identifiering och skicka till `record-conversion`.
- [ ] **P0-4 `[DB][GDPR]` Data-retention-cron kraschar på första raden → ingen radering körs någonsin.** `20260401000000_data_retention_cron.sql:31` gör `delete from user_interactions where site_id=...` men `user_interactions` saknar `site_id` → hela transaktionen rullas tillbaka → 730-dagars GDPR-retention gör i praktiken ingenting, tabeller växer obegränsat. Radera via `session_id IN (...)` och wrappa varje tabell separat så en miss inte stoppar resten.
- [ ] **P0-5 `[DB]` Conversion Goal Health filtrerar kolumn som inte finns.** `useConversionGoalHealth.ts:42-46` räknar `tracking_sessions` på `created_at`, men kolumnen heter `started_at` → nämnaren faller till 1 → nästan alla mål flaggas falskt som `fires_too_often`. Dessutom matchas mål på `element_selector` som `record-conversion` aldrig sätter. Använd `started_at`; matcha mål via `form_registry`.
- [ ] **P0-6 `[DB]` `campaign_performance` visar alltid 0 konverteringar.** `aggregate_campaign_stats` (`20260209121000_utm_tracking.sql:82`) joinar `conversion_events.session_id = s.id`, men `record-conversion` lämnar `session_id` NULL och lägger id:t i `form_data.tracking_session_id`. Populera `conversion_events.session_id` eller joina på form_data-nyckeln.
- [ ] **P0-7 `[AI]` MCP/agent-API är sannolikt onåbart.** `mcp-server` (och `public-api`) autentiserar med egen CortIQ-API-nyckel men saknas i `config.toml` → `verify_jwt` defaultar till `true` → Supabase-gateway avvisar alla anrop med CortIQ-nyckel innan funktionen körs. SKILL.md marknadsför endpointen till agenter. Lägg till `[functions.mcp-server] verify_jwt = false` (och `public-api`). Verifiera mot deployad dashboard-inställning.
- [ ] **P0-8 `[UX]` Onboarding-wizarden är död kod; Overview-tabben är blank för nya användare.** `OnboardingWizard.tsx` importeras ingenstans; nya användare hamnar i bar empty-state. `OverviewTab.tsx:25` gör `if (!analytics) return null;` → helt vit sida i det ögonblick churn-risken är högst. Rendera wizarden från `Dashboard.tsx` när användaren har 0 sajter; ersätt `return null` med "väntar på första träff"-state.

---

## P1 — Blockerar riktiga kunder (cross-tenant, förfalskning, felaktig policy)

### Säkerhet
- [ ] **P1-1 `[SEC][AI]` `ai-bot-tracker` — oautentiserad, ingen validering, cross-tenant write.** `verify_jwt=false`, service-role, skriver `siteId` från body utan att kontrollera att sajten finns/ägs; UA läses från body (`userAgent`) inte header → vem som helst kan injicera falsk bot-/citation-trafik i valfri tenant. Ingen rate limiting. Validera `siteId` mot `sites`, härled UA från request-header, lägg per-IP rate limit (kopiera mönstret från `visitor-identification`).
- [ ] **P1-2 `[SEC]` `record-conversion` — oautentiserad konverterings-injektion.** Vem som helst kan skapa `conversion_events` för valfri aktiv sajt, ingen rate limit. Lägg per-sajt rate limit + verifiera att `sessionId` motsvarar en färsk besökarrad.
- [ ] **P1-3 `[SEC][GDPR]` `store-consent` — förfalskningsbara GDPR-consent-poster.** Accepterar valfritt `site_id` (bara UUID-regex), ingen existens-/ägarkoll → vem som helst kan fabricera/skriva över de consent-bevis produkten säljer. Läcker även `error.stack`. Validera site_id mot `sites`, rate-limita, sluta returnera stack.
- [ ] **P1-4 `[SEC]` SSRF i `form-detector`.** `index.ts:43-54` hämtar caller-angiven `url` server-side utan schema/IP-validering → kan nå metadata-endpoints/interna tjänster, ohägnad responsstorlek. Allowlista https, avvisa privata/loopback/link-local-IP, sätt timeout + storleksgräns.
- [ ] **P1-5 `[SEC][AI]` `geo-analyze` — ingen ägarkontroll + plattformsnyckel-fallback + SSRF.** Kör med service-role utan att verifiera att caller äger `siteId`, faller tillbaka på plattformens `ANTHROPIC_API_KEY`, och `fetch()`ar caller-angiven URL. Verifiera ägarskap via RLS-scoped user-klient, blockera privata URL-intervall, kräv BYOK för Claude-anropet.
- [ ] **P1-6 `[SEC]` Kvarvarande `WITH CHECK (true)` INSERT-policies.** `page_views`, `form_analytics`, `form_field_analytics`, `form_sessions`, `form_field_interactions` m.fl. tillåter anon/authenticated att skriva rader i valfri tenant direkt via PostgREST. Ersätt med service-role-only writes (edge functions har redan service-nyckeln), enligt `rls_hardening`-mönstret.

### GDPR
- [ ] **P1-7 `[GDPR]` Consent-bannern skriver aldrig server-side bevis.** `public/consent-banner.js:122-138` sparar bara `localStorage`; `store-consent` (enda stället som loggar timestamp/version/IP/UA) anropas aldrig. Art. 7(1) kräver att kunna *bevisa* samtycke. Låt bannern POSTa till `store-consent` vid varje accept/reject och behandla den raden som källa.
- [ ] **P1-8 `[GDPR]` Integritetspolicyn motsäger koden.** `Privacy.tsx` säger "delas INTE med tredje part / ingen personidentifiering" medan koden exporterar SHA-256-hashad e-post + gclid till Google Ads (US), och skickar analysdata till HubSpot och Anthropic (US). Session replay nämns inte alls. Ingen processor-/sub-processor-lista, ingen Art. 44-överföringsmekanism, cookie-namn stämmer inte. Skriv om policyn så den matchar faktiska dataflöden; lägg till session replay-avsnitt, mottagarlista och SCC/överföringsgrund.
- [ ] **P1-9 `[GDPR][DB]` Retention täcker inte de känsligaste tabellerna.** Även när P0-4 är fixat listar `run_data_retention()` inte `conversion_events` (hashad e-post + gclid), `unified_visitors` (persistenta fingerprint-profiler), eller `form_analytics` → oändlig lagring. Lägg till dem med definierade perioder. Konsolidera även den dubbla manuella retention-pathen (`data-retention/index.ts`, 30 dagar) mot cron-jobbet (730 dagar).
- [ ] **P1-10 `[GDPR]` `visitor-identification` gör fingerprinting utan server-side consent-koll.** Litar blint på klientens `clickIdConsentGiven`-boolean; direkta anrop kringgår all gating (ePrivacy Art. 5(3)). Verifiera en server-side consent-post innan profil/click-IDs skapas.
- [ ] **P1-11 `[GDPR]` Session replay maskerar inte skärmtext + oprocessade inspelningar raderas aldrig.** `mask_all_text DEFAULT FALSE` → namn/adresser/orderdata i DOM fångas; `cleanup_expired_recordings()` raderar bara `processed=TRUE` → oprocessade behålls för evigt. Default:a text-maskering på känsliga sidor, ta bort `processed=TRUE`-villkoret.
- [ ] **P1-12 `[GDPR]` Controller-identiteten är ofullständig.** `Privacy.tsx:59-61` anger bara "CortIQ" + e-post. Saknar juridisk enhet (Expandtalk Corporation AB), adress, org.nr, controller/processor-roll (Art. 13). Komplettera.
- [ ] **P1-13 `[GDPR]` Formulär-tracking körs utan consent-gate.** `public/form-tracking-script.js` initieras på DOMContentLoaded och spelar in fält-interaktioner utan analytics-consent-koll. Gate:a `FormTracker` på analytics-consent som `spa-tracking.js` gör.

---

## P2 — Skalning & härdning (innan volym / fler kunder)

- [ ] **P2-1 `[DB]` `page_views` saknar index på `(site_id, viewed_at)`.** Största tabellen seq-scannas av varje dashboard-/retention-query. `CREATE INDEX idx_page_views_site_viewed ON page_views(site_id, viewed_at DESC);`
- [ ] **P2-2 `[DB]` RLS re-evaluerar `auth.uid()` per rad på stora tabeller.** `unified_visitors`, `conversion_events` SELECT-policies m.fl. missades i 2026-07-04-härdningen. Wrappa som `(select auth.uid())`, föredra `EXISTS` över `IN (SELECT...)`.
- [ ] **P2-3 `[DB]` Dashboard-hooks hämtar obegränsade rader och aggregerar i JS.** `useAttributionGap`, `useLeadQualityPipeline`, `useConversionGoalHealth`, `useAIBotTracking` drar 30 dagars rådata utan `.limit()`. Flytta aggregering till SECURITY DEFINER-RPC:er/vyer.
- [ ] **P2-4 `[DB]` Ingen dedup/idempotens på konverterings-ingest.** Dubbel form-submit → två `conversion_events` → dubbla Google Ads-uploads. Lägg unik dedup-nyckel (hashad e-post + tracking_session_id + event_name inom N min).
- [ ] **P2-5 `[DB]` `upload_status`-state machine saknar recovery.** Rader i `uploading` återställs aldrig efter krasch; `failed` retryas aldrig. Lägg reclaim-jobb + bounded retry.
- [ ] **P2-6 `[SEC][GDPR][DB]` Fingerprint använder icke-krypto 32-bit-hash.** Kollisioner → distinkta besökare slås ihop; svag pseudonymisering (Art. 32). Byt till `crypto.subtle.digest('SHA-256', …)` med per-sajt-salt.
- [ ] **P2-7 `[SEC]` BYOK Anthropic-nycklar lagras i klartext.** `company_secrets` är `text`-kolumn. Åtkomstkontroll är bra men kryptera med pgsodium/Supabase Vault så rånyckeln aldrig ligger i klartext at rest. Rätta även den missvisande "Supabase encryption"-kommentaren.
- [ ] **P2-8 `[AI]` Ingen per-user rate limit på `ai-assistant`; upp till 5 Claude-anrop/tur + 100k-radsladdningar.** Lägg per-user/company rate limit + månatligt kostnadstak; pusha aggregering till SQL istället för `.limit(100000)` + JS-reduce; lägg `cache_control` på stabila tools+system-prefix; höj `max_tokens` och hantera `stop_reason==='max_tokens'`.
- [ ] **P2-9 `[AI]` Bot-taxonomin driftar mellan ingest och dashboard.** `BotTrafficClassification.tsx` och `ai-bot-tracker/index.ts` har två oberoende hårdkodade listor som redan är osynkade (kommentaren erkänner det). Extrahera en delad registry-modul. Uppdatera även för 2026: omklassificera Grok, lägg till DuckAssistBot, Meta-ExternalFetcher, YouBot m.fl.
- [ ] **P2-10 `[AI]` Träningscrawlers kan inte upptäckas via JS-pixeln.** `ai-tracking-unified.js` kräver JS-exekvering; GPTBot/ClaudeBot/CCBot kör aldrig JS → syns bara via server-log-ingest. Dokumentera att training-crawler-detektering kräver server-log/edge-pathen; nedtona pixel-härledda bot-siffror.
- [ ] **P2-11 `[AI]` `google-ads-quality-upload` använder troligen fel `adjustmentType`.** `RESTATEMENT` kräver befintlig konvertering keyed på gclid+datetime; Enhanced Conversions for Leads använder `ENHANCEMENT`. Verifiera mot API och byt.
- [ ] **P2-12 `[SEC]` HubSpot-webhook: icke-konstanttids-signaturjämförelse + `_test`-bypass som avslöjar sajt-existens.** Använd konstant-tidsjämförelse, kräv token på test-pathen, stöd v3-signatur, claima rader atomiskt (guard på `quality_classified_at IS NULL`).
- [ ] **P2-13 `[DB]` `conversion_events` saknar foreign keys.** Lägg `site_id REFERENCES sites(id) ON DELETE CASCADE`; sätt `created_at NOT NULL`.
- [ ] **P2-14 `[GDPR]` `hashed_email` lagras oavsett marketing-consent.** Gate:a lagringen på samma consent-flagga som gclid.
- [ ] **P2-15 `[UX]` Dashboard-IA:n är överväldigande (~44 destinationer).** Kollapsa till ~6 primära tabbar med progressive disclosure; ge varje nav-item unik ikon (Target-ikonen återanvänds för tre); slå ihop duplicerade koncept (KPI/Report, alla Segments-varianter).
- [ ] **P2-16 `[UX]` Aktiv tabb är komponent-lokal state, inte i URL.** Ingen deep-linking, refresh tappar plats, back-knappen funkar inte. Synka `activeTab` till URL-param via react-router.

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
