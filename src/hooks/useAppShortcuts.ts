import { useEffect } from 'react';

import { isTauriRuntime } from '../lib/tauri';

type ShortcutHandlers = {
  decreaseFontScale: () => void;
  increaseFontScale: () => void;
  openShortcuts: () => void;
  resetFontScale: () => void;
  toggleFocusMode: () => void;
  toggleToc: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]')) ||
    Boolean(target.closest('input, textarea, select, [role="textbox"]'))
  );
}

export function useAppShortcuts(handlers: ShortcutHandlers): void {
  const {
    decreaseFontScale,
    increaseFontScale,
    openShortcuts,
    resetFontScale,
    toggleFocusMode,
    toggleToc,
  } = handlers;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === '?' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        openShortcuts();
        return;
      }

      if (!event.metaKey && !event.ctrlKey) return;

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        increaseFontScale();
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        decreaseFontScale();
      } else if (event.key === '0') {
        event.preventDefault();
        resetFontScale();
      } else if (
        isTauriRuntime() &&
        event.shiftKey &&
        event.key.toLowerCase() === 'm'
      ) {
        event.preventDefault();
        toggleFocusMode();
      } else if (event.shiftKey && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        toggleToc();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    decreaseFontScale,
    increaseFontScale,
    openShortcuts,
    resetFontScale,
    toggleFocusMode,
    toggleToc,
  ]);
}
