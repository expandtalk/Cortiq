# Delete a Site From the Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user permanently delete a site (and all its collected data) from the dashboard, guarded by a typed-domain confirmation.

**Architecture:** A stateless `deleteSite` in `useSites` performs an RLS-scoped `DELETE` on `sites`; DB `ON DELETE CASCADE` removes all related rows. A self-contained `DeleteSiteDialog` provides the confirmation UI. A single `onSiteDeleted` callback threaded Dashboard → DashboardTabs → SetupTab keeps selection state in sync after deletion.

**Tech Stack:** React 18 + TypeScript, shadcn/ui (`AlertDialog`, `Button`, `Input`), Supabase JS client, Supabase SQL migration.

## Global Constraints

- **Hard delete only** — no soft-deactivate; removing a site removes all its data.
- **Typed-domain confirmation** — the confirm button is disabled until the user types the site's `domain` exactly.
- **RLS enforces ownership** — rely on the existing `"Org admins can delete sites"` policy; no client-side auth check.
- **UI copy in English** (per CLAUDE.md).
- **No test runner exists** (vitest is imported by two files but is not installed). Do **not** add a test framework. Verification = `npx tsc --noEmit` + `npm run build` + manual QA against the cloud Supabase project `cxmkdtgfocgbfizawlwa`.
- **Commit after each task.**

---

### Task 1: DB migration — make `event_queue.site_id` cascade

**Files:**
- Create: `supabase/migrations/20260716120000_event_queue_site_cascade.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: `event_queue_site_id_fkey` now `ON DELETE CASCADE`, so deleting a `sites` row never fails on `event_queue`.

**Context:** `event_queue.site_id` (from `20260209111000_scaling_improvements.sql`) references `sites(id)` with **no** `ON DELETE` action — the only non-cascading FK to `sites`; it would block a delete with a foreign-key violation if any queue rows exist. Every other `sites` FK is already `ON DELETE CASCADE` (except `ai_usage` which is `SET NULL`, intentionally).

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260716120000_event_queue_site_cascade.sql`:

```sql
-- event_queue.site_id referenced sites(id) with no ON DELETE action, which blocks
-- deleting a site that has queued events. Align it with the other site FKs
-- (ON DELETE CASCADE) so deleting a site cleanly removes its queue rows.
ALTER TABLE public.event_queue
  DROP CONSTRAINT IF EXISTS event_queue_site_id_fkey;

ALTER TABLE public.event_queue
  ADD CONSTRAINT event_queue_site_id_fkey
  FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;
```

- [ ] **Step 2: Sanity-check the SQL**

