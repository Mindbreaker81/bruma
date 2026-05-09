import { type ChangeSpec, type EditorState } from '@codemirror/state';
import { type EditorView } from '@codemirror/view';

export type FormatAction =
  | { kind: 'wrap'; before: string; after: string }
  | { kind: 'linePrefix'; prefix: string; toggle?: boolean }
  | { kind: 'block'; template: string };

type FormatResult = {
  changes: ChangeSpec;
  selection: { anchor: number; head?: number };
};

const NUMBERED_PREFIX = /^(\d+)\.\s/;

function computeWrap(
  state: EditorState,
  before: string,
  after: string
): FormatResult {
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to);
  const insert = before + selected + after;
  const innerStart = from + before.length;

  return {
    changes: { from, to, insert },
    selection: selected
      ? { anchor: innerStart, head: innerStart + selected.length }
      : { anchor: innerStart },
  };
}

function computeLinePrefix(
  state: EditorState,
  prefix: string,
  toggle: boolean
): FormatResult {
  const { from } = state.selection.main;
  const { to } = state.selection.main;
  const startLine = state.doc.lineAt(from);
  const endLine = state.doc.lineAt(to);
  const isNumbered = NUMBERED_PREFIX.test(prefix);
  const changes: ChangeSpec[] = [];
  let firstDelta = 0;

  for (let n = startLine.number; n <= endLine.number; n++) {
    const line = state.doc.line(n);
    const counter = n - startLine.number + 1;
    const linePrefix = isNumbered ? `${counter}. ` : prefix;
    const existingNumbered = isNumbered
      ? line.text.match(NUMBERED_PREFIX)
      : null;
    const matchesExisting = isNumbered
      ? Boolean(existingNumbered)
      : line.text.startsWith(linePrefix);

    let lineDelta = 0;
    if (toggle && matchesExisting) {
      const removeLength = existingNumbered
        ? existingNumbered[0].length
        : linePrefix.length;
      changes.push({
        from: line.from,
        to: line.from + removeLength,
        insert: '',
      });
      lineDelta = -removeLength;
    } else {
      changes.push({ from: line.from, insert: linePrefix });
      lineDelta = linePrefix.length;
    }

    if (n === startLine.number) {
      firstDelta = lineDelta;
    }
  }

  return {
    changes,
    selection: { anchor: Math.max(from + firstDelta, startLine.from) },
  };
}

function computeBlock(state: EditorState, template: string): FormatResult {
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to);
  const placeholderIndex = template.indexOf('$1');
  const filled =
    placeholderIndex >= 0 ? template.replace('$1', selected) : template;

  if (placeholderIndex >= 0 && !selected) {
    return {
      changes: { from, to, insert: filled },
      selection: { anchor: from + placeholderIndex },
    };
  }

  if (placeholderIndex >= 0 && selected) {
    const innerStart = from + placeholderIndex;
    return {
      changes: { from, to, insert: filled },
      selection: { anchor: innerStart, head: innerStart + selected.length },
    };
  }

  return {
    changes: { from, to, insert: filled },
    selection: { anchor: from + filled.length },
  };
}

export function computeFormat(
  state: EditorState,
  action: FormatAction
): FormatResult {
  switch (action.kind) {
    case 'wrap':
      return computeWrap(state, action.before, action.after);
    case 'linePrefix':
      return computeLinePrefix(state, action.prefix, action.toggle ?? false);
    case 'block':
      return computeBlock(state, action.template);
  }
}

export function applyFormat(view: EditorView, action: FormatAction): void {
  const { changes, selection } = computeFormat(view.state, action);
  view.dispatch({ changes, selection });
  view.focus();
}

export function insertSnippet(view: EditorView, text: string): void {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
}
