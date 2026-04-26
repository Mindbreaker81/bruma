import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  COMMAND_REGISTRY,
  type CommandId,
  detectConflicts,
  normalizeBinding,
} from '../../lib/shortcuts';

type ShortcutsDialogProps = {
  open: boolean;
  onClose: () => void;
  shortcuts: Partial<Record<CommandId, string | null>>;
  onChange: (shortcuts: Partial<Record<CommandId, string | null>>) => void;
};

export function ShortcutsDialog({
  open,
  onClose,
  shortcuts,
  onChange,
}: ShortcutsDialogProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<CommandId | null>(null);
  const conflicts = useMemo(() => detectConflicts(shortcuts), [shortcuts]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 px-4">
      <section
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
      >
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))] px-5 py-3">
          <h2 className="text-base font-semibold" id="shortcuts-dialog-title">
            {t('shortcuts.title')}
          </h2>
          <button
            className="rounded-md px-2 py-1 text-sm text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            onClick={onClose}
          >
            {t('preferences.close')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--color-border))]">
                <th className="py-2 text-left">{t('shortcuts.command')}</th>
                <th className="py-2 text-left">{t('shortcuts.binding')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(COMMAND_REGISTRY).map((cmd) => {
                const binding = shortcuts[cmd.id] ?? cmd.defaultShortcut;
                const conflict = binding
                  ? (conflicts.get(normalizeBinding(binding)) ?? [])
                  : [];
                const hasConflict = conflict.length > 1;

                return (
                  <tr
                    key={cmd.id}
                    className="border-b border-[rgb(var(--color-border))]"
                  >
                    <td className="py-2">{t(`shortcuts.${cmd.id}`)}</td>
                    <td className="py-2">
                      {editingId === cmd.id ? (
                        <input
                          className="w-32 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-2 py-1 text-sm"
                          autoFocus
                          value={binding ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.trim() || null;
                            onChange({ ...shortcuts, [cmd.id]: val });
                          }}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingId(null);
                          }}
                        />
                      ) : (
                        <button
                          className={`rounded px-2 py-1 text-sm ${
                            hasConflict
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                              : 'bg-[rgb(var(--color-bg))] hover:bg-[rgb(var(--color-control-hover))]'
                          }`}
                          type="button"
                          onClick={() => setEditingId(cmd.id)}
                        >
                          {binding ?? t('shortcuts.unbound')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
