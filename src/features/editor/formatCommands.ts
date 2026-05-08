import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Strikethrough,
  Table as TableIcon,
} from 'lucide-react';

import type { FormatAction } from './format';

type IconComponent = typeof Bold;

export type FormatCommandId =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'code'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'task'
  | 'quote'
  | 'codeblock'
  | 'link'
  | 'image'
  | 'table'
  | 'hr';

export type FormatCommand = {
  id: FormatCommandId;
  icon: IconComponent;
  /** i18n key under `editor.format.<id>` */
  labelKey: string;
  /** CodeMirror keymap binding, e.g. `Mod-b`. Optional. */
  shortcut?: string;
  action: FormatAction;
};

export const FORMAT_COMMANDS: readonly FormatCommand[] = [
  {
    id: 'bold',
    icon: Bold,
    labelKey: 'editor.format.bold',
    shortcut: 'Mod-b',
    action: { kind: 'wrap', before: '**', after: '**' },
  },
  {
    id: 'italic',
    icon: Italic,
    labelKey: 'editor.format.italic',
    shortcut: 'Mod-i',
    action: { kind: 'wrap', before: '_', after: '_' },
  },
  {
    id: 'strike',
    icon: Strikethrough,
    labelKey: 'editor.format.strike',
    action: { kind: 'wrap', before: '~~', after: '~~' },
  },
  {
    id: 'code',
    icon: Code,
    labelKey: 'editor.format.code',
    shortcut: 'Mod-e',
    action: { kind: 'wrap', before: '`', after: '`' },
  },
  {
    id: 'h1',
    icon: Heading1,
    labelKey: 'editor.format.h1',
    shortcut: 'Mod-1',
    action: { kind: 'linePrefix', prefix: '# ', toggle: true },
  },
  {
    id: 'h2',
    icon: Heading2,
    labelKey: 'editor.format.h2',
    shortcut: 'Mod-2',
    action: { kind: 'linePrefix', prefix: '## ', toggle: true },
  },
  {
    id: 'h3',
    icon: Heading3,
    labelKey: 'editor.format.h3',
    shortcut: 'Mod-3',
    action: { kind: 'linePrefix', prefix: '### ', toggle: true },
  },
  {
    id: 'ul',
    icon: List,
    labelKey: 'editor.format.ul',
    action: { kind: 'linePrefix', prefix: '- ' },
  },
  {
    id: 'ol',
    icon: ListOrdered,
    labelKey: 'editor.format.ol',
    action: { kind: 'linePrefix', prefix: '1. ' },
  },
  {
    id: 'task',
    icon: ListTodo,
    labelKey: 'editor.format.task',
    action: { kind: 'linePrefix', prefix: '- [ ] ' },
  },
  {
    id: 'quote',
    icon: Quote,
    labelKey: 'editor.format.quote',
    action: { kind: 'linePrefix', prefix: '> ' },
  },
  {
    id: 'codeblock',
    icon: Code2,
    labelKey: 'editor.format.codeblock',
    action: { kind: 'block', template: '```\n$1\n```' },
  },
  {
    id: 'link',
    icon: LinkIcon,
    labelKey: 'editor.format.link',
    shortcut: 'Mod-k',
    action: { kind: 'block', template: '[$1](url)' },
  },
  {
    id: 'image',
    icon: ImageIcon,
    labelKey: 'editor.format.image',
    action: { kind: 'block', template: '![$1](url)' },
  },
  {
    id: 'table',
    icon: TableIcon,
    labelKey: 'editor.format.table',
    action: {
      kind: 'block',
      template: '| col1 | col2 |\n| --- | --- |\n| $1 |  |',
    },
  },
  {
    id: 'hr',
    icon: Minus,
    labelKey: 'editor.format.hr',
    action: { kind: 'block', template: '\n---\n' },
  },
];

export const FORMAT_COMMANDS_BY_ID: Readonly<
  Record<FormatCommandId, FormatCommand>
> = Object.fromEntries(FORMAT_COMMANDS.map((c) => [c.id, c])) as Readonly<
  Record<FormatCommandId, FormatCommand>
>;

/**
 * Logical groups for the toolbar UI. Each subarray is rendered as a group
 * separated by a divider.
 */
export const FORMAT_GROUPS: readonly (readonly FormatCommandId[])[] = [
  ['bold', 'italic', 'strike', 'code'],
  ['h1', 'h2', 'h3'],
  ['ul', 'ol', 'task', 'quote'],
  ['link', 'image', 'codeblock', 'table', 'hr'],
];
