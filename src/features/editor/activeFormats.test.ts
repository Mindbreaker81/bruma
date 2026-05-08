import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import { getActiveFormats } from './activeFormats';

function makeState(doc: string, cursor: number): EditorState {
  return EditorState.create({
    doc,
    selection: { anchor: cursor, head: cursor },
    extensions: [markdown({ base: markdownLanguage })],
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

  it('detects strikethrough inside ~~...~~', () => {
    const doc = '~~gone~~';
    const ids = getActiveFormats(makeState(doc, 4));
    expect(ids.has('strike')).toBe(true);
  });

  it('detects ordered list items', () => {
    const doc = '1. first\n2. second';
    const ids = getActiveFormats(makeState(doc, 4));
    expect(ids.has('ol')).toBe(true);
  });

  it('detects task list items', () => {
    const doc = '- [ ] todo';
    const ids = getActiveFormats(makeState(doc, 7));
    expect(ids.has('task')).toBe(true);
  });

  it('detects fenced code blocks', () => {
    const doc = '```\nconst x = 1;\n```';
    const ids = getActiveFormats(makeState(doc, 8));
    expect(ids.has('codeblock')).toBe(true);
  });

  it('detects links', () => {
    const doc = '[label](https://example.com)';
    const ids = getActiveFormats(makeState(doc, 3));
    expect(ids.has('link')).toBe(true);
  });

  it('detects images', () => {
    const doc = '![alt](pic.png)';
    const ids = getActiveFormats(makeState(doc, 3));
    expect(ids.has('image')).toBe(true);
  });

  it('detects blockquotes', () => {
    const doc = '> quoted line';
    const ids = getActiveFormats(makeState(doc, 5));
    expect(ids.has('quote')).toBe(true);
  });

  it('reports nested formats together (bold inside heading)', () => {
    const doc = '# **bold title**';
    const ids = getActiveFormats(makeState(doc, 6));
    expect(ids.has('h1')).toBe(true);
    expect(ids.has('bold')).toBe(true);
  });
});
