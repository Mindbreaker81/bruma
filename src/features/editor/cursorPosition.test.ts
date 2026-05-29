import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import { getCursorPosition } from './cursorPosition';

function makeState(doc: string, cursor: number): EditorState {
  return EditorState.create({
    doc,
    selection: { anchor: cursor, head: cursor },
  });
}

describe('getCursorPosition', () => {
  it('returns line 1 column 1 at document start', () => {
    const position = getCursorPosition(makeState('hello', 0));

    expect(position).toEqual({ line: 1, column: 1 });
  });

  it('tracks line and column across multiple lines', () => {
    const position = getCursorPosition(makeState('ab\ncde', 4));

    expect(position).toEqual({ line: 2, column: 2 });
  });
});
