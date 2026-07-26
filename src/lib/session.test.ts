import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  readSession,
  writeSession,
  clearSession,
  type PendingSession,
} from './session';

describe('session storage', () => {
  const now = new Date('2026-07-26T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns null when nothing is stored', () => {
    expect(readSession()).toBeNull();
  });

  it('reads a valid session', () => {
    const session: PendingSession = {
      path: '/home/test.md',
      content: '# Hello',
      eol: 'lf',
      savedAt: now.getTime(),
    };
    writeSession(session);
    expect(readSession()).toEqual(session);
  });

  it('reads a session with null path (untitled)', () => {
    const session: PendingSession = {
      path: null,
      content: 'untitled content',
      eol: 'crlf',
      savedAt: now.getTime(),
    };
    writeSession(session);
    expect(readSession()).toEqual(session);
  });

  it('reads a session with tabs and activeTabId', () => {
    const session: PendingSession = {
      path: '/home/test.md',
      content: '# Hello',
      eol: 'lf',
      savedAt: now.getTime(),
      tabs: [
        {
          id: '1',
          document: {
            id: 'doc-1',
            path: '/a.md',
            content: 'a',
            savedContent: 'a',
            encoding: 'utf-8',
            eol: 'lf',
            lastSavedAt: now.getTime(),
          },
        },
        {
          id: '2',
          document: {
            id: 'doc-2',
            path: '/b.md',
            content: 'b',
            savedContent: 'b',
            encoding: 'utf-8',
            eol: 'lf',
            lastSavedAt: now.getTime(),
          },
        },
      ],
      activeTabId: '2',
    };
    writeSession(session);
    const read = readSession();
    expect(read).toMatchObject({
      path: '/home/test.md',
      content: '# Hello',
      eol: 'lf',
      savedAt: now.getTime(),
      tabs: [
        {
          id: '1',
          document: { path: '/a.md', content: 'a', eol: 'lf' },
        },
        {
          id: '2',
          document: { path: '/b.md', content: 'b', eol: 'lf' },
        },
      ],
      activeTabId: '2',
    });
  });

  it('returns null for invalid stored data', () => {
    localStorage.setItem('bruma.session.v2', 'not-json');
    expect(readSession()).toBeNull();
    expect(localStorage.getItem('bruma.session.v2')).toBeNull();
  });

  it('returns null for missing content field', () => {
    localStorage.setItem(
      'bruma.session.v2',
      JSON.stringify({
        path: '/x.md',
        eol: 'lf',
        savedAt: now.getTime(),
      })
    );
    expect(readSession()).toBeNull();
  });

  it('migrates a valid legacy session once', () => {
    const legacySession: PendingSession = {
      path: '/legacy.md',
      content: 'legacy',
      eol: 'lf',
      savedAt: now.getTime(),
    };
    sessionStorage.setItem('bruma.session', JSON.stringify(legacySession));

    expect(readSession()).toEqual(legacySession);
    expect(sessionStorage.getItem('bruma.session')).toBeNull();
    expect(JSON.parse(localStorage.getItem('bruma.session.v2') ?? '')).toEqual(
      legacySession
    );
  });

  it('discards sessions older than seven days', () => {
    localStorage.setItem(
      'bruma.session.v2',
      JSON.stringify({
        path: '/old.md',
        content: 'old',
        eol: 'lf',
        savedAt: now.getTime() - 7 * 24 * 60 * 60 * 1000 - 1,
      })
    );

    expect(readSession()).toBeNull();
    expect(localStorage.getItem('bruma.session.v2')).toBeNull();
  });

  it('does not throw when persistent storage quota is exceeded', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage
    ) {
      if (this === localStorage) {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
    });

    expect(() =>
      writeSession({
        path: '/x.md',
        content: 'x',
        eol: 'lf',
        savedAt: now.getTime(),
      })
    ).not.toThrow();
  });

  it('clears session', () => {
    writeSession({
      path: '/x.md',
      content: 'x',
      eol: 'lf',
      savedAt: now.getTime(),
    });
    sessionStorage.setItem('bruma.session', 'legacy');
    clearSession();
    expect(readSession()).toBeNull();
    expect(localStorage.getItem('bruma.session.v2')).toBeNull();
    expect(sessionStorage.getItem('bruma.session')).toBeNull();
  });
});
