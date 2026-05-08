import { syntaxTree } from '@codemirror/language';
import { type EditorState } from '@codemirror/state';

import type { FormatCommandId } from './formatCommands';

/**
 * Map from `@codemirror/lang-markdown` Lezer node names to the format command
 * they should highlight in the toolbar. A given cursor position can belong to
 * several nested nodes (e.g. `Emphasis` inside `StrongEmphasis` inside
 * `ATXHeading1`), so the resulting set may contain multiple ids.
 */
const NODE_TO_COMMAND: Readonly<Record<string, FormatCommandId>> = {
  StrongEmphasis: 'bold',
  Emphasis: 'italic',
  Strikethrough: 'strike',
  InlineCode: 'code',
  ATXHeading1: 'h1',
  ATXHeading2: 'h2',
  ATXHeading3: 'h3',
  SetextHeading1: 'h1',
  SetextHeading2: 'h2',
  Blockquote: 'quote',
  BulletList: 'ul',
  OrderedList: 'ol',
  TaskList: 'task',
  Task: 'task',
  FencedCode: 'codeblock',
  CodeBlock: 'codeblock',
  Link: 'link',
  Image: 'image',
  Table: 'table',
};

export function getActiveFormats(state: EditorState): Set<FormatCommandId> {
  const pos = state.selection.main.head;
  const tree = syntaxTree(state);
  const active = new Set<FormatCommandId>();

  let node: {
    name: string;
    parent: typeof node | null;
  } | null = tree.resolveInner(pos, -1);

  while (node) {
    const id = NODE_TO_COMMAND[node.name];
    if (id) active.add(id);
    node = node.parent;
  }

  return active;
}
