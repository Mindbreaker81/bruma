import type { DocumentEol, Tab } from '../features/files/document';

export type PendingSession = {
  path: string | null;
  content: string;
  eol: DocumentEol;
  savedAt: number;
  tabs?: Tab[];
  activeTabId?: string | null;
};

const SESSION_STORAGE_KEY = 'bruma.session.v2';
const LEGACY_SESSION_STORAGE_KEY = 'bruma.session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function parseSession(stored: string): PendingSession | null {
  try {
    const parsed = JSON.parse(stored) as Partial<PendingSession>;
    if (typeof parsed.content !== 'string') return null;
    if (parsed.eol !== 'lf' && parsed.eol !== 'crlf') return null;
    if (
      typeof parsed.savedAt !== 'number' ||
      !Number.isFinite(parsed.savedAt) ||
      Date.now() - parsed.savedAt > SESSION_MAX_AGE_MS
    ) {
      return null;
    }
    return {
      path: typeof parsed.path === 'string' ? parsed.path : null,
      content: parsed.content,
      eol: parsed.eol,
      savedAt: parsed.savedAt,
      tabs: parsed.tabs,
      activeTabId: parsed.activeTabId,
    };
  } catch {
    return null;
  }
}

function persistSession(session: PendingSession): boolean {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function readSession(): PendingSession | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session = parseSession(stored);
      if (!session) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      return session;
    }
  } catch {
    // Continue with the legacy session if persistent storage is unavailable.
  }

  try {
    const legacyStored = sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
    if (!legacyStored) return null;

    const session = parseSession(legacyStored);
    if (!session) {
      sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      return null;
    }

    if (persistSession(session)) {
      sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    }
    return session;
  } catch {
    return null;
  }
}

export function writeSession(session: PendingSession): void {
  persistSession(session);
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Storage cleanup is best effort.
  }

  try {
    sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
  } catch {
    // Storage cleanup is best effort.
  }
}
