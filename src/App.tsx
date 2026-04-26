import {
  Columns2,
  Clock,
  Eye,
  EyeOff,
  FileInput,
  FileText,
  Languages,
  List,
  Maximize2,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Save,
  Search,
} from 'lucide-react';
import {
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  type MarkdownEditorHandle,
  MarkdownEditor,
} from './features/editor/MarkdownEditor';
import { ConfirmDirtyDialog } from './features/files/ConfirmDirtyDialog';
import {
  openFileDialog,
  readFile,
  saveFile,
  saveFileDialog,
  syncRecentFilesMenu,
} from './features/files/ipc';
import { useFileStore } from './features/files/state';
import { Preview } from './features/preview/Preview';
import { SearchPanel } from './features/search/SearchPanel';
import { findSearchMatches } from './features/search/search';
import { useSearchStore } from './features/search/state';
import { useThemeStore } from './features/settings/state';
import type { ViewMode } from './features/settings/view';
import { TableOfContents } from './features/toc/TableOfContents';
import { APP_VERSION } from './lib/app';
import { getTextStats } from './lib/textStats';
import {
  isTauriRuntime,
  listenToMenuActions,
  listenToRecentOpen,
  setAppWindowTitle,
} from './lib/tauri';

const VIEW_MODES: ViewMode[] = ['editor', 'split', 'preview'];

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
  setViewMode: (nextViewMode: ViewMode) => void;
};

function getPathBasename(path: string): string {
  const segments = path.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] ?? path;
}

