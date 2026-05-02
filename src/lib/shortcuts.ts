export type CommandId =
  | 'newDocument'
  | 'openDocument'
  | 'saveDocument'
  | 'saveAsDocument'
  | 'closeTab'
  | 'newTab'
  | 'nextTab'
  | 'previousTab'
  | 'toggleSearch'
  | 'toggleTheme'
  | 'toggleViewMode'
  | 'toggleFocusMode'
  | 'togglePreferences'
  | 'toggleTemplateMenu'
  | 'exportHtml';

export type CommandDefinition = {
  id: CommandId;
  label: string;
  defaultShortcut: string | null;
  action: () => void;
};

export const COMMAND_REGISTRY: Record<CommandId, CommandDefinition> = {
  newDocument: {
    id: 'newDocument',
    label: 'New document',
    defaultShortcut: 'Mod+n',
    action: () => {},
  },
  openDocument: {
    id: 'openDocument',
    label: 'Open document',
    defaultShortcut: 'Mod+o',
    action: () => {},
  },
  saveDocument: {
    id: 'saveDocument',
    label: 'Save document',
    defaultShortcut: 'Mod+s',
    action: () => {},
  },
  saveAsDocument: {
    id: 'saveAsDocument',
    label: 'Save as...',
    defaultShortcut: 'Mod+Shift+s',
    action: () => {},
  },
  closeTab: {
    id: 'closeTab',
    label: 'Close tab',
    defaultShortcut: 'Mod+w',
    action: () => {},
  },
  newTab: {
    id: 'newTab',
    label: 'New tab',
    defaultShortcut: 'Mod+t',
    action: () => {},
  },
  nextTab: {
    id: 'nextTab',
    label: 'Next tab',
    defaultShortcut: 'Mod+Tab',
    action: () => {},
  },
  previousTab: {
    id: 'previousTab',
    label: 'Previous tab',
    defaultShortcut: 'Mod+Shift+Tab',
    action: () => {},
  },
  toggleSearch: {
    id: 'toggleSearch',
    label: 'Find',
    defaultShortcut: 'Mod+f',
    action: () => {},
  },
  toggleTheme: {
    id: 'toggleTheme',
    label: 'Toggle theme',
    defaultShortcut: 'Mod+Shift+t',
    action: () => {},
  },
  toggleViewMode: {
    id: 'toggleViewMode',
    label: 'Toggle view mode',
    defaultShortcut: 'Mod+Shift+v',
    action: () => {},
  },
  toggleFocusMode: {
    id: 'toggleFocusMode',
    label: 'Toggle focus mode',
    defaultShortcut: 'Mod+Shift+f',
    action: () => {},
  },
  togglePreferences: {
    id: 'togglePreferences',
    label: 'Preferences',
    defaultShortcut: 'Mod+,',
    action: () => {},
  },
  toggleTemplateMenu: {
    id: 'toggleTemplateMenu',
    label: 'Templates',
    defaultShortcut: 'Mod+Shift+n',
    action: () => {},
  },
  exportHtml: {
    id: 'exportHtml',
    label: 'Export HTML',
    defaultShortcut: 'Mod+Shift+e',
    action: () => {},
  },
};

function isMacOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad/i.test(navigator.platform) || /Mac/i.test(navigator.userAgent);
}

export function formatBindingForDisplay(binding: string | null): string {
  if (!binding) return '';
  const parts = binding.split('+');
  if (isMacOS()) {
    return parts
      .map((p) => {
        switch (p.toLowerCase()) {
          case 'mod':
            return '⌘';
          case 'shift':
            return '⇧';
          case 'alt':
            return '⌥';
          case 'ctrl':
            return '⌃';
          default:
            return p.toUpperCase();
        }
      })
      .join('');
  }
  return parts
    .map((p) => {
      switch (p.toLowerCase()) {
        case 'mod':
          return 'Ctrl';
        case 'shift':
          return 'Shift';
        case 'alt':
          return 'Alt';
        default:
          return p.charAt(0).toUpperCase() + p.slice(1);
      }
    })
    .join('+');
}

export function normalizeBinding(binding: string): string {
  return binding
    .toLowerCase()
    .replace(/meta/g, 'mod')
    .replace(/ctrl/g, 'mod')
    .replace(/cmd/g, 'mod')
    .replace(/command/g, 'mod')
    .replace(/ /g, '+');
}

export function matchBinding(event: KeyboardEvent, binding: string): boolean {
  const parts = binding.split('+').filter(Boolean);
  if (parts.length === 0) return false;
  const modifiers = parts.slice(0, -1);
  const key = parts[parts.length - 1]!;

  const hasMod = event.metaKey || event.ctrlKey;
  const hasShift = event.shiftKey;
  const hasAlt = event.altKey;

  if (modifiers.includes('mod') !== hasMod) return false;
  if (modifiers.includes('shift') !== hasShift) return false;
  if (modifiers.includes('alt') !== hasAlt) return false;

  return event.key.toLowerCase() === key.toLowerCase();
}

export function detectConflicts(
  shortcuts: Partial<Record<CommandId, string | null>>
): Map<string, CommandId[]> {
  const byBinding = new Map<string, CommandId[]>();

  for (const [id, binding] of Object.entries(shortcuts) as [
    CommandId,
    string | null,
  ][]) {
    if (!binding) continue;
    const normalized = normalizeBinding(binding);
    const list = byBinding.get(normalized) ?? [];
    list.push(id);
    byBinding.set(normalized, list);
  }

  return byBinding;
}
