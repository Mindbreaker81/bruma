import { FileText, Moon, RotateCcw, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useFileStore } from './features/files/state';
import { useThemeStore } from './features/settings/state';
import { listenToMenuActions, setAppWindowTitle } from './lib/tauri';

export default function App() {
  const { t } = useTranslation();
  const document = useFileStore((state) => state.document);
  const displayName = useFileStore((state) => state.displayName);
  const isDirty = useFileStore((state) => state.isDirty);
  const markSaved = useFileStore((state) => state.markSaved);
  const resetUntitled = useFileStore((state) => state.resetUntitled);
  const updateContent = useFileStore((state) => state.updateContent);
  const cycleTheme = useThemeStore((state) => state.cycleTheme);
  const themePreference = useThemeStore((state) => state.preference);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

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

      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault();
        markSaved();
      }

      if (modifier && event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        cycleTheme();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cycleTheme, markSaved, resetUntitled]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    void listenToMenuActions((action) => {
      if (action === 'file_new') {
        resetUntitled();
      }

      if (action === 'file_save') {
        markSaved();
      }

      if (action === 'view_toggle_theme') {
        cycleTheme();
      }
    }).then((unlisten) => {
      cleanup = unlisten;
    });

    return () => cleanup?.();
  }, [cycleTheme, markSaved, resetUntitled]);

  return (
    <main className="flex h-screen min-h-0 flex-col bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] antialiased">
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
            aria-label={t('actions.markSaved')}
            title={t('actions.markSaved')}
            onClick={() => markSaved()}
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

        <textarea
          className="h-full min-h-0 w-full resize-none bg-[rgb(var(--color-editor))] px-5 py-4 font-mono text-sm leading-6 text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-muted))]"
          aria-label={t('editor.label')}
          placeholder={t('editor.placeholder')}
          spellCheck={false}
          value={document.content}
          onChange={(event) => updateContent(event.target.value)}
        />
      </section>

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
