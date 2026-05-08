import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import { getActiveFormats } from './activeFormats';

function makeState(doc: string, cursor: number): EditorState {
  return EditorState.create({
    doc,
    selection: { anchor: cursor, head: cursor },
    extensions: [markdown()],
  });
}

describe('getActiveFormats', () => {
  it('detects bold inside **...**', () => {
    const doc = 'hello **world**';
    const ids = getActiveFormats(makeState(doc, 11));
    expect(ids.has('bold')).toBe(true);
  });

  it('detects italic inside _..._', () => {
    const doc = 'a _word_ here';
    const ids = getActiveFormats(makeState(doc, 5));
    expect(ids.has('italic')).toBe(true);
  });

  it('detects inline code', () => {
    const doc = 'use `foo()` here';
    const ids = getActiveFormats(makeState(doc, 7));
    expect(ids.has('code')).toBe(true);
  });

  it('detects ATX headings', () => {
    const doc = '# Title';
    const ids = getActiveFormats(makeState(doc, 4));
    expect(ids.has('h1')).toBe(true);
  });

  it('detects bullet list items', () => {
    const doc = '- item';
    const ids = getActiveFormats(makeState(doc, 4));
    expect(ids.has('ul')).toBe(true);
  });

  it('returns empty set on plain prose', () => {
    const doc = 'just words';
    const ids = getActiveFormats(makeState(doc, 5));
    expect(ids.size).toBe(0);
  });
});
