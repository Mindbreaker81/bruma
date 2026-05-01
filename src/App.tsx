import Columns2 from 'lucide-react/dist/esm/icons/columns-2.js';
import Clock from 'lucide-react/dist/esm/icons/clock.js';
import Download from 'lucide-react/dist/esm/icons/download.js';
import Eye from 'lucide-react/dist/esm/icons/eye.js';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off.js';
import FileInput from 'lucide-react/dist/esm/icons/file-input.js';
import FileText from 'lucide-react/dist/esm/icons/file-text.js';
import Keyboard from 'lucide-react/dist/esm/icons/keyboard.js';
import Languages from 'lucide-react/dist/esm/icons/languages.js';
import LinkIcon from 'lucide-react/dist/esm/icons/link.js';
import List from 'lucide-react/dist/esm/icons/list.js';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2.js';
import Minus from 'lucide-react/dist/esm/icons/minus.js';
import Moon from 'lucide-react/dist/esm/icons/moon.js';
import Plus from 'lucide-react/dist/esm/icons/plus.js';
import Save from 'lucide-react/dist/esm/icons/save.js';
import Search from 'lucide-react/dist/esm/icons/search.js';
import X from 'lucide-react/dist/esm/icons/x.js';
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
import { Switch } from './components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { Button } from './components/ui/button';
import { IconButton, ToolbarGroup } from './components/ui/icon-button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './components/ui/tooltip';
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
import {
  getAllTemplates,
  loadCustomTemplate,
  BUILTIN_TEMPLATES,
  applyTemplate,
} from './features/templates/templates';
import { isDirty as isDocumentDirty } from './features/files/document';
import { clearSession, readSession, writeSession } from './lib/session';
import { useScrollSyncStore } from './features/preview/scrollSync';
import {
  findSearchMatches,
  replaceAllMatches,
  replaceMatchAt,
} from './features/search/search';
import { useSearchStore } from './features/search/state';
import { useThemeStore } from './features/settings/state';
import type { ViewMode } from './features/settings/view';
import { StatusBar } from './features/shell/StatusBar';
import { WelcomeState } from './features/shell/WelcomeState';
import { APP_VERSION } from './lib/app';
import { patchConfig, readConfig } from './lib/config';
import { getTextStats } from './lib/textStats';
import type { CommandId } from './lib/shortcuts';
import { useShortcutRegistry } from './lib/useShortcut';
import type { Template } from './features/templates/templates';
import {
  isTauriRuntime,
  listenToMenuActions,
  listenToRecentOpen,
  setAppWindowTitle,
} from './lib/tauri';

const VIEW_MODES: ViewMode[] = ['editor', 'split', 'preview'];

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

