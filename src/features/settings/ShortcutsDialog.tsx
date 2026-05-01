import { useEffect, useMemo, useState } from 'react';
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

function eventToBinding(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push('Mod');
  if (event.shiftKey) parts.push('Shift');
  if (event.altKey) parts.push('Alt');
  if (
    event.key &&
    event.key !== 'Meta' &&
    event.key !== 'Control' &&
    event.key !== 'Shift' &&
    event.key !== 'Alt'
  ) {
    parts.push(event.key);
  }
  return parts.join('+');
}

export function ShortcutsDialog({
  open,
  onClose,
  shortcuts,
  onChange,
}: ShortcutsDialogProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<CommandId | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedBinding, setCapturedBinding] = useState('');
  const conflicts = useMemo(() => detectConflicts(shortcuts), [shortcuts]);

  useEffect(() => {
    if (!isCapturing || !editingId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'Escape') {
        setIsCapturing(false);
        setCapturedBinding('');
        return;
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        onChange({ ...shortcuts, [editingId]: null });
        setIsCapturing(false);
        setCapturedBinding('');
        setEditingId(null);
        return;
      }

      const binding = eventToBinding(event);
      setCapturedBinding(binding);
      onChange({ ...shortcuts, [editingId]: binding });
      setIsCapturing(false);
      setCapturedBinding('');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCapturing, editingId, shortcuts, onChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 px-4">
      <section
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-border bg-card shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold" id="shortcuts-dialog-title">
            {t('shortcuts.title')}
          </h2>
          <button
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            onClick={onClose}
          >
            {t('preferences.close')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
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
                    className="border-b border-border"
                  >
                    <td className="py-2">{t(`shortcuts.${cmd.id}`)}</td>
                    <td className="py-2">
                      {editingId === cmd.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="w-32 rounded border border-border bg-background px-2 py-1 text-sm"
                            autoFocus
                            value={
                              isCapturing ? capturedBinding : (binding ?? '')
                            }
                            onChange={(e) => {
                              setIsCapturing(false);
                              const val = e.target.value.trim() || null;
                              onChange({ ...shortcuts, [cmd.id]: val });
                            }}
                            onBlur={() => {
                              setIsCapturing(false);
                              setEditingId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingId(null);
                              }
                            }}
                            placeholder={isCapturing ? 'Press keys...' : ''}
                          />
                          <button
                            className="rounded px-2 py-1 text-xs bg-accent hover:bg-background"
                            type="button"
                            onClick={() => setIsCapturing(!isCapturing)}
                            title={
                              isCapturing
                                ? 'Cancel capture'
                                : 'Capture shortcut'
                            }
                          >
                            {isCapturing ? 'Cancel' : 'Record'}
                          </button>
                          {shortcuts[cmd.id] !== undefined &&
                            shortcuts[cmd.id] !== null && (
                              <button
                                className="rounded px-2 py-1 text-xs bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950 dark:text-red-200"
                                type="button"
                                onClick={() => {
                                  onChange({ ...shortcuts, [cmd.id]: null });
                                  setIsCapturing(false);
                                }}
                                title="Reset to default"
                              >
                                Reset
                              </button>
                            )}
                        </div>
                      ) : (
                        <button
                          className={`rounded px-2 py-1 text-sm ${
                            hasConflict
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                              : 'bg-background hover:bg-accent'
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
