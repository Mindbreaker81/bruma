import type { DocumentEol, Tab } from '../features/files/document';

export type PendingSession = {
  path: string | null;
  content: string;
  eol: DocumentEol;
  savedAt: number;
  tabs?: Tab[];
  activeTabId?: string | null;
};

const SESSION_STORAGE_KEY = 'bruma.session';

export function readSession(): PendingSession | null {
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Partial<PendingSession>;
    if (typeof parsed.content !== 'string') return null;
    if (parsed.eol !== 'lf' && parsed.eol !== 'crlf') return null;
    if (typeof parsed.savedAt !== 'number') return null;
    return {
      path: typeof parsed.path === 'string' ? parsed.path : null,
      content: parsed.content,
      eol: parsed.eol,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export function writeSession(session: PendingSession): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
