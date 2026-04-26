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
