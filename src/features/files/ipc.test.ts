import { describe, expect, it } from 'vitest';

import { isFileTooLargeError, isPathNotAllowedError } from './ipc';

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

  it('recognizes denied paths without confusing other errors', () => {
    expect(isPathNotAllowedError('path_not_allowed')).toBe(true);
    expect(isPathNotAllowedError(new Error('path_not_allowed'))).toBe(true);
    expect(isPathNotAllowedError('invalid_path')).toBe(false);
  });
});