Run: `cat supabase/migrations/20260716120000_event_queue_site_cascade.sql`
Expected: the two `ALTER TABLE` statements above, no syntax typos. (No local emulator — the migration is applied at rollout via `npx supabase db push` or the dashboard SQL editor. Do NOT apply it as part of this task.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260716120000_event_queue_site_cascade.sql
git commit -m "fix(db): event_queue.site_id ON DELETE CASCADE so sites can be deleted"
```

---

### Task 2: `useSites.deleteSite`

**Files:**
- Modify: `src/hooks/useSites.tsx`

**Interfaces:**
- Consumes: existing `supabase`, `toast`, `loadSites` in the hook.
- Produces: `deleteSite(site: Site) => Promise<boolean>` on the hook's return object. Returns `true` on success, `false` on error. Does **not** mutate selection (the caller owns that).

- [ ] **Step 1: Add `deleteSite` above the `return`**

In `src/hooks/useSites.tsx`, immediately before the `return {` statement, add:

```ts
  const deleteSite = async (site: Site): Promise<boolean> => {
    try {
      const { error } = await supabase.from('sites').delete().eq('id', site.id);
      if (error) throw error;
      toast({
        title: "✅ Website deleted",
        description: `${site.domain} and all its data were removed.`,
      });
      return true;
    } catch (error) {
      console.error('Error deleting site:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Could not delete the website",
        variant: "destructive",
      });
      return false;
    }
  };
```

- [ ] **Step 2: Export it from the hook**

Change the return object from:

```ts
  return {
    sites,
    selectedSite,
    setSelectedSite,
    loadSites,
    loading
  };
```

to:

```ts
  return {
    sites,
    selectedSite,
    setSelectedSite,
    loadSites,
    deleteSite,
    loading
  };
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSites.tsx
git commit -m "feat(sites): add deleteSite mutation to useSites hook"
```

---

### Task 3: `DeleteSiteDialog` component

**Files:**
- Create: `src/components/dashboard/DeleteSiteDialog.tsx`

**Interfaces:**
- Consumes: `deleteSite: (site: Site) => Promise<boolean>` (from Task 2), shadcn `AlertDialog`/`Button`/`Input`, `Site` type.
- Produces: `DeleteSiteDialog({ site, deleteSite, onDeleted })` — a destructive trigger button + confirmation dialog. Calls `onDeleted()` only after a successful delete.

- [ ] **Step 1: Create the component**

Create `src/components/dashboard/DeleteSiteDialog.tsx`:

```tsx
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import type { Site } from '@/types/dashboard';

interface DeleteSiteDialogProps {
  site: Site;
  deleteSite: (site: Site) => Promise<boolean>;
  onDeleted: () => void;
}

export function DeleteSiteDialog({ site, deleteSite, onDeleted }: DeleteSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmText.trim() === site.domain && !deleting;

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await deleteSite(site);
    setDeleting(false);
    if (ok) {
      setOpen(false);
      setConfirmText('');
      onDeleted();
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete this website
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setConfirmText('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {site.domain}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <strong>{site.domain}</strong> and{' '}
              <strong>all</strong> of its collected data — analytics, heatmaps,
              sessions, conversions and more. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <label htmlFor="confirm-domain" className="text-sm text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">{site.domain}</span> to confirm
            </label>
            <Input
              id="confirm-domain"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={site.domain}
              autoComplete="off"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={!canDelete} onClick={handleDelete}>
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors. (If `Site` has no `domain` field the compiler will flag it — `domain` is a column on `sites` and is part of the `Site` type.)

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/DeleteSiteDialog.tsx
git commit -m "feat(sites): add DeleteSiteDialog with typed-domain confirmation"
```

---

### Task 4: Wire the dialog in and thread `onSiteDeleted`

**Files:**
- Modify: `src/components/dashboard/tabs/SetupTab.tsx`
- Modify: `src/components/dashboard/DashboardTabs.tsx`
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `DeleteSiteDialog` (Task 3), `useSites.deleteSite` (Task 2).
- Produces: a visible "Delete this website" flow in Setup → "Select active website"; deleting the selected site resets Dashboard selection and reloads.

- [ ] **Step 1: SetupTab — import, prop, destructure, render**

In `src/components/dashboard/tabs/SetupTab.tsx`:

Add the import after the other `@/components/dashboard` imports (near line 9):

```tsx
import { DeleteSiteDialog } from '@/components/dashboard/DeleteSiteDialog';
```

Change the props interface and signature from:

```tsx
interface SetupTabProps {
  selectedSite: Site | null;
}

export function SetupTab({ selectedSite }: SetupTabProps) {
  const { sites, setSelectedSite, loadSites } = useSites();
```

to:

```tsx
interface SetupTabProps {
  selectedSite: Site | null;
  onSiteDeleted?: () => void;
}

export function SetupTab({ selectedSite, onSiteDeleted }: SetupTabProps) {
  const { sites, setSelectedSite, loadSites, deleteSite } = useSites();
```

Then, inside the "Select active website" `Card`, replace this block:

```tsx
            <CardContent>
              <SiteSelector 
                sites={sites}
                selectedSite={selectedSite}
                onSiteSelect={setSelectedSite}
              />
            </CardContent>
```

with:

```tsx
            <CardContent>
              <SiteSelector 
                sites={sites}
                selectedSite={selectedSite}
                onSiteSelect={setSelectedSite}
              />
              {selectedSite && (
                <div className="mt-4 pt-4 border-t border-destructive/20">
                  <p className="text-sm text-muted-foreground mb-2">
                    Danger zone — permanently delete{' '}
                    <span className="font-medium text-foreground">{selectedSite.domain}</span>{' '}
                    and all of its data.
                  </p>
                  <DeleteSiteDialog
                    site={selectedSite}
                    deleteSite={deleteSite}
                    onDeleted={() => { loadSites(); onSiteDeleted?.(); }}
                  />
                </div>
              )}
            </CardContent>
```

- [ ] **Step 2: DashboardTabs — add prop and forward to SetupTab**

In `src/components/dashboard/DashboardTabs.tsx`:

Change the props interface from:

```tsx
interface DashboardTabsProps {
  selectedSite: Site;
  analytics: Analytics | null;
  dateRange?: import('react-day-picker').DateRange;
}
```

to:

```tsx
interface DashboardTabsProps {
  selectedSite: Site;
  analytics: Analytics | null;
  dateRange?: import('react-day-picker').DateRange;
  onSiteDeleted?: () => void;
}
```

Change the inner component signature from:

```tsx
function DashboardTabsInner({ selectedSite, analytics, dateRange }: DashboardTabsProps) {
```

to:

```tsx
function DashboardTabsInner({ selectedSite, analytics, dateRange, onSiteDeleted }: DashboardTabsProps) {
```

Change the SetupTab render from:

```tsx
          <SetupTab selectedSite={selectedSite} />
```

to:

```tsx
          <SetupTab selectedSite={selectedSite} onSiteDeleted={onSiteDeleted} />
```

(The outer `DashboardTabs` already forwards all props to `DashboardTabsInner` via `{...props}`, so no other change is needed there.)

- [ ] **Step 3: Dashboard — provide the callback**

In `src/pages/Dashboard.tsx`, change:

```tsx
          <DashboardTabs
            selectedSite={selectedSite}
            analytics={analytics}
            dateRange={dateRange}
          />
```

to:

```tsx
          <DashboardTabs
            selectedSite={selectedSite}
            analytics={analytics}
            dateRange={dateRange}
            onSiteDeleted={() => { setSelectedSite(null); loadSites(); }}
          />
```

(`loadSites()` auto-selects the first remaining site via its existing `!selectedSite` branch; if none remain, `selectedSite` stays null and the existing "Select a website" / OnboardingWizard path shows.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: client + SSR build succeed, "Pre-rendered 11 pages", no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/tabs/SetupTab.tsx src/components/dashboard/DashboardTabs.tsx src/pages/Dashboard.tsx
git commit -m "feat(sites): wire DeleteSiteDialog into Setup + sync selection on delete"
```

---

### Task 5: Manual verification & rollout

**Files:** none (verification + deploy).

- [ ] **Step 1: Apply the migration to the cloud project**

Run: `npx supabase db push`
(Or paste the Task 1 SQL into the Supabase SQL editor for project `cxmkdtgfocgbfizawlwa`.)
Expected: migration applies; `event_queue_site_id_fkey` now `ON DELETE CASCADE`.

- [ ] **Step 2: Manual QA (dev server)**

Run: `npm run dev` → open http://localhost:8080 → Dashboard → Setup tab.
Verify:
1. With a site selected, a red **"Delete this website"** button shows under "Select active website".
2. Clicking it opens the dialog; **"Delete permanently" is disabled** until the domain is typed exactly.
3. Create a throwaway test site (Add website), select it, delete it → it disappears from the selector, a success toast shows, and the view reselects another site (or shows the empty/onboarding state if it was the last).
4. Spot-check in Supabase that a cascading table (e.g. `page_views`) has no rows for the deleted `site_id`.

- [ ] **Step 3: Deploy**

- Frontend: `npm run build` → FTP `dist/`.
- DB: migration already pushed in Step 1.

- [ ] **Step 4: Update AUDIT-TASKS.md history (optional)**

Note the new "delete site" capability if tracking product features there. Commit if changed.

---

## Notes / out of scope
- Soft-deactivate, bulk delete, undo/trash — out of scope (see spec).
- The pre-existing duplicate `useSites()` in SetupTab is kept; the `onSiteDeleted` callback keeps Dashboard and SetupTab in sync. Lifting all site state to the parent is a future cleanup.