const ShortcutsDialog = lazy(() =>
  import('./features/settings/ShortcutsDialog').then((module) => ({
    default: module.ShortcutsDialog,
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
  const openTab = useFileStore((state) => state.openTab);
  const closeTab = useFileStore((state) => state.closeTab);
  const activateTab = useFileStore((state) => state.activateTab);
  const moveTab = useFileStore((state) => state.moveTab);
  const tabs = useFileStore((state) => state.tabs);
  const activeTabId = useFileStore((state) => state.activeTabId);
  const markSaved = useFileStore((state) => state.markSaved);
  const restoreSession = useFileStore((state) => state.restoreSession);
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
  const scrollSyncEnabled = useScrollSyncStore((state) => state.enabled);
  const toggleScrollSync = useScrollSyncStore((state) => state.toggle);
  const showFrontmatter = useThemeStore((state) => state.showFrontmatter);
  const toggleShowFrontmatter = useThemeStore(
    (state) => state.toggleShowFrontmatter
  );
  const autosaveEnabled = useThemeStore((state) => state.autosaveEnabled);
  const setAutosaveEnabled = useThemeStore((state) => state.setAutosaveEnabled);
  const autosaveDelayMs = useThemeStore((state) => state.autosaveDelayMs);
  const setAutosaveDelayMs = useThemeStore((state) => state.setAutosaveDelayMs);
  const editorFontFamily = useThemeStore((state) => state.editorFontFamily);
  const setEditorFontFamily = useThemeStore(
    (state) => state.setEditorFontFamily
  );
  const editorTabSize = useThemeStore((state) => state.editorTabSize);
  const setEditorTabSize = useThemeStore((state) => state.setEditorTabSize);
  const editorShowGutter = useThemeStore((state) => state.editorShowGutter);
  const setEditorShowGutter = useThemeStore(
    (state) => state.setEditorShowGutter
  );
  const editorWrap = useThemeStore((state) => state.editorWrap);
  const setEditorWrap = useThemeStore((state) => state.setEditorWrap);
  const previewMaxWidth = useThemeStore((state) => state.previewMaxWidth);
  const setPreviewMaxWidth = useThemeStore((state) => state.setPreviewMaxWidth);
  const previewShowToc = useThemeStore((state) => state.previewShowToc);
  const setPreviewShowToc = useThemeStore((state) => state.setPreviewShowToc);
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
  const replaceQuery = useSearchStore((state) => state.replaceQuery);
  const replaceMode = useSearchStore((state) => state.replaceMode);
  const setReplaceQuery = useSearchStore((state) => state.setReplaceQuery);
  const toggleReplaceMode = useSearchStore((state) => state.toggleReplaceMode);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isRecentMenuOpen, setIsRecentMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [shortcuts, setShortcutsState] = useState<
    Partial<Record<CommandId, string | null>>
  >(() => readConfig().shortcuts);
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
      } catch {
        showError(t('errors.exportFailed'));
      }
    },
    [displayName, document.content, showError, t]
  );

  const handleExportPdf = useCallback(() => {
    setIsExportMenuOpen(false);
    // Best-effort: rely on the print-to-PDF dialog provided by the OS.
    // CSS in print media restricts to the preview surface only.
    window.setTimeout(() => window.print(), 100);
  }, []);

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

  const handleNewTab = useCallback(() => {
    requestDirtyConfirmation(() => {
      clearSession();
      resetUntitled();
    });
  }, [requestDirtyConfirmation, resetUntitled]);

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

  const shortcutHandlers = useMemo<Partial<Record<CommandId, () => void>>>(
    () => ({
      newDocument: handleNewDocument,
      openDocument: handleOpenWithConfirmation,
      saveDocument: () => void handleSave(),
      saveAsDocument: () => void handleSaveAs(),
      closeTab: () => activeTabId && handleCloseTab(activeTabId),
      newTab: handleNewTab,
      nextTab: () => {
        if (tabs.length === 0) return;
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        activateTab(tabs[nextIndex]!.id);
      },
      previousTab: () => {
        if (tabs.length === 0) return;
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        activateTab(tabs[prevIndex]!.id);
      },
      toggleSearch: handleOpenSearch,
      toggleTheme: cycleTheme,
      toggleViewMode: cycleViewMode,
      toggleFocusMode: toggleFocusMode,
      togglePreferences: () => setIsPreferencesOpen((open) => !open),
      toggleTemplateMenu: () => setIsTemplateMenuOpen((open) => !open),
      exportHtml: () => void handleExportHtml(true),
    }),
    [
      handleNewDocument,
      handleOpenWithConfirmation,
      handleSave,
      handleSaveAs,
      activeTabId,
      handleCloseTab,
      handleNewTab,
      tabs,
      activateTab,
      handleOpenSearch,
      cycleTheme,
      cycleViewMode,
      toggleFocusMode,
      handleExportHtml,
    ]
  );

  const shortcutsMap = useMemo(
    () => new Map(Object.entries(shortcuts)) as Map<CommandId, string | null>,
    [shortcuts]
  );
  useShortcutRegistry(shortcutsMap, shortcutHandlers);

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
    decreaseFontScaleStore,
    increaseFontScaleStore,
    resetFontScaleStore,
    toggleFocusMode,
    toggleToc,
  ]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let isDisposed = false;

    void listenToMenuActions((action: string) => {
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
    <TooltipProvider delayDuration={400}>
      <main
        className="bruma-shell relative flex min-h-[100dvh] min-h-0 flex-col overflow-hidden bg-background text-foreground antialiased"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_65%)]" />
          <div className="absolute right-[-6rem] top-24 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10" />
          <div className="absolute left-[-4rem] top-40 h-48 w-48 rounded-full bg-stone-200/40 blur-3xl dark:bg-stone-400/10" />
        </div>
        <header
          className={`${focusMode ? 'hidden' : 'flex'} relative z-10 shrink-0 flex-col gap-4 border-b border-white/50 bg-white/70 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70`}
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
            <ToolbarGroup label={t('toolbar.file')}>
              <DropdownMenu
                open={isTemplateMenuOpen}
                onOpenChange={setIsTemplateMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-full"
                    aria-label={t('actions.newDocument')}
                  >
                    <FileText className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {BUILTIN_TEMPLATES.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => {
                        setIsTemplateMenuOpen(false);
                        requestDirtyConfirmation(() => {
                          clearSession();
                          resetUntitled();
                          updateContent(applyTemplate(template));
                          setWelcomeDismissed(true);
                        });
                      }}
                    >
                      {t(template.name)}
                    </DropdownMenuItem>
                  ))}
                  {customTemplates.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      {customTemplates.map((template) => (
                        <DropdownMenuItem
                          key={template.id}
                          onClick={async () => {
                            setIsTemplateMenuOpen(false);
                            requestDirtyConfirmation(async () => {
                              try {
                                const content = await loadCustomTemplate(
                                  template.id
                                );
                                clearSession();
                                resetUntitled();
                                updateContent(
                                  applyTemplate({ ...template, content })
                                );
                                setWelcomeDismissed(true);
                              } catch {
                                showError(t('errors.templateLoadFailed'));
                              }
                            });
                          }}
                        >
                          {template.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <IconButton
                icon={FileInput}
                label={t('actions.openDocument')}
                onClick={handleOpenWithConfirmation}
                className="rounded-full"
              />
              <DropdownMenu
                open={isRecentMenuOpen}
                onOpenChange={setIsRecentMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-full"
                    aria-label={t('recent.open')}
                  >
                    <Clock className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-72 max-h-96 overflow-y-auto"
                >
                  {recentFiles.length > 0 ? (
                    recentFiles.map((path) => (
                      <DropdownMenuItem
                        key={path}
                        onClick={() => handleOpenRecent(path)}
                        title={path}
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="block truncate font-medium">
                            {getPathBasename(path)}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {path}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {t('recent.empty')}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <IconButton
                icon={Save}
                label={t('actions.save')}
                onClick={() => void handleSave()}
                className="rounded-full"
              />
            </ToolbarGroup>

            <ToolbarGroup label={t('toolbar.write')}>
              <div className="flex items-center gap-2 rounded-full bg-stone-100/80 px-3 py-1.5 dark:bg-white/5">
                <label
                  htmlFor="toolbar-autosave"
                  className="cursor-pointer text-xs font-medium text-muted-foreground"
                >
                  {t('autosave.toggle')}
                </label>
                <Switch
                  id="toolbar-autosave"
                  checked={autosaveEnabled}
                  onCheckedChange={setAutosaveEnabled}
                />
              </div>
              <IconButton
                icon={Search}
                label={t('search.open')}
                onClick={handleOpenSearch}
                className="rounded-full"
              />
              <IconButton
                icon={Keyboard}
                label={t('shortcuts.title')}
                onClick={() => setIsShortcutsOpen(true)}
                className="rounded-full"
              />
            </ToolbarGroup>

            <ToolbarGroup label={t('toolbar.view')}>
              <IconButton
                icon={Moon}
                label={t('theme.toggle')}
                onClick={cycleTheme}
                className="rounded-full"
              />
              <IconButton
                icon={Languages}
                label={t('language.toggle')}
                onClick={cycleLanguage}
                className="rounded-full"
              />
              <IconButton
                icon={List}
                label={t('toc.toggle')}
                onClick={toggleToc}
                active={tocOpen}
                className="rounded-full"
              />
              <IconButton
                icon={focusMode ? Maximize2 : EyeOff}
                label={t('focusMode.toggle')}
                onClick={toggleFocusMode}
                active={focusMode}
                className="rounded-full"
              />
              <IconButton
                icon={LinkIcon}
                label={t('scrollSync.toggle')}
                onClick={toggleScrollSync}
                active={scrollSyncEnabled}
                className="rounded-full"
              />
              <IconButton
                icon={viewMode === 'preview' ? Eye : Columns2}
                label={t('view.toggle')}
                onClick={cycleViewMode}
                className="rounded-full"
              />
            </ToolbarGroup>

            <ToolbarGroup label={t('toolbar.zoom')}>
              <IconButton
                icon={Minus}
                label={t('zoom.decrease')}
                onClick={decreaseFontScaleStore}
                className="rounded-full"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFontScaleStore}
                    className="h-9 min-w-14 rounded-full px-3 text-xs font-semibold tabular-nums"
                  >
                    {Math.round(fontScale * 100)}%
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('zoom.reset')}</TooltipContent>
              </Tooltip>
              <IconButton
                icon={Plus}
                label={t('zoom.increase')}
                onClick={increaseFontScaleStore}
                className="rounded-full"
              />
            </ToolbarGroup>

            <ToolbarGroup label={t('toolbar.export')}>
              <DropdownMenu
                open={isExportMenuOpen}
                onOpenChange={setIsExportMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-full"
                    aria-label={t('export.title')}
                  >
                    <Download className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void handleExportHtml(true)}>
                    {t('export.htmlStyled')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleExportHtml(false)}>
                    {t('export.htmlPlain')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPdf}>
                    {t('export.pdf')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ToolbarGroup>
          </div>
        </header>

        {focusMode && (
          <button
            type="button"
            onClick={toggleFocusMode}
            className="fixed right-4 top-4 z-50 rounded-full bg-primary p-2 text-primary-foreground shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

        <section className="relative z-10 flex min-h-0 flex-1">
          <Suspense fallback={null}>
            {tocOpen ? (
              <TableOfContents
                content={document.content}
                onSelect={handleSelectHeading}
              />
            ) : null}
          </Suspense>
          <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr]">
            <div
              className={`${focusMode ? 'hidden' : 'flex'} h-12 items-center justify-between border-b border-white/50 bg-white/60 px-4 text-xs text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-zinc-950/60`}
            >
              <div className="flex items-center gap-1">
                {VIEW_MODES.map((mode) => (
                  <button
                    className="rounded-full px-3 py-1.5 transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
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
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full px-3 py-1.5 transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
                  type="button"
                  aria-label={t('frontmatter.toggle')}
                  title={t('frontmatter.toggle')}
                  aria-pressed={!showFrontmatter}
                  onClick={toggleShowFrontmatter}
                >
                  {showFrontmatter
                    ? t('frontmatter.shown')
                    : t('frontmatter.hidden')}
                </button>
                <span>
                  {t(`theme.preference.${themePreference}`)} ·{' '}
                  {t(`view.mode.${viewMode}`)}
                </span>
              </div>
            </div>

            <div
              className={
                viewMode === 'split'
                  ? 'relative grid min-h-0 grid-cols-2 divide-x divide-border'
                  : 'relative min-h-0'
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
                    onNext={() => goNextSearch(searchMatchCount)}
                    onPrevious={() => goPreviousSearch(searchMatchCount)}
                    onQueryChange={setSearchQuery}
                    onReplaceAll={handleReplaceAll}
                    onReplaceOne={handleReplaceOne}
                    onReplaceQueryChange={setReplaceQuery}
                    onToggleReplace={toggleReplaceMode}
                  />
                ) : null}
              </Suspense>
              {viewMode !== 'preview' ? (
                <div className="relative min-h-0 bg-background/60">
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
                        activeSearchIndex={searchActiveIndex}
                        ariaLabel={t('editor.label')}
                        placeholder={t('editor.placeholder')}
                        searchMatches={searchMatches}
                        value={document.content}
                        onChange={(nextValue) => {
                          setWelcomeDismissed(true);
                          updateContent(nextValue);
                        }}
                        tabSize={editorTabSize}
                        lineWrapping={editorWrap}
                        fontFamily={editorFontFamily}
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
                      className="h-full min-h-0 bg-background"
                    />
                  }
                >
                  <Preview
                    content={document.content}
                    documentPath={document.path ?? null}
                    hideFrontmatter={!showFrontmatter}
                    onExternalLinkClick={handleExternalLinkClick}
                    onLocalImageRequest={handleLocalImageRequest}
                    maxWidth={previewMaxWidth}
                  />
                </Suspense>
              ) : null}
            </div>
          </div>
        </section>

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

          {isShortcutsOpen ? (
            <ShortcutsDialog
              open
              onClose={() => setIsShortcutsOpen(false)}
              shortcuts={shortcuts}
              onChange={(next) => {
                setShortcutsState(next);
                patchConfig({ shortcuts: next });
              }}
            />
          ) : null}
        </Suspense>

        <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('about.title')}</DialogTitle>
              <DialogDescription className="space-y-1">
                <p>{t('about.body')}</p>
                <p>{t('about.version', { version: APP_VERSION })}</p>
              </DialogDescription>
            </DialogHeader>
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
      </main>
    </TooltipProvider>
  );
}
