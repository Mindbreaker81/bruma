import { describe, expect, it } from 'vitest';

import { isFileTooLargeError } from './ipc';

describe('file IPC errors', () => {
  it('recognizes the backend size error', () => {
    expect(isFileTooLargeError('file_too_large')).toBe(true);
    expect(isFileTooLargeError(new Error('file_too_large'))).toBe(true);
    expect(isFileTooLargeError('file_too_large: 10485761')).toBe(true);
  });

  it('does not classify unrelated errors as size errors', () => {
    expect(isFileTooLargeError('read_failed: permission denied')).toBe(false);
    expect(isFileTooLargeError(null)).toBe(false);
  });
});
