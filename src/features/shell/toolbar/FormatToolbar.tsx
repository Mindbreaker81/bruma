import { type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Separator } from '../../../components/ui/separator';
import { IconButton } from '../../../components/ui/icon-button';
import type { MarkdownEditorHandle } from '../../editor/MarkdownEditor';
import {
  FORMAT_COMMANDS_BY_ID,
  FORMAT_GROUPS,
} from '../../editor/formatCommands';

type FormatToolbarProps = {
  editorRef: RefObject<MarkdownEditorHandle | null>;
  onOpenGuide?: () => void;
};

function formatShortcut(shortcut: string): string {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
  return shortcut
    .replace(/Mod-/g, isMac ? '⌘' : 'Ctrl+')
    .replace(/Shift-/g, isMac ? '⇧' : 'Shift+')
    .replace(/Alt-/g, isMac ? '⌥' : 'Alt+');
}

export function FormatToolbar({ editorRef, onOpenGuide }: FormatToolbarProps) {
  const { t } = useTranslation();

  return (
    <div
      role="toolbar"
      aria-label={t('editor.format.toolbar')}
      className="flex w-full items-center gap-1 overflow-x-auto border-b border-border/60 bg-background/60 px-3 py-1.5 [scrollbar-width:thin]"
    >
      {FORMAT_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-1">
          {groupIndex > 0 && (
            <Separator orientation="vertical" className="mx-1 h-5 bg-border/70" />
          )}
          {group.map((id) => {
            const cmd = FORMAT_COMMANDS_BY_ID[id];
            const label = t(cmd.labelKey);
            const labelWithShortcut = cmd.shortcut
              ? `${label} (${formatShortcut(cmd.shortcut)})`
              : label;
            return (
              <IconButton
                key={cmd.id}
                icon={cmd.icon}
                label={labelWithShortcut}
                onClick={() => editorRef.current?.applyFormat(cmd.action)}
                className="size-8 rounded-md"
              />
            );
          })}
        </div>
      ))}
      {onOpenGuide && (
        <>
          <Separator orientation="vertical" className="mx-1 h-5 bg-border/70" />
          <button
            type="button"
            onClick={onOpenGuide}
            className="ml-auto shrink-0 rounded-md border border-border/60 px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {t('editor.format.guide.open')}
          </button>
        </>
      )}
    </div>
  );
}
