import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import { computeFormat, type FormatAction } from './format';

function stateWith(doc: string, from: number, to: number = from): EditorState {
  return EditorState.create({ doc, selection: { anchor: from, head: to } });
}

function applyToDoc(
  doc: string,
  from: number,
  to: number,
  action: FormatAction
): { doc: string; anchor: number } {
  const state = stateWith(doc, from, to);
  const { changes, selection } = computeFormat(state, action);
  const next = state.update({ changes }).state;
  return { doc: next.doc.toString(), anchor: selection.anchor };
}

describe('computeFormat / wrap', () => {
  it('wraps the current selection with markers', () => {
    const result = applyToDoc('hello world', 6, 11, {
      kind: 'wrap',
      before: '**',
      after: '**',
    });
    expect(result.doc).toBe('hello **world**');
  });

  it('inserts markers and places cursor between them when no selection', () => {
    const result = applyToDoc('hello ', 6, 6, {
      kind: 'wrap',
      before: '**',
      after: '**',
    });
    expect(result.doc).toBe('hello ****');
    expect(result.anchor).toBe(8);
  });
});

describe('computeFormat / linePrefix', () => {
  it('adds a prefix to a single line', () => {
    const result = applyToDoc('title', 0, 0, {
      kind: 'linePrefix',
      prefix: '# ',
    });
    expect(result.doc).toBe('# title');
  });

  it('toggles off an existing prefix', () => {
    const result = applyToDoc('# title', 2, 2, {
      kind: 'linePrefix',
      prefix: '# ',
      toggle: true,
    });
    expect(result.doc).toBe('title');
  });

  it('numbers consecutive lines for ordered lists', () => {
    const result = applyToDoc('a\nb\nc', 0, 5, {
      kind: 'linePrefix',
      prefix: '1. ',
    });
    expect(result.doc).toBe('1. a\n2. b\n3. c');
  });

  it('removes existing numbering when toggled', () => {
    const result = applyToDoc('1. a\n2. b', 0, 9, {
      kind: 'linePrefix',
      prefix: '1. ',
      toggle: true,
    });
    expect(result.doc).toBe('a\nb');
  });
});

describe('computeFormat / block', () => {
  it('inserts a block template and places cursor at $1 placeholder', () => {
    const result = applyToDoc('', 0, 0, {
      kind: 'block',
      template: '[$1](url)',
    });
    expect(result.doc).toBe('[](url)');
    expect(result.anchor).toBe(1);
  });

  it('substitutes $1 with the current selection', () => {
    const result = applyToDoc('see docs', 4, 8, {
      kind: 'block',
      template: '[$1](url)',
    });
    expect(result.doc).toBe('see [docs](url)');
  });

  it('appends template literally when no $1 placeholder is present', () => {
    const result = applyToDoc('x', 1, 1, {
      kind: 'block',
      template: '\n---\n',
    });
    expect(result.doc).toBe('x\n---\n');
  });
});
