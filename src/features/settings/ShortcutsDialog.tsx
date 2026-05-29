import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { formatShortcut } from '../../lib/formatShortcut';
import { SHORTCUT_GROUPS } from '../../lib/shortcutsCatalog';

type ShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('shortcuts.title')}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <section
              key={group.id}
              className="rounded-lg border border-border/70 bg-background/70 p-3"
            >
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(group.labelKey)}
              </h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-foreground">{t(item.labelKey)}</span>
                    <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {formatShortcut(item.shortcut)}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
