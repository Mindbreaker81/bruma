import { type EditorState } from '@codemirror/state';
import { type EditorView } from '@codemirror/view';

const LIST_MARKER =
  /^(?<indent>\s*)(?<marker>(?:[-*+]|\d+\.)\s(?:\[[ xX]\]\s)?)(?<rest>.*)$/;

type ContinuationPlan =
  | { kind: 'exit'; from: number; to: number }
  | { kind: 'continue'; at: number; insert: string };

function nextMarker(marker: string): string {
  const numbered = marker.match(/^(\d+)\.\s(.*)$/);
  if (numbered) {
    const next = Number.parseInt(numbered[1] ?? '0', 10) + 1;
    return `${next}. ${numbered[2] ?? ''}`;
  }

  // For task lists, an unchecked checkbox is more useful than carrying the
  // checked state forward.
  return marker.replace(/\[[xX]\]/, '[ ]');
}

export function planListContinuation(
  state: EditorState
): ContinuationPlan | null {
  const sel = state.selection.main;
  if (!sel.empty) return null;

  const line = state.doc.lineAt(sel.from);
  if (sel.from !== line.to) return null;

  const match = LIST_MARKER.exec(line.text);
  if (!match?.groups) return null;

  const indent = match.groups.indent ?? '';
  const marker = match.groups.marker ?? '';
  const rest = match.groups.rest ?? '';
  if (rest.trim() === '') {
    return {
      kind: 'exit',
      from: line.from,
      to: line.to,
    };
  }

  const continuation = `\n${indent}${nextMarker(marker)}`;
  return { kind: 'continue', at: sel.from, insert: continuation };
}

export function continueListOnEnter(view: EditorView): boolean {
  const plan = planListContinuation(view.state);
  if (!plan) return false;

  if (plan.kind === 'exit') {
    view.dispatch({
      changes: { from: plan.from, to: plan.to, insert: '' },
      selection: { anchor: plan.from },
      userEvent: 'input',
    });
    return true;
  }

  view.dispatch({
    changes: { from: plan.at, insert: plan.insert },
    selection: { anchor: plan.at + plan.insert.length },
    scrollIntoView: true,
    userEvent: 'input',
  });
  return true;
}
