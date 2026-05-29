import { type EditorState } from '@codemirror/state';

export type CursorPosition = {
  line: number;
  column: number;
};

export function getCursorPosition(state: EditorState): CursorPosition {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);

  return {
    line: line.number,
    column: head - line.from + 1,
  };
}
