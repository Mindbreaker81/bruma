import { describe, expect, it, beforeEach } from 'vitest';
import {
  readSession,
  writeSession,
  clearSession,
  type PendingSession,
} from './session';

describe('session storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(readSession()).toBeNull();
  });

  it('reads a valid session', () => {
    const session: PendingSession = {
      path: '/home/test.md',
      content: '# Hello',
      eol: 'lf',
      savedAt: 12345,
    };
    writeSession(session);
    expect(readSession()).toEqual(session);
  });

  it('reads a session with null path (untitled)', () => {
    const session: PendingSession = {
      path: null,
      content: 'untitled content',
      eol: 'crlf',
      savedAt: 999,
    };
    writeSession(session);
    expect(readSession()).toEqual(session);
  });

  it('reads a session with tabs and activeTabId', () => {
    const session: PendingSession = {
      path: '/home/test.md',
      content: '# Hello',
      eol: 'lf',
      savedAt: 12345,
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
            lastSavedAt: 12345,
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
            lastSavedAt: 12345,
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
      savedAt: 12345,
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
    sessionStorage.setItem('bruma.session', 'not-json');
    expect(readSession()).toBeNull();
  });

  it('returns null for missing content field', () => {
    sessionStorage.setItem(
      'bruma.session',
      JSON.stringify({ path: '/x.md', eol: 'lf', savedAt: 1 })
    );
    expect(readSession()).toBeNull();
  });

  it('clears session', () => {
    writeSession({ path: '/x.md', content: 'x', eol: 'lf', savedAt: 1 });
    clearSession();
    expect(readSession()).toBeNull();
  });
});
