import { FORMAT_COMMANDS } from '../features/editor/formatCommands';

export type ShortcutItem = {
  id: string;
  labelKey: string;
  shortcut: string;
};

export type ShortcutGroup = {
  id: 'file' | 'edit' | 'view' | 'format' | 'zoom';
  labelKey: string;
  items: readonly ShortcutItem[];
};

// This catalog intentionally mirrors native accelerators declared in
// `src-tauri/src/menu.rs` plus frontend-only bindings.

const FORMAT_SHORTCUTS: readonly ShortcutItem[] = FORMAT_COMMANDS.flatMap(
  (cmd) => {
    if (!cmd.shortcut) {
      return [];
    }

    return [
      {
        id: `format.${cmd.id}`,
        labelKey: cmd.labelKey,
        shortcut: cmd.shortcut,
      },
    ];
  }
);

export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    id: 'file',
    labelKey: 'shortcuts.group.file',
    items: [
      {
        id: 'file.new',
        labelKey: 'shortcuts.action.fileNew',
        shortcut: 'Mod-N',
      },
      {
        id: 'file.open',
        labelKey: 'shortcuts.action.fileOpen',
        shortcut: 'Mod-O',
      },
      {
        id: 'file.save',
        labelKey: 'shortcuts.action.fileSave',
        shortcut: 'Mod-S',
      },
      {
        id: 'file.saveAs',
        labelKey: 'shortcuts.action.fileSaveAs',
        shortcut: 'Mod-Shift-S',
      },
      {
        id: 'file.print',
        labelKey: 'shortcuts.action.filePrint',
        shortcut: 'Mod-P',
      },
    ],
  },
  {
    id: 'edit',
    labelKey: 'shortcuts.group.edit',
    items: [
      {
        id: 'edit.find',
        labelKey: 'shortcuts.action.editFind',
        shortcut: 'Mod-F',
      },
      {
        id: 'help.preferences',
        labelKey: 'shortcuts.action.helpPreferences',
        shortcut: 'Mod-,',
      },
      {
        id: 'help.shortcuts',
        labelKey: 'shortcuts.action.helpShortcuts',
        shortcut: '?',
      },
    ],
  },
  {
    id: 'view',
    labelKey: 'shortcuts.group.view',
    items: [
      {
        id: 'view.toggleMode',
        labelKey: 'shortcuts.action.viewToggleMode',
        shortcut: 'Mod-Shift-V',
      },
      {
        id: 'view.toggleTheme',
        labelKey: 'shortcuts.action.viewToggleTheme',
        shortcut: 'Mod-Shift-T',
      },
      {
        id: 'view.toggleFocusMode',
        labelKey: 'shortcuts.action.viewToggleFocusMode',
        shortcut: 'Mod-Shift-M',
      },
      {
        id: 'view.toggleToc',
        labelKey: 'shortcuts.action.viewToggleToc',
        shortcut: 'Mod-Shift-H',
      },
    ],
  },
  {
    id: 'format',
    labelKey: 'shortcuts.group.format',
    items: FORMAT_SHORTCUTS,
  },
  {
    id: 'zoom',
    labelKey: 'shortcuts.group.zoom',
    items: [
      {
        id: 'zoom.increase',
        labelKey: 'shortcuts.action.zoomIn',
        shortcut: 'Mod-+',
      },
      {
        id: 'zoom.decrease',
        labelKey: 'shortcuts.action.zoomOut',
        shortcut: 'Mod--',
      },
      {
        id: 'zoom.reset',
        labelKey: 'shortcuts.action.zoomReset',
        shortcut: 'Mod-0',
      },
    ],
  },
] as const;

const SHORTCUT_LOOKUP = new Map<string, ShortcutItem>(
  SHORTCUT_GROUPS.flatMap((group) =>
    group.items.map((item) => [item.id, item] as const)
  )
);

export function getShortcutById(id: string): ShortcutItem | undefined {
  return SHORTCUT_LOOKUP.get(id);
}
