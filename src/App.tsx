import { FileInput, FileText, Moon, RotateCcw, Save } from 'lucide-react';
import { type DragEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MarkdownEditor } from './features/editor/MarkdownEditor';
import { openFileDialog, saveFile, saveFileDialog } from './features/files/ipc';
import { useFileStore } from './features/files/state';
import { useThemeStore } from './features/settings/state';
import { listenToMenuActions, setAppWindowTitle } from './lib/tauri';

export default function App() {
  const { t } = useTranslation();
  const document = useFileStore((state) => state.document);
  const displayName = useFileStore((state) => state.displayName);
  const isDirty = useFileStore((state) => state.isDirty);
  const loadDocument = useFileStore((state) => state.loadDocument);
  const markSaved = useFileStore((state) => state.markSaved);
  const resetUntitled = useFileStore((state) => state.resetUntitled);
  const updateContent = useFileStore((state) => state.updateContent);
  const cycleTheme = useThemeStore((state) => state.cycleTheme);
  const themePreference = useThemeStore((state) => state.preference);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    window.setTimeout(() => setErrorMessage(null), 4500);
  }, []);

  const handleOpen = useCallback(async () => {
    try {
      const openedFile = await openFileDialog();

      if (openedFile) {
        loadDocument(openedFile);
      }
    } catch {
      showError(t('errors.openFailed'));
    }
  }, [loadDocument, showError, t]);

  const handleSaveAs = useCallback(async () => {
    try {
      const savedFile = await saveFileDialog({
        content: document.content,
        eol: document.eol,
        suggested: displayName,
      });

      if (savedFile) {
        markSaved(savedFile.savedAt, savedFile.path);
      }
    } catch {
      showError(t('errors.saveFailed'));
    }
  }, [displayName, document.content, document.eol, markSaved, showError, t]);

  const handleSave = useCallback(async () => {
    if (!document.path) {
      await handleSaveAs();
      return;
    }

    try {
      const savedFile = await saveFile({
        path: document.path,
        content: document.content,
        eol: document.eol,
      });

      markSaved(savedFile.savedAt, savedFile.path);
    } catch {
      showError(t('errors.saveFailed'));
    }
  }, [
    document.content,
    document.eol,
    document.path,
    handleSaveAs,
    markSaved,
    showError,
    t,
  ]);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLElement>) => {
      event.preventDefault();

      const [file] = Array.from(event.dataTransfer.files);

      if (!file) {
        return;
      }

      if (!/\.(md|markdown)$/i.test(file.name)) {
        showError(t('errors.unsupportedFile'));
        return;
      }

      const content = await file.text();

      loadDocument({
        path: file.name,
        content,
        eol: content.includes('\r\n') ? 'crlf' : 'lf',
      });
    },
    [loadDocument, showError, t]
  );

  useEffect(() => {
    const title = `${isDirty ? '*' : ''}${displayName} - Bruma`;

    void setAppWindowTitle(title);
  }, [displayName, isDirty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        resetUntitled();
      }

      if (modifier && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSaveAs();
        return;
      }

      if (modifier && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        void handleOpen();
      }

      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSave();
      }

      if (modifier && event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        cycleTheme();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cycleTheme, handleOpen, handleSave, handleSaveAs, resetUntitled]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    void listenToMenuActions((action) => {
      if (action === 'file_new') {
        resetUntitled();
      }

      if (action === 'file_open') {
        void handleOpen();
      }

      if (action === 'file_save') {
        void handleSave();
      }

      if (action === 'file_save_as') {
        void handleSaveAs();
      }

      if (action === 'view_toggle_theme') {
        cycleTheme();
      }
    }).then((unlisten) => {
      cleanup = unlisten;
    });

    return () => cleanup?.();
  }, [cycleTheme, handleOpen, handleSave, handleSaveAs, resetUntitled]);

  return (
    <main
      className="flex h-screen min-h-0 flex-col bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] antialiased"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-sm font-semibold text-white">
            B
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{t('app.name')}</h1>
            <p className="truncate text-xs text-[rgb(var(--color-muted))]">
              {displayName}
              {isDirty ? ` ${t('document.dirtyMark')}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('actions.newDocument')}
            title={t('actions.newDocument')}
            onClick={resetUntitled}
          >
            <FileText className="size-4" aria-hidden />
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('actions.openDocument')}
            title={t('actions.openDocument')}
            onClick={() => void handleOpen()}
          >
            <FileInput className="size-4" aria-hidden />
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('actions.markSaved')}
            title={t('actions.markSaved')}
            onClick={() => void handleSave()}
          >
            <Save className="size-4" aria-hidden />
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('theme.toggle')}
            title={t('theme.toggle')}
            onClick={cycleTheme}
          >
            <Moon className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 grid-rows-[auto_1fr]">
        <div className="flex h-10 items-center justify-between border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-panel))] px-4 text-xs text-[rgb(var(--color-muted))]">
          <span>{t('view.editor')}</span>
          <span>{t(`theme.preference.${themePreference}`)}</span>
        </div>

        <MarkdownEditor
          ariaLabel={t('editor.label')}
          placeholder={t('editor.placeholder')}
          value={document.content}
          onChange={updateContent}
        />
      </section>

      {errorMessage ? (
        <div
          className="fixed bottom-12 right-4 max-w-sm rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          role="status"
        >
          {errorMessage}
        </div>
      ) : null}

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 text-xs text-[rgb(var(--color-muted))]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate">{displayName}</span>
          {isDirty ? (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
              <RotateCcw className="size-3" aria-hidden />
              {t('document.unsaved')}
            </span>
          ) : (
            <span>{t('document.saved')}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>{document.encoding.toUpperCase()}</span>
          <span>{document.eol.toUpperCase()}</span>
          <span>{resolvedTheme}</span>
        </div>
      </footer>
    </main>
  );
}
