import { describe, expect, it } from 'vitest';
import { shouldAutosave } from './autosave';

describe('shouldAutosave', () => {
  it('returns true when dirty, has path, and autosave is enabled', () => {
    expect(
      shouldAutosave({
        autosaveEnabled: true,
        isDirty: true,
        documentPath: '/home/x.md',
      })
    ).toBe(true);
  });

  it('returns false when autosave is disabled', () => {
    expect(
      shouldAutosave({
        autosaveEnabled: false,
        isDirty: true,
        documentPath: '/home/x.md',
      })
    ).toBe(false);
  });

  it('returns false when document is not dirty', () => {
    expect(
      shouldAutosave({
        autosaveEnabled: true,
        isDirty: false,
        documentPath: '/home/x.md',
      })
    ).toBe(false);
  });

  it('returns false when document has no path (untitled)', () => {
    expect(
      shouldAutosave({
        autosaveEnabled: true,
        isDirty: true,
        documentPath: null,
      })
    ).toBe(false);
  });
});
