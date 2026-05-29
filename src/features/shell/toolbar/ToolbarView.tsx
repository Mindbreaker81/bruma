import { useTranslation } from 'react-i18next';

import { IconButton, ToolbarGroup } from '../../../components/ui/icon-button';
import { withShortcutLabel } from '../../../lib/formatShortcut';
import { getShortcutById } from '../../../lib/shortcutsCatalog';
import {
  Columns2,
  Eye,
  EyeOff,
  Maximize2,
  List,
  Languages,
  Moon,
} from 'lucide-react';

type ToolbarViewProps = {
  cycleTheme: () => void;
  cycleLanguage: () => void;
  toggleToc: () => void;
  tocOpen: boolean;
  focusMode: boolean;
  toggleFocusMode: () => void;
  viewMode: string;
  cycleViewMode: () => void;
};

export function ToolbarView({
  cycleTheme,
  cycleLanguage,
  toggleToc,
  tocOpen,
  focusMode,
  toggleFocusMode,
  viewMode,
  cycleViewMode,
}: ToolbarViewProps) {
  const { t } = useTranslation();
  const themeLabel = withShortcutLabel(
    t('theme.toggle'),
    getShortcutById('view.toggleTheme')?.shortcut
  );
  const tocLabel = withShortcutLabel(
    t('toc.toggle'),
    getShortcutById('view.toggleToc')?.shortcut
  );
  const focusLabel = withShortcutLabel(
    t('focusMode.toggle'),
    getShortcutById('view.toggleFocusMode')?.shortcut
  );
  const viewModeLabel = withShortcutLabel(
    t('view.toggle'),
    getShortcutById('view.toggleMode')?.shortcut
  );
  const languageLabel = t('language.toggle', {
    language: t('language.preference.system'),
  });

  return (
    <ToolbarGroup label={t('toolbar.view')}>
      <IconButton
        icon={Moon}
        label={themeLabel}
        onClick={cycleTheme}
        className="rounded-full"
      />
      <IconButton
        icon={Languages}
        label={languageLabel}
        onClick={cycleLanguage}
        className="rounded-full"
      />
      <IconButton
        icon={List}
        label={tocLabel}
        onClick={toggleToc}
        active={tocOpen}
        className="rounded-full"
      />
      <IconButton
        icon={focusMode ? Maximize2 : EyeOff}
        label={focusLabel}
        onClick={toggleFocusMode}
        active={focusMode}
        className="rounded-full"
      />
      <IconButton
        icon={viewMode === 'preview' ? Eye : Columns2}
        label={viewModeLabel}
        onClick={cycleViewMode}
        className="rounded-full"
      />
    </ToolbarGroup>
  );
}
