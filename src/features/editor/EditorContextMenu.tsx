import { type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ContextMenuArea } from '../../components/ui/context-menu';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from '../../components/ui/dropdown-menu';
import { canReadClipboard, readClipboardText } from '../../lib/clipboard';
import { formatShortcut } from '../../lib/formatShortcut';
import { getShortcutById, resolveShortcut } from '../../lib/shortcutsCatalog';
import { FORMAT_COMMANDS_BY_ID, type FormatCommandId } from './formatCommands';
import type { MarkdownEditorHandle } from './MarkdownEditor';

type EditorContextMenuProps = {
  editorRef: RefObject<MarkdownEditorHandle | null>;
  onCopyAsHtml: () => void;
  children: ReactNode;
};

const FORMAT_ITEMS: readonly FormatCommandId[] = ['bold', 'italic', 'link'];

function shortcutHint(id: string): string | null {
  const item = getShortcutById(id);
  return item ? formatShortcut(resolveShortcut(item)) : null;
}

export function EditorContextMenu({
  editorRef,
  onCopyAsHtml,
  children,
}: EditorContextMenuProps) {
  const { t } = useTranslation();
  const canPaste = canReadClipboard();

  const handlePaste = async () => {
    const text = await readClipboardText();
    if (text === null) {
      toast.error(t('clipboard.pasteFailed'));
      editorRef.current?.focus();
      return;
    }
    editorRef.current?.paste(text);
  };

  const menu = (
    <>
      <DropdownMenuItem onSelect={() => editorRef.current?.cut()}>
        {t('clipboard.cut')}
        <DropdownMenuShortcut>{shortcutHint('edit.cut')}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => editorRef.current?.copy()}>
        {t('clipboard.copy')}
        <DropdownMenuShortcut>{shortcutHint('edit.copy')}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={!canPaste}
        onSelect={() => void handlePaste()}
      >
        {t('clipboard.paste')}
        <DropdownMenuShortcut>
          {shortcutHint('edit.paste')}
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => editorRef.current?.selectAll()}>
        {t('clipboard.selectAll')}
        <DropdownMenuShortcut>
          {shortcutHint('edit.selectAll')}
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {FORMAT_ITEMS.map((id) => {
        const cmd = FORMAT_COMMANDS_BY_ID[id];
        return (
          <DropdownMenuItem
            key={id}
            onSelect={() => editorRef.current?.applyFormat(cmd.action)}
          >
            {t(cmd.labelKey)}
            <DropdownMenuShortcut>
              {cmd.shortcut ? formatShortcut(cmd.shortcut) : null}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        );
      })}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onCopyAsHtml}>
        {t('clipboard.copyAsHtml')}
      </DropdownMenuItem>
    </>
  );

  return <ContextMenuArea menu={menu}>{children}</ContextMenuArea>;
}
