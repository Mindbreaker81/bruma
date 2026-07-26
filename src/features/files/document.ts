export type DocumentEol = 'lf' | 'crlf';

export type Document = {
  id: string;
  path: string | null;
  content: string;
  savedContent: string;
  encoding: 'utf-8';
  eol: DocumentEol;
  lastSavedAt: number | null;
};

export type Tab = {
  id: string;
  document: Document;
};

type LoadedDocumentInput = {
  path: string;
  content: string;
  eol: DocumentEol;
};

export function createUntitledDocument(): Document {
  return {
    id: crypto.randomUUID(),
    path: null,
    content: '',
    savedContent: '',
    encoding: 'utf-8',
    eol: 'lf',
    lastSavedAt: null,
  };
}

export function createLoadedDocument(input: LoadedDocumentInput): Document {
  return {
    id: crypto.randomUUID(),
    path: input.path,
    content: input.content,
    savedContent: input.content,
    encoding: 'utf-8',
    eol: input.eol,
    lastSavedAt: Date.now(),
  };
}

export function isDirty(document: Document): boolean {
  return document.content !== document.savedContent;
}

export function getDocumentDisplayName(document: Document): string | null {
  if (!document.path) {
    return null;
  }

  return document.path.split(/[\\/]/).pop() || null;
}

export function isMarkdownPath(path: string): boolean {
  return /\.(md|markdown)$/i.test(path);
}
