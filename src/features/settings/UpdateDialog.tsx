import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import type { UpdateInfo, UpdateProgress } from '../../hooks/useUpdateChecker';

export type UpdateDialogStatus =
  | 'checking'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'error'
  | 'up_to_date';

type UpdateDialogProps = {
  open: boolean;
  status: UpdateDialogStatus;
  update: UpdateInfo | null;
  progress: UpdateProgress | null;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onInstall: () => void;
  onRemindLater: () => void;
  onIgnore: () => void;
};

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function UpdateDialog({
  open,
  status,
  update,
  progress,
  error,
  onOpenChange,
  onInstall,
  onRemindLater,
  onIgnore,
}: UpdateDialogProps) {
  const { t } = useTranslation();
  const isBusy =
    status === 'checking' ||
    status === 'downloading' ||
    status === 'installing';
  const progressValue = progress?.percent ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('updates.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {status === 'up_to_date'
              ? t('updates.upToDate')
              : status === 'error'
                ? t('updates.error')
                : t('updates.available')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-4">
          {update ? (
            <div className="grid gap-2 rounded-md border border-border/70 bg-muted/40 p-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t('updates.currentVersion')}
                </span>
                <span className="font-medium">{update.currentVersion}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t('updates.newVersion')}
                </span>
                <span className="font-medium">{update.version}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t('updates.size')}
                </span>
                <span className="font-medium">
                  {formatBytes(progress?.total)}
                </span>
              </div>
            </div>
          ) : null}

          {update?.body ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">{t('updates.notes')}</h3>
              <div className="max-h-44 overflow-auto whitespace-pre-wrap rounded-md border border-border/70 bg-background p-3 text-sm text-muted-foreground">
                {update.body}
              </div>
            </section>
          ) : null}

          {status === 'downloading' || status === 'installing' ? (
            <section className="space-y-2" aria-label={t('updates.progress')}>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('updates.progress')}</span>
                <span>
                  {progress?.percent == null
                    ? formatBytes(progress?.downloaded)
                    : `${Math.round(progressValue)}%`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-emerald-700 transition-[width]"
                  style={{ width: `${progress?.percent ?? 8}%` }}
                />
              </div>
            </section>
          ) : null}

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="mt-5 gap-2 sm:justify-between">
          <div className="flex gap-2">
            {update && status !== 'up_to_date' ? (
              <Button variant="ghost" onClick={onIgnore} disabled={isBusy}>
                {t('updates.buttonIgnore')}
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onRemindLater}
              disabled={status === 'installing'}
            >
              {t('updates.buttonRemind')}
            </Button>
            {update && status !== 'up_to_date' ? (
              <Button onClick={onInstall} disabled={isBusy}>
                {t('updates.buttonInstall')}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
