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
