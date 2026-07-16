# Design: Delete a site from the dashboard (hard delete)

**Date:** 2026-07-16
**Branch:** `feat/delete-site` (based on `audit-2026-07-15-fixes`)
**Status:** Approved design, pending spec review

## Problem

The dashboard can add sites (`AddSiteForm`) and switch between them (`SiteSelector`),
but there is no way to delete one. `useSites` exposes only `loadSites`; there is no
`deleteSite` and no UI affordance. A user who wants to remove a site (e.g. a test
site, or "ekonom.biz") is stuck with it forever.

## Decision

**Hard delete**: removing a site permanently deletes the site row **and all of its
collected data**. This is irreversible, guarded by a typed-domain confirmation. It
aligns with CortIQ's GDPR-first positioning (genuine data erasure) and matches what
"radera" means to the user. Soft deactivation was considered and rejected — the
`is_active` flag stays for other uses, but "delete" must actually delete.

## Current state (verified against code)

- **Table:** `public.sites (id, user_id, domain, site_name, tracking_id UNIQUE, created_at, updated_at, is_active)`.
- **RLS:** policy `"Org admins can delete sites"` already permits
  `is_org_admin(organization_id) OR (organization_id IS NULL AND user_id = auth.uid())`
  on `FOR DELETE`. No new policy needed — the browser client's delete is authorised
  and scoped by RLS.
- **Cascade:** ~38 tables reference `sites(id)` with `ON DELETE CASCADE`, so nearly all
  related data (page_views, sessions, heatmaps, conversions, forms, …) is removed
  automatically when the site row is deleted.
- **`ai_usage.site_id`** is `ON DELETE SET NULL` — fine (budget/usage rows survive, detached).
- **Blocking FK:** `event_queue.site_id UUID REFERENCES sites(id)` (migration
  `20260209111000_scaling_improvements.sql:30`) has **no `ON DELETE` action** →
  a delete would fail with a foreign-key violation if any `event_queue` rows exist
  for the site. This is the only DB gap.

## Approach

### 1. DB migration — unblock the delete
New migration `supabase/migrations/<ts>_event_queue_cascade.sql`:
- Drop the existing `event_queue_site_id_fkey` constraint and re-add it as
  `REFERENCES public.sites(id) ON DELETE CASCADE`.
- Idempotent (`IF EXISTS` on drop; look up the actual constraint name if it differs
  from the default). Verified no other non-cascading FK to `sites` exists.

### 2. Data layer — `useSites.deleteSite`
Add a **stateless** delete to `src/hooks/useSites.tsx` (it performs the DB write and
toasts, but does NOT mutate selection — the caller owns that, see §3):
```ts
const deleteSite = async (site: Site): Promise<boolean> => {
  const { error } = await supabase.from('sites').delete().eq('id', site.id);
  if (error) { toast destructive (error.message); return false; }
  toast success (`${site.domain} deleted`);
  return true;
};
```
- Ownership is enforced by RLS (`"Org admins can delete sites"`); no extra auth check.
- Returns a boolean so the dialog knows whether to close.
- Exposed from the hook's return object.

### 3. Data flow — who owns selection (important)
`Dashboard.tsx` owns the authoritative `useSites()` instance (sites, selectedSite,
setSelectedSite, loadSites) and passes `selectedSite` down to `DashboardTabs`.
`SetupTab` today calls its **own** second `useSites()` (a pre-existing duplicate that
drives its local selector/add form). To keep the design low-risk we do NOT refactor
that away; instead we thread **one** callback so both stay in sync after a delete:

- `Dashboard` defines `onSiteDeleted = () => { setSelectedSite(null); loadSites(); }`.
  `loadSites()` auto-selects the first remaining site (its existing
  `!selectedSite` branch), or the app falls back to the empty/OnboardingWizard state
  when none remain.
- `DashboardTabsProps` gains `onSiteDeleted: () => void`, forwarded **only** to
  `SetupTab` (no other tab touched).
- `SetupTab` gets `deleteSite` from its local `useSites` and, on delete, calls both its
  local `loadSites()` (refreshes its own selector) and the injected `onSiteDeleted()`
  (resyncs the Dashboard-level selection).

*(A future cleanup could lift all site state to the parent and drop SetupTab's
duplicate `useSites` — noted, out of scope here.)*

### 4. UI — `DeleteSiteDialog` component
New file `src/components/dashboard/DeleteSiteDialog.tsx` — pure UI, self-contained.
- Props: `site: Site`, `deleteSite: (site: Site) => Promise<boolean>`, `onDeleted: () => void`.
- Renders a destructive trigger button ("Delete this website") and a shadcn
  `AlertDialog`.
- The dialog:
  - Warns clearly that **all** analytics, heatmaps, sessions and conversions for the
    site are permanently deleted and cannot be recovered.
  - Contains a text input; the confirm button ("Delete permanently") is **disabled
    until the typed value exactly equals `site.domain`**.
  - On confirm, calls `deleteSite(site)`; on `true` closes and calls `onDeleted()`.
  - Shows a loading/disabled state while the delete runs.

### 5. Wiring — SetupTab
In `src/components/dashboard/tabs/SetupTab.tsx`, inside the existing "Select active
website" card (rendered when `sites.length > 0`), add a danger-zone row below
`SiteSelector`, shown when `selectedSite` is set:
```tsx
<DeleteSiteDialog
  site={selectedSite}
  deleteSite={deleteSite}
  onDeleted={() => { loadSites(); onSiteDeleted?.(); }}
/>
```
`SetupTab` gains an `onSiteDeleted?: () => void` prop (forwarded from DashboardTabs).

## Edge cases
- **Deleting the selected site** → `onSiteDeleted` resets Dashboard selection; `loadSites`
  auto-reselects the first remaining site, or the last-site case shows the
  OnboardingWizard / empty state (existing `sites.length === 0` path).
- **FK violation** → surfaced as a destructive toast (should not occur after the
  migration; kept as a safety net).
- **Accidental deletion** → prevented by the typed-domain confirmation.
- **Concurrent state** → both `useSites` instances re-read via `loadSites()` after delete.

## Testing
No local Supabase emulator (per CLAUDE.md). Manual verification against the cloud
project:
1. Create a throwaway test site via `AddSiteForm`.
2. Generate a little data for it (or confirm empty).
3. Delete it via the dialog; confirm it disappears from the selector and that a
   spot-check of a cascading table (e.g. `page_views`) has no rows for that `site_id`.
4. Confirm the confirm button stays disabled until the domain is typed exactly.
5. `tsc --noEmit` clean; `npm run build` succeeds.

## Out of scope
- Soft deactivate / archive (rejected).
- Bulk delete of multiple sites.
- Undo / trash / restore window.
- Per-table selective deletion.

## Rollout
Frontend: rebuild + FTP. DB: apply the migration (`supabase db push` or via the
dashboard). The button appears in Setup → "Select active website" after deploy.
