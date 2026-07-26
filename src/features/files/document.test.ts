import { describe, expect, it } from 'vitest';

import {
  createUntitledDocument,
  getDocumentDisplayName,
  isMarkdownPath,
  isDirty,
} from './document';

describe('document model', () => {
  it('starts as a clean untitled document', () => {
    const document = createUntitledDocument();

    expect(document.path).toBeNull();
    expect(document.content).toBe('');
    expect(isDirty(document)).toBe(false);
    expect(getDocumentDisplayName(document)).toBeNull();
  });

  it('detects dirty state from content changes', () => {
    const document = {
      ...createUntitledDocument(),
      content: 'Draft',
      savedContent: '',
    };

    expect(isDirty(document)).toBe(true);
  });

  it('uses the file name when a path exists', () => {
    const document = {
      ...createUntitledDocument(),
      path: '/Users/demo/notes/bruma.md',
    };

    expect(getDocumentDisplayName(document)).toBe('bruma.md');
  });

  it('accepts markdown file extensions', () => {
    expect(isMarkdownPath('/tmp/note.md')).toBe(true);
    expect(isMarkdownPath('/tmp/note.markdown')).toBe(true);
    expect(isMarkdownPath('/tmp/note.txt')).toBe(false);
  });
});
