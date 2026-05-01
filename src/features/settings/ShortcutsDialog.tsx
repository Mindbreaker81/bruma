import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
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
  if (event.key && !['Meta', 'Control', 'Shift', 'Alt'].includes(event.key)) {
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('shortcuts.title')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('shortcuts.title')}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
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
                  <tr key={cmd.id} className="border-b border-border">
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
                              if (e.key === 'Enter') setEditingId(null);
                            }}
                            placeholder={
                              isCapturing ? t('shortcuts.pressKeys') : ''
                            }
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            onClick={() => setIsCapturing(!isCapturing)}
                          >
                            {isCapturing
                              ? t('shortcuts.cancel')
                              : t('shortcuts.record')}
                          </Button>
                          {shortcuts[cmd.id] !== undefined &&
                            shortcuts[cmd.id] !== null && (
                              <Button
                                size="sm"
                                variant="destructive"
                                type="button"
                                title={t('shortcuts.resetTooltip')}
                                onClick={() => {
                                  onChange({ ...shortcuts, [cmd.id]: null });
                                  setIsCapturing(false);
                                }}
                              >
                                {t('shortcuts.reset')}
                              </Button>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('preferences.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
