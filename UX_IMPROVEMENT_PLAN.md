# CortIQ — UX Improvement Plan

## Diagnos

Tre grundproblem dominerar:

1. **Dubblerad padding** — `CardContent p-6` inuti ett `Card` som redan har inbyggt padding. Stackas ytterligare av `space-y-6` på parent. Resultat: ~48px vit luft runt varje card istället för ~16px.
2. **Data visas för långt ner** — Overview-tabben har ~600px headers/widgets innan man ser ett enda diagram. Besökaren scrollar innan de sett något meningsfullt.
3. **En metrik = ett berg** — KPI-cards är 400–500px höga för ett enda siffervärde. 4 stats-cards i AnalyticsOverview visar sedan samma 4 siffror igen i en kompakt rad direkt nedanför. Samma data två gånger.

---

## Prioriterade ändringar

### P1 — Direkt effekt, liten risk

#### 1. Ta bort dubblettblocket i AnalyticsOverview
**Fil:** `src/components/dashboard/AnalyticsOverview.tsx`

De fyra stora stats-korten (Sessions, Page Views, Engagement Time, Engagement Rate) följs av ett femte `md:col-span-4`-kort som upprepar exakt samma fyra siffror i en kompakt rad. Ta bort det undre blocket. Behåll de fyra korten men gör dem kompaktare (se punkt 2).

#### 2. Kompakta stats-cards — från 160px till 80px
**Fil:** `src/components/dashboard/AnalyticsOverview.tsx`

Idag: stor ikon (h-10 w-10) + siffra + label + badge, centrerat i en `p-6`-card.
Förslag: horisontell layout, liten ikon, siffra + label på samma rad, ingen badge (flytta GA4-noter till tooltip):

```
┌─────────────────────────────────────────────────────────────┐
│  📊 24,531   👁 89,200   ⏱ 2m 14s   📈 67.3%              │
│  Sessions    Page Views  Eng. Time   Eng. Rate              │
└─────────────────────────────────────────────────────────────┘
```

En enda card med `grid-cols-4`, `p-4`, inga ikoner > h-5. Halverar höjden.

#### 3. Flytta AIInsightsWidget — inte first above the fold
**Fil:** `src/components/dashboard/tabs/OverviewTab.tsx`

Idag är AIInsightsWidget det första som visas (~200px). Det är AI-genererade insikter — intressant men sekundärt. Flytta den under stats + real-time-blocket. Ordning bör vara:
1. Stats-rad (punkt 2 ovan) — ~80px
2. Real-time widget + AI Traffic summary — ~200px
3. AIInsightsWidget — ~200px
4. Diagram (toppsidor, trender) — resten

#### 4. Rensa CardHeader för enkla sektioner
**Fil:** Flera, bl.a. `tabs/KPITab.tsx`, `tabs/AnalyticsTab.tsx`

Sektioner med bara en `CardTitle` och ingen `CardDescription` behöver inte ett fullt `CardHeader`. Ersätt med:
```tsx
<p className="text-sm font-medium text-muted-foreground px-4 pt-4 pb-2">Sessioner per månad</p>
```
Sparar ~44px per sektion.

---

### P2 — Hög effekt, måttlig risk

#### 5. KPIMetricCard — kompakt läge
**Fil:** `src/components/dashboard/KPIMetricCard.tsx`

En KPI-card är idag 400–500px. Den innehåller: badges × 3, title, description, värde, "business value"-box, datakällor, integrationer, footer med toggle + knapp. Det är ett detaljkort — inte ett översiktskort.

Förslag: Två lägen.
- **Collapsed (default):** 80px — ikon, namn, siffra, trend-pil. Klick expanderar.
- **Expanded:** nuvarande layout, men med `p-4` istället för `p-6`.

KPI-översikten passar då 6–8 metrics ovan fold istället för 2–3.

#### 6. Sätt maxbredd på dashboard-innehåll
**Fil:** `src/components/dashboard/DashboardTabs.tsx` eller layout-wrapper

Idag sträcker sig content till full skärmbredd på stora skärmar, vilket gör att texter och cards blir extremt breda. Sätt `max-w-screen-2xl mx-auto` på content-wrappern. Korten håller bättre proportioner och text förblir läsbar.

#### 7. Konsekvent inner padding: p-4 som standard, p-6 bara för hero-blocks
**Fil:** Globalt — AnalyticsOverview, KPIMetricCard, OverviewTab, AnalyticsTab

Gör `p-4` till standardpadding för `CardContent`. Reservera `p-6` för de 2–3 cards som verkligen är "hero"-element (t.ex. den primära stats-toppen). Minskar visuell tyngd konsekvent i hela dashboarden.

---

### P3 — Förbättringar som kräver mer jobb

#### 8. Overview-tabben: "Dashboard på en sida"
**Fil:** `src/components/dashboard/tabs/OverviewTab.tsx`

Målet: allt viktigt syns inom 800px (en genomsnittlig laptopskärm utan scroll).

Förslag till layout:
```
┌──────────────────────────────────────────────────────────────┐
│  [Stats-rad: Sessions / PageViews / Eng.Time / Eng.Rate]    │  ~80px
├────────────────────────────┬─────────────────────────────────┤
│  Trafikkälla-diagram       │  Real-time + AI Traffic         │  ~280px
│  (bar/line, 7 dagar)       │  summary                        │
├────────────────────────────┴─────────────────────────────────┤
│  Top 5 sidor   │  Device breakdown  │  AI Insights (3 items) │  ~200px
└──────────────────────────────────────────────────────────────┘
```
Totalt: ~560px. Allt viktigt syns direkt.

#### 9. Sticky stats-rad
Överväg att göra stats-raden (punkt 2) sticky med `sticky top-0 z-10 bg-background`. Sifforna är alltid synliga oavsett hur långt ner användaren scrollar. Vanligt mönster i analytics-dashboards (Plausible, Fathom).

#### 10. Tab-navigationen — gruppera och städa
**Fil:** `src/components/dashboard/DashboardTabs.tsx`

Det finns ~15 synliga tabs. Förslag: Flytta sällananvända tabs till dropdown ("Mer") för att minska visuellt brus. Primär navigation: Overview, Analytics, Heatmap, AI Traffic, A/B Testing. Sekundär (dropdown): Forms, Cookie-Free, Segments, Alerts, Navigation, KPI, osv.

---

## Implementationsordning

| # | Ändring | Effekt | Risk | Tid (CC) |
|---|---------|--------|------|----------|
| 1 | Ta bort dubblettblocket i AnalyticsOverview | Hög | Låg | 5 min |
| 2 | Kompakt stats-rad | Hög | Låg | 20 min |
| 3 | Flytta AIInsightsWidget | Medel | Låg | 5 min |
| 4 | Rensa tomma CardHeader | Medel | Låg | 15 min |
| 5 | KPIMetricCard collapsed/expanded | Hög | Medel | 45 min |
| 6 | Max-bredd på content | Medel | Låg | 5 min |
| 7 | p-4 som global standard | Medel | Låg | 20 min |
| 8 | Overview-layout redesign | Hög | Medel | 60 min |
| 9 | Sticky stats-rad | Låg | Låg | 10 min |
| 10 | Tab-gruppering | Medel | Medel | 30 min |

**Förslag:** Börja med P1 (1–4). Det ger omedelbar visuell förbättring på ~45 min och är i princip riskfritt.
