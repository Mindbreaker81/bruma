import {
  isDirty as isDocumentDirty,
  type DocumentEol,
  type Tab,
} from '../features/files/document';

export type PendingSession = {
  version?: 3;
  path: string | null;
  content: string;
  eol: DocumentEol;
  savedAt: number;
  tabs?: Array<Tab & { restoreFromDisk?: boolean }>;
  activeTabId?: string | null;
};

const SESSION_STORAGE_KEY = 'bruma.session.v2';
const LEGACY_SESSION_STORAGE_KEY = 'bruma.session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function hasRecoverableChanges(tabs: Tab[]): boolean {
  return tabs.some((tab) => isDocumentDirty(tab.document));
}

export function createSessionSnapshot(
  tabs: Tab[],
  activeTabId: string | null,
  savedAt = Date.now()
): PendingSession {
  return {
    version: 3,
    path: null,
    content: '',
    eol: 'lf',
    savedAt,
    tabs: tabs.map((tab) =>
      tab.document.path && !isDocumentDirty(tab.document)
        ? {
            ...tab,
            document: {
              ...tab.document,
              content: '',
              savedContent: '',
            },
            restoreFromDisk: true,
          }
        : tab
    ),
    activeTabId,
  };
}

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
      version: parsed.version === 3 ? 3 : undefined,
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
