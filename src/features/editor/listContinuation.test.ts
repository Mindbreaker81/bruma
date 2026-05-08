import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import { planListContinuation } from './listContinuation';

function stateAt(doc: string, cursor: number): EditorState {
  return EditorState.create({
    doc,
    selection: { anchor: cursor, head: cursor },
  });
}

describe('planListContinuation', () => {
  it('continues a bullet list with the same marker', () => {
    const doc = '- first';
    const plan = planListContinuation(stateAt(doc, doc.length));
    expect(plan).toEqual({ kind: 'continue', at: 7, insert: '\n- ' });
  });

  it('continues an ordered list incrementing the counter', () => {
    const doc = '1. first';
    const plan = planListContinuation(stateAt(doc, doc.length));
    expect(plan).toEqual({ kind: 'continue', at: 8, insert: '\n2. ' });
  });

  it('preserves indentation for nested lists', () => {
    const doc = '  - nested';
    const plan = planListContinuation(stateAt(doc, doc.length));
    expect(plan).toEqual({ kind: 'continue', at: 10, insert: '\n  - ' });
  });

  it('continues a task list with an unchecked checkbox', () => {
    const doc = '- [x] done';
    const plan = planListContinuation(stateAt(doc, doc.length));
    expect(plan).toEqual({ kind: 'continue', at: 10, insert: '\n- [ ] ' });
  });

  it('exits the list when the current item is empty', () => {
    const doc = '- ';
    const plan = planListContinuation(stateAt(doc, doc.length));
    expect(plan).toEqual({ kind: 'exit', from: 0, to: 2 });
  });

  it('exits an empty ordered item', () => {
    const doc = '1. first\n2. ';
    const plan = planListContinuation(stateAt(doc, doc.length));
    expect(plan).toEqual({ kind: 'exit', from: 9, to: 12 });
  });

  it('returns null when the line has no list marker', () => {
    const doc = 'plain text';
    expect(planListContinuation(stateAt(doc, doc.length))).toBeNull();
  });

  it('returns null when cursor is not at end of line', () => {
    const doc = '- first';
    expect(planListContinuation(stateAt(doc, 3))).toBeNull();
  });

  it('returns null when there is a non-empty selection', () => {
    const state = EditorState.create({
      doc: '- first',
      selection: { anchor: 0, head: 7 },
    });
    expect(planListContinuation(state)).toBeNull();
  });
});
