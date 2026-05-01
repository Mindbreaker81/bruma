import { useEffect } from 'react';

import {
  listenToMenuActions,
  listenToRecentOpen,
} from '../lib/tauri';

type MenuHandlers = {
  cycleTheme: () => void;
  cycleViewMode: () => void;
  handleNewDocument: () => void;
  handleOpenSearch: () => void;
  handleOpenWithConfirmation: () => void;
  handleSave: () => Promise<boolean>;
  handleSaveAs: () => Promise<boolean>;
  openAbout: () => void;
  setLanguage: (language: 'es' | 'en') => void;
  setViewMode: (nextViewMode: 'editor' | 'split' | 'preview') => void;
};

type UseTauriMenuBridgeProps = {
  handlers: React.MutableRefObject<MenuHandlers>;
  setIsPreferencesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleOpenRecent: (path: string) => void;
};

export function useTauriMenuBridge({
  handlers,
  setIsPreferencesOpen,
  setIsAboutOpen,
  handleOpenRecent,
}: UseTauriMenuBridgeProps) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let isDisposed = false;

    void listenToMenuActions((action: string) => {
      const h = handlers.current;

      if (action === 'file_new') {
        h.handleNewDocument();
      }
      if (action === 'file_open') {
        h.handleOpenWithConfirmation();
      }
      if (action === 'file_save') {
        void h.handleSave();
      }
      if (action === 'file_save_as') {
        void h.handleSaveAs();
      }
      if (action === 'edit_find') {
        h.handleOpenSearch();
      }
      if (action === 'view_toggle_theme') {
        h.cycleTheme();
      }
      if (action === 'view_editor') {
        h.setViewMode('editor');
      }
      if (action === 'view_preview') {
        h.setViewMode('preview');
      }
      if (action === 'view_split') {
        h.setViewMode('split');
      }
      if (action === 'view_toggle_mode') {
        h.cycleViewMode();
      }
      if (action === 'language_es') {
        h.setLanguage('es');
      }
      if (action === 'language_en') {
        h.setLanguage('en');
      }
      if (action === 'help_preferences') {
        setIsPreferencesOpen((open) => !open);
      }
      if (action === 'help_about') {
        setIsAboutOpen((open) => !open);
      }
    }).then((unlisten) => {
      if (isDisposed) {
        unlisten();
        return;
      }
      cleanup = unlisten;
    });

    return () => {
      isDisposed = true;
      cleanup?.();
    };
  }, [handlers, setIsAboutOpen, setIsPreferencesOpen]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let isDisposed = false;

    void listenToRecentOpen((path) => {
      handleOpenRecent(path);
    }).then((unlisten) => {
      if (isDisposed) {
        unlisten();
        return;
      }
      cleanup = unlisten;
    });

    return () => {
      isDisposed = true;
      cleanup?.();
    };
  }, [handleOpenRecent]);
}