export default function App() {
  const { i18n, t } = useTranslation();
  const document = useFileStore((state) => state.document);
  const displayName = useFileStore((state) => state.displayName);
  const isDirty = useFileStore((state) => state.isDirty);
  const loadDocument = useFileStore((state) => state.loadDocument);
  const markSaved = useFileStore((state) => state.markSaved);
  const recentFiles = useFileStore((state) => state.recentFiles);
  const removeRecentFile = useFileStore((state) => state.removeRecentFile);
  const resetUntitled = useFileStore((state) => state.resetUntitled);
  const updateContent = useFileStore((state) => state.updateContent);
  const cycleTheme = useThemeStore((state) => state.cycleTheme);
  const cycleLanguage = useThemeStore((state) => state.cycleLanguage);
  const cycleViewMode = useThemeStore((state) => state.cycleViewMode);
  const languagePreference = useThemeStore((state) => state.languagePreference);
  const resolvedLanguage = useThemeStore((state) => state.resolvedLanguage);
  const themePreference = useThemeStore((state) => state.preference);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const setLanguage = useThemeStore((state) => state.setLanguage);
  const setViewMode = useThemeStore((state) => state.setViewMode);
  const viewMode = useThemeStore((state) => state.viewMode);
  const fontScale = useThemeStore((state) => state.fontScale);
  const increaseFontScaleStore = useThemeStore(
    (state) => state.increaseFontScale
  );
  const decreaseFontScaleStore = useThemeStore(
    (state) => state.decreaseFontScale
  );
  const resetFontScaleStore = useThemeStore((state) => state.resetFontScale);
  const focusMode = useThemeStore((state) => state.focusMode);
  const toggleFocusMode = useThemeStore((state) => state.toggleFocusMode);
  const tocOpen = useThemeStore((state) => state.tocOpen);
  const toggleToc = useThemeStore((state) => state.toggleToc);
  const searchActiveIndex = useSearchStore((state) => state.activeIndex);
  const searchCaseSensitive = useSearchStore((state) => state.caseSensitive);
  const closeSearch = useSearchStore((state) => state.close);
  const goNextSearch = useSearchStore((state) => state.goNext);
  const goPreviousSearch = useSearchStore((state) => state.goPrevious);
  const isSearchOpen = useSearchStore((state) => state.isOpen);
  const normalizeSearchActiveIndex = useSearchStore(
    (state) => state.normalizeActiveIndex
  );
  const openSearch = useSearchStore((state) => state.open);
  const searchQuery = useSearchStore((state) => state.query);
  const setSearchCaseSensitive = useSearchStore(
    (state) => state.setCaseSensitive
  );
  const setSearchQuery = useSearchStore((state) => state.setQuery);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isRecentMenuOpen, setIsRecentMenuOpen] = useState(false);
  const [pendingDirtyAction, setPendingDirtyAction] = useState<
    (() => Promise<void> | void) | null
  >(null);
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const menuHandlersRef = useRef<MenuHandlers>({
    cycleTheme: () => {},
    cycleViewMode: () => {},
    handleNewDocument: () => {},
    handleOpenSearch: () => {},
    handleOpenWithConfirmation: () => {},
    handleSave: () => Promise.resolve(false),
    handleSaveAs: () => Promise.resolve(false),
    openAbout: () => {},
    setLanguage: () => {},
    setViewMode: () => {},
  });
  const searchMatches = useMemo(
    () => findSearchMatches(document.content, searchQuery, searchCaseSensitive),
    [document.content, searchCaseSensitive, searchQuery]
  );
  const searchMatchCount = searchMatches.length;
  const textStats = useMemo(
    () => getTextStats(document.content),
    [document.content]
  );

  const handleSelectHeading = useCallback((line: number) => {
    editorRef.current?.scrollToLine(line);
  }, []);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    window.setTimeout(() => setErrorMessage(null), 4500);
  }, []);

  const requestDirtyConfirmation = useCallback(
    (action: () => Promise<void> | void) => {
      if (!isDirty) {
        void action();
        return;
      }

      setPendingDirtyAction(() => action);
    },
    [isDirty]
  );

  const runPendingDirtyAction = useCallback(async () => {
    const action = pendingDirtyAction;

    setPendingDirtyAction(null);

    if (action) {
      await action();
    }
  }, [pendingDirtyAction]);

  const handleOpenSearch = useCallback(() => {
    if (viewMode === 'preview') {
      setViewMode('split');
    }

    openSearch();
  }, [openSearch, setViewMode, viewMode]);

  const handleCloseSearch = useCallback(() => {
    closeSearch();
    editorRef.current?.focus();
  }, [closeSearch]);

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

  const handleSaveAs = useCallback(async (): Promise<boolean> => {
    try {
      const savedFile = await saveFileDialog({
        content: document.content,
        eol: document.eol,
        suggested: displayName,
      });

      if (savedFile) {
        markSaved(savedFile.savedAt, savedFile.path);
        return true;
      }
    } catch {
      showError(t('errors.saveFailed'));
    }

    return false;
  }, [displayName, document.content, document.eol, markSaved, showError, t]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!document.path) {
      return handleSaveAs();
    }

    try {
      const savedFile = await saveFile({
        path: document.path,
        content: document.content,
        eol: document.eol,
      });

      markSaved(savedFile.savedAt, savedFile.path);
      return true;
    } catch {
      showError(t('errors.saveFailed'));
      return false;
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

  const handleNewDocument = useCallback(() => {
    requestDirtyConfirmation(() => {
      resetUntitled();
      setIsRecentMenuOpen(false);
    });
  }, [requestDirtyConfirmation, resetUntitled]);

  const handleOpenWithConfirmation = useCallback(() => {
    requestDirtyConfirmation(async () => {
      await handleOpen();
      setIsRecentMenuOpen(false);
    });
  }, [handleOpen, requestDirtyConfirmation]);

  const handleOpenRecent = useCallback(
    (path: string) => {
      requestDirtyConfirmation(async () => {
        try {
          const openedFile = await readFile(path);
          loadDocument(openedFile);
          setIsRecentMenuOpen(false);
        } catch {
          removeRecentFile(path);
          showError(t('errors.recentMissing'));
        }
      });
    },
    [loadDocument, removeRecentFile, requestDirtyConfirmation, showError, t]
  );

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

      requestDirtyConfirmation(() => {
        loadDocument({
          path: file.name,
          content,
          eol: content.includes('\r\n') ? 'crlf' : 'lf',
        });
      });
    },
    [loadDocument, requestDirtyConfirmation, showError, t]
  );

  useEffect(() => {
    const title = `${isDirty ? '*' : ''}${displayName} - Bruma`;

    void setAppWindowTitle(title);
  }, [displayName, isDirty]);

  useEffect(() => {
    window.document.documentElement.lang = resolvedLanguage;

    if (i18n.language !== resolvedLanguage) {
      void i18n.changeLanguage(resolvedLanguage);
    }
  }, [i18n, resolvedLanguage]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);

    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    menuHandlersRef.current = {
      cycleTheme,
      cycleViewMode,
      handleNewDocument,
      handleOpenSearch,
      handleOpenWithConfirmation,
      handleSave,
      handleSaveAs,
      openAbout: () => setIsAboutOpen(true),
      setLanguage: (language) => setLanguage(language),
      setViewMode: (nextViewMode) => setViewMode(nextViewMode),
    };
  }, [
    cycleTheme,
    cycleViewMode,
    handleNewDocument,
    handleOpenSearch,
    handleOpenWithConfirmation,
    handleSave,
    handleSaveAs,
    setLanguage,
    setViewMode,
  ]);

  useEffect(() => {
    normalizeSearchActiveIndex(searchMatchCount);
  }, [normalizeSearchActiveIndex, searchMatchCount]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    void syncRecentFilesMenu(recentFiles);
  }, [recentFiles]);

  useEffect(() => {
    if (isTauriRuntime()) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleNewDocument();
      }

      if (modifier && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSaveAs();
        return;
      }

      if (modifier && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        handleOpenWithConfirmation();
      }

      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSave();
      }

      if (modifier && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        handleOpenSearch();
      }

      if (modifier && event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        cycleTheme();
      }

      if (modifier && event.shiftKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        cycleViewMode();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    cycleTheme,
    cycleViewMode,
    handleNewDocument,
    handleOpenWithConfirmation,
    handleOpenSearch,
    handleSave,
    handleSaveAs,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier) return;

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        increaseFontScaleStore();
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        decreaseFontScaleStore();
      } else if (event.key === '0') {
        event.preventDefault();
        resetFontScaleStore();
      } else if (event.shiftKey && event.key.toLowerCase() === 'm') {
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
    decreaseFontScaleStore,
    increaseFontScaleStore,
    resetFontScaleStore,
    toggleFocusMode,
    toggleToc,
  ]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let isDisposed = false;

    void listenToMenuActions((action) => {
      const handlers = menuHandlersRef.current;

      if (action === 'file_new') {
        handlers.handleNewDocument();
      }

      if (action === 'file_open') {
        handlers.handleOpenWithConfirmation();
      }

      if (action === 'file_save') {
        void handlers.handleSave();
      }

      if (action === 'file_save_as') {
        void handlers.handleSaveAs();
      }

      if (action === 'edit_find') {
        handlers.handleOpenSearch();
      }

      if (action === 'view_toggle_theme') {
        handlers.cycleTheme();
      }

      if (action === 'view_editor') {
        handlers.setViewMode('editor');
      }

      if (action === 'view_preview') {
        handlers.setViewMode('preview');
      }

      if (action === 'view_split') {
        handlers.setViewMode('split');
      }

      if (action === 'view_toggle_mode') {
        handlers.cycleViewMode();
      }

      if (action === 'language_es') {
        handlers.setLanguage('es');
      }

      if (action === 'language_en') {
        handlers.setLanguage('en');
      }

      if (action === 'help_about') {
        handlers.openAbout();
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
  }, []);

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

  return (
    <main
      className="flex h-screen min-h-0 flex-col bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] antialiased"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <header
        className={`${focusMode ? 'hidden' : 'flex'} h-14 shrink-0 items-center justify-between border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4`}
      >
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
            onClick={handleNewDocument}
          >
            <FileText className="size-4" aria-hidden />
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('actions.openDocument')}
            title={t('actions.openDocument')}
            onClick={handleOpenWithConfirmation}
          >
            <FileInput className="size-4" aria-hidden />
          </button>
          <div className="relative">
            <button
              className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              type="button"
              aria-expanded={isRecentMenuOpen}
              aria-label={t('recent.open')}
              title={t('recent.open')}
              onClick={() => setIsRecentMenuOpen((isOpen) => !isOpen)}
            >
              <Clock className="size-4" aria-hidden />
            </button>
            {isRecentMenuOpen ? (
              <div
                className="absolute right-0 top-11 z-20 w-72 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-1 text-sm shadow-lg"
                role="menu"
                aria-label={t('recent.open')}
              >
                {recentFiles.length > 0 ? (
                  recentFiles.map((path) => (
                    <button
                      className="block w-full rounded px-3 py-2 text-left text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-control-hover))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      type="button"
                      role="menuitem"
                      key={path}
                      aria-label={`Abrir reciente: ${path}`}
                      title={path}
                      onClick={() => handleOpenRecent(path)}
                    >
                      <span className="block truncate font-medium">
                        {getPathBasename(path)}
                      </span>
                      <span className="block truncate text-xs text-[rgb(var(--color-muted))]">
                        {path}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-[rgb(var(--color-muted))]">
                    {t('recent.empty')}
                  </p>
                )}
              </div>
            ) : null}
          </div>
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
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('language.toggle', {
              language: t(`language.preference.${languagePreference}`),
            })}
            title={t('language.toggle', {
              language: t(`language.preference.${languagePreference}`),
            })}
            onClick={cycleLanguage}
          >
            <Languages className="size-4" aria-hidden />
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 aria-pressed:bg-[rgb(var(--color-control-hover))] aria-pressed:text-[rgb(var(--color-text))]"
            type="button"
            aria-label={t('toc.toggle')}
            title={t('toc.toggle')}
            aria-pressed={tocOpen}
            onClick={toggleToc}
          >
            <List className="size-4" aria-hidden />
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('zoom.decrease')}
            title={t('zoom.decrease')}
            onClick={decreaseFontScaleStore}
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <button
            className="inline-flex h-9 min-w-12 items-center justify-center rounded-md px-2 text-xs text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('zoom.reset')}
            title={t('zoom.reset')}
            onClick={resetFontScaleStore}
          >
            {Math.round(fontScale * 100)}%
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('zoom.increase')}
            title={t('zoom.increase')}
            onClick={increaseFontScaleStore}
          >
            <Plus className="size-4" aria-hidden />
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 aria-pressed:bg-[rgb(var(--color-control-hover))] aria-pressed:text-[rgb(var(--color-text))]"
            type="button"
            aria-label={t('focusMode.toggle')}
            title={t('focusMode.toggle')}
            aria-pressed={focusMode}
            onClick={toggleFocusMode}
          >
            {focusMode ? (
              <Maximize2 className="size-4" aria-hidden />
            ) : (
              <EyeOff className="size-4" aria-hidden />
            )}
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('search.open')}
            title={t('search.open')}
            onClick={handleOpenSearch}
          >
            <Search className="size-4" aria-hidden />
          </button>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            aria-label={t('view.toggle')}
            title={t('view.toggle')}
            onClick={cycleViewMode}
          >
            {viewMode === 'preview' ? (
              <Eye className="size-4" aria-hidden />
            ) : (
              <Columns2 className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </header>

      <section className="flex min-h-0 flex-1">
        {tocOpen ? (
          <TableOfContents
            content={document.content}
            onSelect={handleSelectHeading}
          />
        ) : null}
        <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr]">
          <div
            className={`${focusMode ? 'hidden' : 'flex'} h-10 items-center justify-between border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-panel))] px-4 text-xs text-[rgb(var(--color-muted))]`}
          >
            <div className="flex items-center gap-1">
              {VIEW_MODES.map((mode) => (
                <button
                  className="rounded px-2 py-1 text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 aria-pressed:bg-[rgb(var(--color-control-hover))] aria-pressed:text-[rgb(var(--color-text))]"
                  type="button"
                  aria-pressed={viewMode === mode}
                  aria-label={t('view.selectMode', {
                    mode: t(`view.mode.${mode}`),
                  })}
                  key={mode}
                  onClick={() => setViewMode(mode)}
                >
                  {t(`view.mode.${mode}`)}
                </button>
              ))}
            </div>
            <span>
              {t(`theme.preference.${themePreference}`)} ·{' '}
              {t(`view.mode.${viewMode}`)}
            </span>
          </div>

          <div
            className={
              viewMode === 'split'
                ? 'relative grid min-h-0 grid-cols-2 divide-x divide-[rgb(var(--color-border))]'
                : 'relative min-h-0'
            }
          >
            {isSearchOpen ? (
              <SearchPanel
                activeIndex={searchActiveIndex}
                caseSensitive={searchCaseSensitive}
                matchCount={searchMatchCount}
                query={searchQuery}
                onCaseSensitiveChange={setSearchCaseSensitive}
                onClose={handleCloseSearch}
                onNext={() => goNextSearch(searchMatchCount)}
                onPrevious={() => goPreviousSearch(searchMatchCount)}
                onQueryChange={setSearchQuery}
              />
            ) : null}
            {viewMode !== 'preview' ? (
              <MarkdownEditor
                ref={editorRef}
                activeSearchIndex={searchActiveIndex}
                ariaLabel={t('editor.label')}
                placeholder={t('editor.placeholder')}
                searchMatches={searchMatches}
                value={document.content}
                onChange={updateContent}
              />
            ) : null}
            {viewMode !== 'editor' ? (
              <Preview content={document.content} />
            ) : null}
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div
          className="fixed bottom-12 right-4 max-w-sm rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          role="status"
        >
          {errorMessage}
        </div>
      ) : null}

      <ConfirmDirtyDialog
        open={Boolean(pendingDirtyAction)}
        onCancel={() => setPendingDirtyAction(null)}
        onDiscard={() => void runPendingDirtyAction()}
        onSave={() => {
          void (async () => {
            const saved = await handleSave();

            if (saved) {
              await runPendingDirtyAction();
            }
          })();
        }}
      />

      {isAboutOpen ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 px-4">
          <section
            className="w-full max-w-md rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-dialog-title"
          >
            <h2 className="text-base font-semibold" id="about-dialog-title">
              {t('about.title')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-muted))]">
              {t('about.body')}
            </p>
            <p className="mt-1 text-sm leading-6 text-[rgb(var(--color-muted))]">
              {t('about.version', { version: APP_VERSION })}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                className="rounded-md px-3 py-2 text-sm text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                type="button"
                onClick={() => setIsAboutOpen(false)}
              >
                {t('about.close')}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <footer
        className={`${focusMode ? 'hidden' : 'flex'} h-8 shrink-0 items-center justify-between border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 text-xs text-[rgb(var(--color-muted))]`}
      >
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
          <span aria-label={t('stats.words')} title={t('stats.words')}>
            {t('stats.wordsValue', { count: textStats.words })}
          </span>
          <span
            aria-label={t('stats.characters')}
            title={t('stats.characters')}
          >
            {t('stats.charactersValue', { count: textStats.characters })}
          </span>
          <span>{document.encoding.toUpperCase()}</span>
          <span>{document.eol.toUpperCase()}</span>
          <span>{t(`language.preference.${languagePreference}`)}</span>
          <span>{t(`theme.resolved.${resolvedTheme}`)}</span>
        </div>
      </footer>
    </main>
  );
}
