import { create } from 'zustand';

import { patchConfig, readConfig } from '../../lib/config';
import {
  type Document,
  type Tab,
  createLoadedDocument,
  createUntitledDocument,
  getDocumentDisplayName,
  isDirty,
} from './document';
import { addRecentFile, removeRecentFile } from './recent';

type FileState = {
  tabs: Tab[];
  activeTabId: string | null;
  document: Document;
  isDirty: boolean;
  displayName: string;
  recentFiles: string[];
  addRecentFile: (path: string) => void;
  removeRecentFile: (path: string) => void;
  updateContent: (content: string) => void;
  openTab: (input: {
    path: string;
    content: string;
    eol: Document['eol'];
  }) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  moveTab: (id: string, toIndex: number) => void;
  resetUntitled: () => void;
  markSaved: (savedAt?: number, path?: string) => void;
  restoreSession: (tabs: Tab[], activeTabId: string | null) => void;
};

function deriveDocumentState(document: Document) {
  return {
    isDirty: isDirty(document),
    displayName: getDocumentDisplayName(document),
  };
}

function deriveTabState(tabs: Tab[], activeTabId: string | null) {
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const document = activeTab?.document ?? createUntitledDocument();
  return {
    document,
    ...deriveDocumentState(document),
  };
}

const initialDocument = createUntitledDocument();
const initialTab: Tab = { id: crypto.randomUUID(), document: initialDocument };
const initialConfig = readConfig();

export const useFileStore = create<FileState>((set) => ({
  tabs: [initialTab],
  activeTabId: initialTab.id,
  recentFiles: initialConfig.recentFiles,
  document: initialDocument,
  ...deriveDocumentState(initialDocument),
  addRecentFile: (path) =>
    set((state) => {
      const recentFiles = addRecentFile(path, state.recentFiles);
      patchConfig({ recentFiles });

      return { recentFiles };
    }),
  removeRecentFile: (path) =>
    set((state) => {
      const recentFiles = removeRecentFile(path, state.recentFiles);
      patchConfig({ recentFiles });

      return { recentFiles };
    }),
  updateContent: (content) =>
    set((state) => {
      if (!state.activeTabId) return state;
      const tabs = state.tabs.map((tab) =>
        tab.id === state.activeTabId
          ? { ...tab, document: { ...tab.document, content } }
          : tab
      );
      return {
        tabs,
        ...deriveTabState(tabs, state.activeTabId),
      };
    }),
  openTab: (input) =>
    set((state) => {
      const existingIndex = state.tabs.findIndex(
        (tab) => tab.document.path === input.path
      );
      const document = createLoadedDocument(input);
      const recentFiles = addRecentFile(input.path, state.recentFiles);
      patchConfig({ recentFiles });

      if (existingIndex >= 0) {
        const tabs = [...state.tabs];
        const existingTab = tabs[existingIndex]!;
        tabs[existingIndex] = { ...existingTab, document };
        return {
          tabs,
          activeTabId: existingTab.id,
          recentFiles,
          ...deriveTabState(tabs, existingTab.id),
        };
      }

      const newTab: Tab = { id: crypto.randomUUID(), document };
      const tabs = [...state.tabs, newTab];
      return {
        tabs,
        activeTabId: newTab.id,
        recentFiles,
        ...deriveTabState(tabs, newTab.id),
      };
    }),
  closeTab: (id) =>
    set((state) => {
      const index = state.tabs.findIndex((tab) => tab.id === id);
      if (index < 0) return state;
      const tabs = state.tabs.filter((tab) => tab.id !== id);
      let activeTabId = state.activeTabId;
      if (activeTabId === id) {
        if (tabs.length === 0) {
          const newTab: Tab = {
            id: crypto.randomUUID(),
            document: createUntitledDocument(),
          };
          tabs.push(newTab);
          activeTabId = newTab.id;
        } else {
          activeTabId = tabs[Math.min(index, tabs.length - 1)]!.id;
        }
      }
      return {
        tabs,
        activeTabId,
        ...deriveTabState(tabs, activeTabId),
      };
    }),
  activateTab: (id) =>
    set((state) => ({
      activeTabId: id,
      ...deriveTabState(state.tabs, id),
    })),
  moveTab: (id, toIndex) =>
    set((state) => {
      const fromIndex = state.tabs.findIndex((tab) => tab.id === id);
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        toIndex >= state.tabs.length ||
        fromIndex === toIndex
      )
        return state;
      const tabs = [...state.tabs];
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved!);
      return { tabs };
    }),
  resetUntitled: () =>
    set((state) => {
      const newTab: Tab = {
        id: crypto.randomUUID(),
        document: createUntitledDocument(),
      };
      const tabs = [...state.tabs, newTab];
      return {
        tabs,
        activeTabId: newTab.id,
        ...deriveTabState(tabs, newTab.id),
      };
    }),
  markSaved: (savedAt = Date.now(), path) =>
    set((state) => {
      if (!state.activeTabId) return state;
      const tabs = state.tabs.map((tab) => {
        if (tab.id !== state.activeTabId) return tab;
        const updatedDocument = {
          ...tab.document,
          path: path ?? tab.document.path,
          savedContent: tab.document.content,
          lastSavedAt: savedAt,
        };
        return { ...tab, document: updatedDocument };
      });
      const activeTab = tabs.find((tab) => tab.id === state.activeTabId);
      const recentFiles = activeTab?.document.path
        ? addRecentFile(activeTab.document.path, state.recentFiles)
        : state.recentFiles;

      if (activeTab?.document.path) {
        patchConfig({ recentFiles });
      }

      return {
        tabs,
        recentFiles,
        ...deriveTabState(tabs, state.activeTabId),
      };
    }),
  restoreSession: (tabs, activeTabId) =>
    set(() => ({
      tabs,
      activeTabId,
      ...deriveTabState(tabs, activeTabId),
    })),
}));
