import { useCallback, useEffect, useRef } from 'react';
import type { CommandId } from './shortcuts';
import { matchBinding } from './shortcuts';

export type ShortcutRegistry = Map<CommandId, string | null>;

export function useShortcutRegistry(
  shortcuts: ShortcutRegistry,
  handlers: Partial<Record<CommandId, () => void>>
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const modifiers =
      event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
    if (!modifiers) return;

    for (const [id, binding] of shortcutsRef.current.entries()) {
      if (!binding) continue;
      if (matchBinding(event, binding)) {
        const handler = handlersRef.current[id];
        if (handler) {
          event.preventDefault();
          handler();
        }
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
