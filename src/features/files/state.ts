import { create } from 'zustand';

import { patchConfig, readConfig } from '../../lib/config';
import {
  type Document,
  createLoadedDocument,
  createUntitledDocument,
  getDocumentDisplayName,
  isDirty,
} from './document';
import { addRecentFile, removeRecentFile } from './recent';

type FileState = {
  document: Document;
  isDirty: boolean;
  displayName: string;
  recentFiles: string[];
  addRecentFile: (path: string) => void;
  removeRecentFile: (path: string) => void;
  updateContent: (content: string) => void;
  loadDocument: (input: {
    path: string;
    content: string;
    eol: Document['eol'];
  }) => void;
  resetUntitled: () => void;
  markSaved: (savedAt?: number, path?: string) => void;
};

function deriveDocumentState(document: Document) {
  return {
    isDirty: isDirty(document),
    displayName: getDocumentDisplayName(document),
  };
}

const initialDocument = createUntitledDocument();
const initialConfig = readConfig();

export const useFileStore = create<FileState>((set) => ({
  document: initialDocument,
  recentFiles: initialConfig.recentFiles,
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
      const document = { ...state.document, content };

      return {
        document,
        ...deriveDocumentState(document),
      };
    }),
  loadDocument: (input) =>
    set((state) => {
      const document = createLoadedDocument(input);
      const recentFiles = addRecentFile(input.path, state.recentFiles);
      patchConfig({ recentFiles });

      return {
        document,
        recentFiles,
        ...deriveDocumentState(document),
      };
    }),
  resetUntitled: () =>
    set(() => {
      const document = createUntitledDocument();

      return {
        document,
        ...deriveDocumentState(document),
      };
    }),
  markSaved: (savedAt = Date.now(), path) =>
    set((state) => {
      const document = {
        ...state.document,
        path: path ?? state.document.path,
        savedContent: state.document.content,
        lastSavedAt: savedAt,
      };
      const recentFiles = document.path
        ? addRecentFile(document.path, state.recentFiles)
        : state.recentFiles;

      if (document.path) {
        patchConfig({ recentFiles });
      }

      return {
        document,
        recentFiles,
        ...deriveDocumentState(document),
      };
    }),
}));
