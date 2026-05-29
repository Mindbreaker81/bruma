import { type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Separator } from '../../../components/ui/separator';
import { UpdateIndicator } from './UpdateIndicator';
import { IconButton } from '../../../components/ui/icon-button';
import { withShortcutLabel } from '../../../lib/formatShortcut';
import type { MarkdownEditorHandle } from '../../editor/MarkdownEditor';
import {
  FORMAT_COMMANDS_BY_ID,
  FORMAT_GROUPS,
  type FormatCommandId,
} from '../../editor/formatCommands';

type FormatToolbarProps = {
  editorRef: RefObject<MarkdownEditorHandle | null>;
  activeFormats?: ReadonlySet<FormatCommandId>;
  onOpenGuide?: () => void;
  onOpenShortcuts?: () => void;
  updateAvailable?: boolean;
  onOpenUpdates?: () => void;
};

export function FormatToolbar({
  editorRef,
  activeFormats,
  onOpenGuide,
  onOpenShortcuts,
  updateAvailable = false,
  onOpenUpdates,
}: FormatToolbarProps) {
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
            <Separator
              orientation="vertical"
              className="mx-1 h-5 bg-border/70"
            />
          )}
          {group.map((id) => {
            const cmd = FORMAT_COMMANDS_BY_ID[id];
            const label = t(cmd.labelKey);
            const labelWithShortcut = withShortcutLabel(label, cmd.shortcut);
            return (
              <IconButton
                key={cmd.id}
                icon={cmd.icon}
                label={labelWithShortcut}
                active={activeFormats?.has(cmd.id)}
                onClick={() => editorRef.current?.applyFormat(cmd.action)}
                className="size-8 rounded-md"
              />
            );
          })}
        </div>
      ))}
      {(onOpenGuide || onOpenShortcuts || onOpenUpdates) && (
        <>
          <Separator orientation="vertical" className="mx-1 h-5 bg-border/70" />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {onOpenUpdates && (
              <UpdateIndicator
                available={updateAvailable}
                onOpen={onOpenUpdates}
              />
            )}
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="rounded-md border border-border/60 px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {t('editor.format.guide.open')}
              </button>
            )}
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                className="rounded-md border border-border/60 px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {t('shortcuts.open')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
