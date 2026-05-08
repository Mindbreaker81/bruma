import {
  type DragEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { MarkdownEditorHandle } from './features/editor/MarkdownEditor';
import type { FormatCommandId } from './features/editor/formatCommands';
import { type Tab } from './features/files/document';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { TooltipProvider } from './components/ui/tooltip';
import {
  openFileDialog,
  readFile,
  readImageAsDataUrl,
  saveExportDialog,
  saveFile,
  saveFileDialog,
  syncRecentFilesMenu,
} from './features/files/ipc';
import { TabBar } from './features/files/TabBar';
import { useFileStore } from './features/files/state';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from './features/settings/state';
import { useTauriMenuBridge } from './hooks/useTauriMenuBridge';
import { getAllTemplates } from './features/templates/templates';
import { isDirty as isDocumentDirty } from './features/files/document';
import { clearSession, readSession, writeSession } from './lib/session';
import { stripFrontmatter } from './lib/frontmatter';
import { renderSafeMarkdown } from './lib/markdown';
import {
  findSearchMatches,
  replaceAllMatches,
  replaceMatchAt,
} from './features/search/search';
import { useSearchStore } from './features/search/state';
import type { ViewMode } from './features/settings/view';
import { StatusBar } from './features/shell/StatusBar';
import { FormatToolbar } from './features/shell/toolbar/FormatToolbar';
import { MarkdownGuide } from './features/shell/MarkdownGuide';
import { ToolbarExport } from './features/shell/toolbar/ToolbarExport';
import { ToolbarFile } from './features/shell/toolbar/ToolbarFile';
import { ToolbarView } from './features/shell/toolbar/ToolbarView';
import { ToolbarWrite } from './features/shell/toolbar/ToolbarWrite';
import { ToolbarZoom } from './features/shell/toolbar/ToolbarZoom';
import { AppShell } from './features/shell/AppShell';
import { ViewModeBar } from './features/shell/ViewModeBar';
import { WelcomeState } from './features/shell/WelcomeState';
import { useSplitScrollSync } from './features/shell/useSplitScrollSync';
import { APP_VERSION } from './lib/app';
import { getTextStats } from './lib/textStats';
import type { Template } from './features/templates/templates';
import { X } from 'lucide-react';
import {
  isTauriRuntime,
  printCurrentWindow,
  setAppWindowTitle,
} from './lib/tauri';

const ConfirmDirtyDialog = lazy(() =>
  import('./features/files/ConfirmDirtyDialog').then((module) => ({
    default: module.ConfirmDirtyDialog,
  }))
);

const RestoreSessionDialog = lazy(() =>
  import('./features/files/RestoreSessionDialog').then((module) => ({
    default: module.RestoreSessionDialog,
  }))
);

const PreferencesDialog = lazy(() =>
  import('./features/settings/PreferencesDialog').then((module) => ({
    default: module.PreferencesDialog,
  }))
);

const SearchPanel = lazy(() =>
  import('./features/search/SearchPanel').then((module) => ({
    default: module.SearchPanel,
  }))
);

const TableOfContents = lazy(() =>
  import('./features/toc/TableOfContents').then((module) => ({
    default: module.TableOfContents,
  }))
);

const Preview = lazy(() =>
  import('./features/preview/Preview').then((module) => ({
    default: module.Preview,
  }))
);

const MarkdownEditor = lazy(() =>
  import('./features/editor/MarkdownEditor').then((module) => ({
    default: module.MarkdownEditor,
  }))
);

const PRINT_DELAY_MS = 100;

type MenuHandlers = {
  cycleTheme: () => void;
  cycleViewMode: () => void;
  handleNewDocument: () => void;
  handleOpenSearch: () => void;
  handleOpenWithConfirmation: () => void;
  handlePrint: () => void;
  handleSave: () => Promise<boolean>;
  handleSaveAs: () => Promise<boolean>;
  openAbout: () => void;
  setLanguage: (language: 'es' | 'en') => void;
  setViewMode: (nextViewMode: ViewMode) => void;
};

export default function App() {
  const { i18n, t } = useTranslation();
  const { document, displayName, isDirty, openTab, closeTab } = useFileStore(
    useShallow((state) => ({
      document: state.document,
      displayName: state.displayName,
      isDirty: state.isDirty,
      openTab: state.openTab,
      closeTab: state.closeTab,
    }))
  );
  const {
    activateTab,
    moveTab,
    tabs,
    activeTabId,
    markSaved,
    restoreSession,
    recentFiles,
    removeRecentFile,
    resetUntitled,
    updateContent,
  } = useFileStore(
    useShallow((state) => ({
      activateTab: state.activateTab,
      moveTab: state.moveTab,
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      markSaved: state.markSaved,
      restoreSession: state.restoreSession,
      recentFiles: state.recentFiles,
      removeRecentFile: state.removeRecentFile,
      resetUntitled: state.resetUntitled,
      updateContent: state.updateContent,
    }))
  );
  const {
    cycleTheme,
    cycleLanguage,
    cycleViewMode,
    languagePreference,
    resolvedLanguage,
    themePreference,
    resolvedTheme,
    setLanguage,
    setViewMode,
    viewMode,
    fontScale,
    increaseFontScale,
    decreaseFontScale,
    resetFontScale,
    focusMode,
    toggleFocusMode,
    tocOpen,
    toggleToc,
    showFrontmatter,
    toggleShowFrontmatter,
    autosaveEnabled,
    setAutosaveEnabled,
    autosaveDelayMs,
    setAutosaveDelayMs,
    editorFontFamily,
    setEditorFontFamily,
    editorTabSize,
    setEditorTabSize,
    editorShowGutter,
    setEditorShowGutter,
    editorWrap,
    setEditorWrap,
    previewMaxWidth,
    setPreviewMaxWidth,
    previewShowToc,
    setPreviewShowToc,
    splitScrollSync,
    setSplitScrollSync,
  } = useThemeStore(
    useShallow((state) => ({
      cycleTheme: state.cycleTheme,
      cycleLanguage: state.cycleLanguage,
      cycleViewMode: state.cycleViewMode,
      languagePreference: state.languagePreference,
      resolvedLanguage: state.resolvedLanguage,
      themePreference: state.preference,
      resolvedTheme: state.resolvedTheme,
      setLanguage: state.setLanguage,
      setViewMode: state.setViewMode,
      viewMode: state.viewMode,
      fontScale: state.fontScale,
      increaseFontScale: state.increaseFontScale,
      decreaseFontScale: state.decreaseFontScale,
      resetFontScale: state.resetFontScale,
      focusMode: state.focusMode,
      toggleFocusMode: state.toggleFocusMode,
      tocOpen: state.tocOpen,
      toggleToc: state.toggleToc,
      showFrontmatter: state.showFrontmatter,
      toggleShowFrontmatter: state.toggleShowFrontmatter,
      autosaveEnabled: state.autosaveEnabled,
      setAutosaveEnabled: state.setAutosaveEnabled,
      autosaveDelayMs: state.autosaveDelayMs,
      setAutosaveDelayMs: state.setAutosaveDelayMs,
      editorFontFamily: state.editorFontFamily,
      setEditorFontFamily: state.setEditorFontFamily,
      editorTabSize: state.editorTabSize,
      setEditorTabSize: state.setEditorTabSize,
      editorShowGutter: state.editorShowGutter,
      setEditorShowGutter: state.setEditorShowGutter,
      editorWrap: state.editorWrap,
      setEditorWrap: state.setEditorWrap,
      previewMaxWidth: state.previewMaxWidth,
      setPreviewMaxWidth: state.setPreviewMaxWidth,
      previewShowToc: state.previewShowToc,
      setPreviewShowToc: state.setPreviewShowToc,
      splitScrollSync: state.splitScrollSync,
      setSplitScrollSync: state.setSplitScrollSync,
    }))
  );
  const {
    searchActiveIndex,
    searchCaseSensitive,
    closeSearch,
    goNext,
    goPrevious,
    isOpen: isSearchOpen,
    normalizeActiveIndex,
  } = useSearchStore(
    useShallow((state) => ({
      searchActiveIndex: state.activeIndex,
      searchCaseSensitive: state.caseSensitive,
      closeSearch: state.close,
      goNext: state.goNext,
      goPrevious: state.goPrevious,
      isOpen: state.isOpen,
      normalizeActiveIndex: state.normalizeActiveIndex,
    }))
  );
  const {
    open: openSearch,
    query: searchQuery,
    setCaseSensitive: setSearchCaseSensitive,
    setQuery: setSearchQuery,
    replaceQuery,
    replaceMode,
    setReplaceQuery,
    toggleReplaceMode,
  } = useSearchStore(
    useShallow((state) => ({
      open: state.open,
      query: state.query,
      setCaseSensitive: state.setCaseSensitive,
      setQuery: state.setQuery,
      replaceQuery: state.replaceQuery,
      replaceMode: state.replaceMode,
      setReplaceQuery: state.setReplaceQuery,
      toggleReplaceMode: state.toggleReplaceMode,
    }))
  );
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isRecentMenuOpen, setIsRecentMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);

  // Load custom templates on mount
  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    let isCancelled = false;

    void getAllTemplates().then((templates) => {
      if (isCancelled) return;
      const custom = templates.filter((t) => t.isCustom);
      setCustomTemplates(custom);
    });

    return () => {
      isCancelled = true;
    };
  }, []);
  const [externalLinkPrompt, setExternalLinkPrompt] = useState<string | null>(
    null
  );
  const [pendingDirtyAction, setPendingDirtyAction] = useState<
    (() => Promise<void> | void) | null
  >(null);
  const [autosaveStatus, setAutosaveStatus] = useState<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isMarkdownGuideOpen, setIsMarkdownGuideOpen] = useState(false);
  const [activeFormats, setActiveFormats] = useState<
    ReadonlySet<FormatCommandId>
  >(() => new Set());
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const pendingSessionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingSession, setPendingSession] = useState<{
    path: string | null;
    content: string;
    eol: 'lf' | 'crlf';
    tabs?: Tab[];
    activeTabId?: string | null;
  } | null>(null);
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const previewRef = useRef<HTMLElement | null>(null);

  useSplitScrollSync({
    enabled: viewMode === 'split' && splitScrollSync,
    editorHandleRef: editorRef,
    previewRef,
  });
  const menuHandlersRef = useRef<MenuHandlers>({
    cycleTheme: () => {},
    cycleViewMode: () => {},
    handleNewDocument: () => {},
    handleOpenSearch: () => {},
    handleOpenWithConfirmation: () => {},
    handlePrint: () => {},
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
  const isWelcomeCandidate =
    tabs.length === 1 &&
    !document.path &&
    document.content.trim().length === 0 &&
    !focusMode;
  const showWelcomeState =
    isWelcomeCandidate && !welcomeDismissed && viewMode !== 'preview';

  useEffect(() => {
    if (!isWelcomeCandidate) {
      setWelcomeDismissed(false);
    }
  }, [isWelcomeCandidate]);

  const handleSelectHeading = useCallback((line: number) => {
    editorRef.current?.scrollToLine(line);
  }, []);

  const handleReplaceOne = useCallback(() => {
    if (searchMatchCount === 0) return;
    const result = replaceMatchAt(
      document.content,
      searchMatches,
      searchActiveIndex,
      replaceQuery
    );
    if (result.replacements > 0) {
      updateContent(result.content);
    }
  }, [
    document.content,
    replaceQuery,
    searchActiveIndex,
    searchMatchCount,
    searchMatches,
    updateContent,
  ]);

  const handleReplaceAll = useCallback(() => {
    if (searchMatchCount === 0) return;
    const result = replaceAllMatches(
      document.content,
      searchMatches,
      replaceQuery
    );
    if (result.replacements > 0) {
      updateContent(result.content);
    }
  }, [
    document.content,
    replaceQuery,
    searchMatchCount,
    searchMatches,
    updateContent,
  ]);

  const showError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const handleExportHtml = useCallback(
    async (includeStyles: boolean) => {
      try {
        const { buildExportHtml } = await import('./lib/export');
        const html = buildExportHtml(document.content, {
          title: displayName,
          includeStyles,
        });
        await saveExportDialog({
          content: html,
          extension: 'html',
          label: 'HTML',
          suggested: displayName.replace(/\.(md|markdown)$/i, '') || 'export',
        });
        setIsExportMenuOpen(false);
      } catch (error) {
        console.error('HTML export failed:', error);
        showError(t('errors.exportFailed'));
      }
    },
    [displayName, document.content, showError, t]
  );

  const handlePrint = useCallback(() => {
    const source = showFrontmatter
      ? document.content
      : stripFrontmatter(document.content);
    setPrintHtml(renderSafeMarkdown(source));

    window.setTimeout(() => {
      void printCurrentWindow().catch((error) => {
        console.error('Print failed:', error);
        window.print();
      });
    }, PRINT_DELAY_MS);
  }, [document.content, showFrontmatter]);

  const handleExternalLinkClick = useCallback((href: string) => {
    setExternalLinkPrompt(href);
  }, []);

  const confirmExternalLink = useCallback(() => {
    const href = externalLinkPrompt;
    setExternalLinkPrompt(null);
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
  }, [externalLinkPrompt]);

  const documentBasePath = document.path ?? null;
  const handleLocalImageRequest = useCallback(
    async (relative: string) => {
      if (!documentBasePath) return null;
      return readImageAsDataUrl(documentBasePath, relative);
    },
    [documentBasePath]
  );

  const handleCloseTab = useCallback(
    (id: string) => {
      const tab = tabs.find((t) => t.id === id);
      if (!tab) return;
      if (!isDocumentDirty(tab.document)) {
        closeTab(id);
        return;
      }
      activateTab(id);
      setPendingDirtyAction(() => () => {
        closeTab(id);
      });
    },
    [tabs, closeTab, activateTab]
  );

  const handleActivateTab = useCallback(
    (id: string) => {
      activateTab(id);
    },
    [activateTab]
  );

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
        clearSession();
        openTab(openedFile);
      }
    } catch {
      showError(t('errors.openFailed'));
    }
  }, [openTab, showError, t]);

  const handleSaveAs = useCallback(async (): Promise<boolean> => {
    try {
      const savedFile = await saveFileDialog({
        content: document.content,
        eol: document.eol,
        suggested: displayName,
      });

      if (savedFile) {
        markSaved(savedFile.savedAt, savedFile.path);
        clearSession();
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
      clearSession();
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
      clearSession();
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
          clearSession();
          openTab(openedFile);
          setIsRecentMenuOpen(false);
        } catch {
          removeRecentFile(path);
          showError(t('errors.recentMissing'));
        }
      });
    },
    [openTab, removeRecentFile, requestDirtyConfirmation, showError, t]
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
        clearSession();
        openTab({
          path: file.name,
          content,
          eol: content.includes('\r\n') ? 'crlf' : 'lf',
        });
      });
    },
    [openTab, requestDirtyConfirmation, showError, t]
  );

  useEffect(() => {
    const title = `${isDirty ? '*' : ''}${displayName} - Bruma`;

    void setAppWindowTitle(title);
  }, [displayName, isDirty]);

  useEffect(() => {
    const session = readSession();
    if (!session) return;
    setPendingSession(session);

    if (session.tabs && session.tabs.length > 0) {
      setIsRestoreDialogOpen(true);
      return;
    }

    const path = session.path;
    if (path) {
      void (async () => {
        try {
          const file = await readFile(path);
          if (file.content !== session.content) {
            setIsRestoreDialogOpen(true);
          } else {
            clearSession();
            setPendingSession(null);
          }
        } catch {
          setIsRestoreDialogOpen(true);
        }
      })();
    } else {
      setIsRestoreDialogOpen(true);
    }
  }, []);

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
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (!autosaveEnabled || !isDirty || !document.path) {
      return;
    }

    setAutosaveStatus(t('autosave.savingNow'));

    autosaveTimerRef.current = setTimeout(() => {
      void (async () => {
        const saved = await handleSave();
        if (saved) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString(resolvedLanguage, {
            hour: '2-digit',
            minute: '2-digit',
          });
          setAutosaveStatus(t('autosave.lastSavedAt', { time: timeStr }));
        } else {
          setAutosaveStatus(null);
        }
        window.setTimeout(() => setAutosaveStatus(null), 3000);
      })();
    }, autosaveDelayMs);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [
    autosaveEnabled,
    autosaveDelayMs,
    document.content,
    document.path,
    handleSave,
    isDirty,
    resolvedLanguage,
    t,
  ]);

  useEffect(() => {
    menuHandlersRef.current = {
      cycleTheme,
      cycleViewMode,
      handleNewDocument,
      handleOpenSearch,
      handleOpenWithConfirmation,
      handlePrint,
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
    handlePrint,
    handleSave,
    handleSaveAs,
    setLanguage,
    setViewMode,
  ]);

  useEffect(() => {
    normalizeActiveIndex(searchMatchCount);
  }, [normalizeActiveIndex, searchMatchCount]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    void syncRecentFilesMenu(recentFiles);
  }, [recentFiles]);

  useEffect(() => {
    if (pendingSessionRef.current) {
      clearTimeout(pendingSessionRef.current);
      pendingSessionRef.current = null;
    }

    if (!isDirty) {
      return;
    }

    pendingSessionRef.current = setTimeout(() => {
      writeSession({
        path: document.path,
        content: document.content,
        eol: document.eol,
        savedAt: Date.now(),
        tabs,
        activeTabId,
      });
    }, 500);

    return () => {
      if (pendingSessionRef.current) {
        clearTimeout(pendingSessionRef.current);
        pendingSessionRef.current = null;
      }
    };
  }, [
    document.content,
    document.path,
    document.eol,
    isDirty,
    tabs,
    activeTabId,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier) return;

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
    resetFontScale,
    toggleFocusMode,
    toggleToc,
  ]);

  useTauriMenuBridge({
    handlers: menuHandlersRef,
    setIsPreferencesOpen,
    setIsAboutOpen,
    handleOpenRecent,
  });

  const isTauri =
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );
  useEffect(() => {
    if (isTauri) return;
    const onResize = () => setIsNarrow(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isTauri]);

  if (!isTauri && isNarrow) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-6 text-foreground">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold">{t('mobileFallback.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('mobileFallback.body')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={400}>
      <AppShell
        dataFocus={focusMode}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <header
          className={`${focusMode ? 'hidden' : 'flex'} relative z-shell shrink-0 flex-col gap-4 border-b border-white/50 bg-white/70 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70`}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(4,120,87,0.25)]">
                B
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-[-0.04em]">
                  {t('app.name')}
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  {displayName}
                  {isDirty ? ` ${t('document.dirtyMark')}` : ''}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-400/15 dark:text-emerald-50">
                {t('app.tagline')}
              </span>
            </div>
          </div>

          <div className="-mx-1 flex w-full items-center gap-2 overflow-x-auto px-1 [scrollbar-width:thin] xl:flex-wrap xl:overflow-x-visible">
            <ToolbarFile
              isTemplateMenuOpen={isTemplateMenuOpen}
              setIsTemplateMenuOpen={setIsTemplateMenuOpen}
              customTemplates={customTemplates}
              requestDirtyConfirmation={requestDirtyConfirmation}
              clearSession={clearSession}
              resetUntitled={resetUntitled}
              updateContent={updateContent}
              setWelcomeDismissed={setWelcomeDismissed}
              handleOpenWithConfirmation={handleOpenWithConfirmation}
              isRecentMenuOpen={isRecentMenuOpen}
              setIsRecentMenuOpen={setIsRecentMenuOpen}
              recentFiles={recentFiles}
              handleOpenRecent={handleOpenRecent}
              handleSave={handleSave}
              handlePrint={handlePrint}
            />
            <ToolbarWrite
              autosaveEnabled={autosaveEnabled}
              setAutosaveEnabled={setAutosaveEnabled}
              handleOpenSearch={handleOpenSearch}
            />
            <ToolbarView
              cycleTheme={cycleTheme}
              cycleLanguage={cycleLanguage}
              toggleToc={toggleToc}
              tocOpen={tocOpen}
              focusMode={focusMode}
              toggleFocusMode={toggleFocusMode}
              viewMode={viewMode}
              cycleViewMode={cycleViewMode}
            />
            <ToolbarZoom
              fontScale={fontScale}
              resetFontScaleStore={resetFontScale}
              decreaseFontScaleStore={decreaseFontScale}
              increaseFontScaleStore={increaseFontScale}
            />
            <ToolbarExport
              isExportMenuOpen={isExportMenuOpen}
              setIsExportMenuOpen={setIsExportMenuOpen}
              handleExportHtml={handleExportHtml}
            />
          </div>
        </header>

        {focusMode && (
          <button
            type="button"
            onClick={toggleFocusMode}
            className="fixed right-4 top-4 z-overlay rounded-full bg-primary p-2 text-primary-foreground shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={t('focusMode.toggle')}
            title={t('focusMode.toggle')}
          >
            <X className="size-5" aria-hidden />
          </button>
        )}

        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onActivate={handleActivateTab}
          onClose={handleCloseTab}
          onMove={moveTab}
        />

        <section className="relative z-shell flex min-h-0 flex-1">
          <Suspense fallback={null}>
            {tocOpen ? (
              <TableOfContents
                content={document.content}
                onSelect={handleSelectHeading}
              />
            ) : null}
          </Suspense>
          <div className="flex min-h-0 flex-1 flex-col">
            <ViewModeBar
              focusMode={focusMode}
              setSplitScrollSync={setSplitScrollSync}
              setViewMode={setViewMode}
              showFrontmatter={showFrontmatter}
              splitScrollSync={splitScrollSync}
              themePreference={themePreference}
              toggleShowFrontmatter={toggleShowFrontmatter}
              viewMode={viewMode}
            />

            {viewMode !== 'preview' && !focusMode && !showWelcomeState ? (
              <FormatToolbar
                editorRef={editorRef}
                activeFormats={activeFormats}
                onOpenGuide={() => setIsMarkdownGuideOpen(true)}
              />
            ) : null}

            <div
              className={
                viewMode === 'split'
                  ? 'relative grid min-h-0 flex-1 grid-cols-2 divide-x divide-border'
                  : 'relative flex min-h-0 flex-1 flex-col'
              }
            >
              <Suspense fallback={null}>
                {isSearchOpen ? (
                  <SearchPanel
                    activeIndex={searchActiveIndex}
                    caseSensitive={searchCaseSensitive}
                    matchCount={searchMatchCount}
                    query={searchQuery}
                    replaceMode={replaceMode}
                    replaceQuery={replaceQuery}
                    onCaseSensitiveChange={setSearchCaseSensitive}
                    onClose={handleCloseSearch}
                    onNext={() => goNext(searchMatchCount)}
                    onPrevious={() => goPrevious(searchMatchCount)}
                    onQueryChange={setSearchQuery}
                    onReplaceAll={handleReplaceAll}
                    onReplaceOne={handleReplaceOne}
                    onReplaceQueryChange={setReplaceQuery}
                    onToggleReplace={toggleReplaceMode}
                  />
                ) : null}
              </Suspense>
              {viewMode !== 'preview' ? (
                <div className="relative min-h-0 flex-1 overflow-hidden bg-background/60">
                  {showWelcomeState ? (
                    <WelcomeState
                      recentFiles={recentFiles}
                      onDismiss={() => setWelcomeDismissed(true)}
                      onNewDocument={handleNewDocument}
                      onOpenDocument={handleOpenWithConfirmation}
                      onOpenRecent={handleOpenRecent}
                    />
                  ) : null}
                  <div
                    className="contents"
                    aria-hidden={showWelcomeState || undefined}
                    {...(showWelcomeState
                      ? ({ inert: '' } as Record<string, string>)
                      : {})}
                  >
                    <Suspense
                      fallback={
                        <div
                          role="textbox"
                          aria-label={t('editor.label')}
                          className="bruma-editor h-full min-h-0 bg-background"
                        />
                      }
                    >
                      <MarkdownEditor
                        ref={editorRef}
                        activeSearchIndex={isSearchOpen ? searchActiveIndex : 0}
                        ariaLabel={t('editor.label')}
                        placeholder={t('editor.placeholder')}
                        searchMatches={isSearchOpen ? searchMatches : []}
                        value={document.content}
                        onChange={(nextValue) => {
                          setWelcomeDismissed(true);
                          updateContent(nextValue);
                        }}
                        tabSize={editorTabSize}
                        lineWrapping={editorWrap}
                        fontFamily={editorFontFamily}
                        onActiveFormatsChange={setActiveFormats}
                      />
                    </Suspense>
                  </div>
                </div>
              ) : null}
              {viewMode !== 'editor' ? (
                <Suspense
                  fallback={
                    <div
                      aria-hidden
                      className="flex min-h-0 flex-1 overflow-hidden bg-background"
                    />
                  }
                >
                  <div className="relative flex min-h-0 flex-1 overflow-hidden bg-background">
                    <Preview
                      scrollContainerRef={previewRef}
                      content={document.content}
                      documentPath={document.path ?? null}
                      hideFrontmatter={!showFrontmatter}
                      onExternalLinkClick={handleExternalLinkClick}
                      onLocalImageRequest={handleLocalImageRequest}
                      maxWidth={previewMaxWidth}
                    />
                  </div>
                </Suspense>
              ) : null}
            </div>
          </div>
        </section>

        {printHtml ? (
          <div
            aria-hidden
            className="bruma-print-document"
            dangerouslySetInnerHTML={{ __html: printHtml }}
          />
        ) : null}

        <Suspense fallback={null}>
          {pendingDirtyAction ? (
            <ConfirmDirtyDialog
              open
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
          ) : null}

          {isRestoreDialogOpen ? (
            <RestoreSessionDialog
              open
              hasPath={
                Boolean(pendingSession?.path) ||
                Boolean(pendingSession?.tabs?.length)
              }
              onRecover={() => {
                if (pendingSession) {
                  if (pendingSession.tabs && pendingSession.tabs.length > 0) {
                    restoreSession(
                      pendingSession.tabs,
                      pendingSession.activeTabId ?? null
                    );
                  } else if (pendingSession.path) {
                    openTab({
                      path: pendingSession.path,
                      content: pendingSession.content,
                      eol: pendingSession.eol,
                    });
                  } else {
                    updateContent(pendingSession.content);
                  }
                }
                setIsRestoreDialogOpen(false);
                clearSession();
                setPendingSession(null);
              }}
              onDiscard={() => {
                setIsRestoreDialogOpen(false);
                clearSession();
                setPendingSession(null);
              }}
            />
          ) : null}

          <MarkdownGuide
            open={isMarkdownGuideOpen}
            onOpenChange={setIsMarkdownGuideOpen}
            editorRef={editorRef}
          />

          {isPreferencesOpen ? (
            <PreferencesDialog
              open
              onClose={() => setIsPreferencesOpen(false)}
              autosaveEnabled={autosaveEnabled}
              autosaveDelayMs={autosaveDelayMs}
              editorFontFamily={editorFontFamily}
              editorTabSize={editorTabSize}
              editorShowGutter={editorShowGutter}
              editorWrap={editorWrap}
              previewMaxWidth={previewMaxWidth}
              previewShowToc={previewShowToc}
              onAutosaveEnabledChange={setAutosaveEnabled}
              onAutosaveDelayMsChange={setAutosaveDelayMs}
              onEditorFontFamilyChange={setEditorFontFamily}
              onEditorTabSizeChange={setEditorTabSize}
              onEditorShowGutterChange={setEditorShowGutter}
              onEditorWrapChange={setEditorWrap}
              onPreviewMaxWidthChange={setPreviewMaxWidth}
              onPreviewShowTocChange={setPreviewShowToc}
            />
          ) : null}
        </Suspense>

        <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('about.title')}</DialogTitle>
              <DialogDescription>{t('about.body')}</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t('about.version', { version: APP_VERSION })}
            </p>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(externalLinkPrompt)}
          onOpenChange={(open) => !open && setExternalLinkPrompt(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('externalLink.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('externalLink.body')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <p className="mt-2 break-all rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
              {externalLinkPrompt}
            </p>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setExternalLinkPrompt(null)}>
                {t('externalLink.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmExternalLink}
                className="bg-emerald-700 text-white hover:bg-emerald-800"
              >
                {t('externalLink.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {!focusMode ? (
          <StatusBar
            autosaveStatus={autosaveStatus}
            characters={textStats.characters}
            displayName={displayName}
            encoding={document.encoding}
            eol={document.eol}
            isDirty={isDirty}
            languagePreference={languagePreference}
            resolvedTheme={resolvedTheme}
            words={textStats.words}
          />
        ) : null}
      </AppShell>
    </TooltipProvider>
  );
}
