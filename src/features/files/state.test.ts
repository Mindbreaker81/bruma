import { beforeEach, describe, expect, it } from 'vitest';

import { useFileStore } from './state';

describe('file store', () => {
  beforeEach(() => {
    useFileStore.getState().resetUntitled();
  });

  it('tracks edits and saved state transitions', () => {
    useFileStore.getState().updateContent('# Bruma');

    expect(useFileStore.getState().isDirty).toBe(true);
    expect(useFileStore.getState().document.content).toBe('# Bruma');

    useFileStore.getState().markSaved(123);

    expect(useFileStore.getState().isDirty).toBe(false);
    expect(useFileStore.getState().document.savedContent).toBe('# Bruma');
    expect(useFileStore.getState().document.lastSavedAt).toBe(123);
  });

  it('loads a document as clean state', () => {
    useFileStore.getState().loadDocument({
      path: '/tmp/bruma.md',
      content: '# Bruma',
      eol: 'lf',
    });

    expect(useFileStore.getState().displayName).toBe('bruma.md');
    expect(useFileStore.getState().isDirty).toBe(false);
  });
});
