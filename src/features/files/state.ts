import { create } from 'zustand';

import {
  type Document,
  createLoadedDocument,
  createUntitledDocument,
  getDocumentDisplayName,
  isDirty,
} from './document';

type FileState = {
  document: Document;
  isDirty: boolean;
  displayName: string;
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

export const useFileStore = create<FileState>((set) => ({
  document: initialDocument,
  ...deriveDocumentState(initialDocument),
  updateContent: (content) =>
    set((state) => {
      const document = { ...state.document, content };

      return {
        document,
        ...deriveDocumentState(document),
      };
    }),
  loadDocument: (input) =>
    set(() => {
      const document = createLoadedDocument(input);

      return {
        document,
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

      return {
        document,
        ...deriveDocumentState(document),
      };
    }),
}));
