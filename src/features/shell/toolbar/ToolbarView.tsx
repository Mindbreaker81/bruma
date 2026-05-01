import { useTranslation } from 'react-i18next';

import { IconButton, ToolbarGroup } from '../../../components/ui/icon-button';
import {
  Columns2,
  Eye,
  LinkIcon,
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
  toggleScrollSync: () => void;
  scrollSyncEnabled: boolean;
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
  toggleScrollSync,
  scrollSyncEnabled,
  viewMode,
  cycleViewMode,
}: ToolbarViewProps) {
  const { t } = useTranslation();

  return (
    <ToolbarGroup label={t('toolbar.view')}>
      <IconButton
        icon={Moon}
        label={t('theme.toggle')}
        onClick={cycleTheme}
        className="rounded-full"
      />
      <IconButton
        icon={Languages}
        label={t('language.toggle')}
        onClick={cycleLanguage}
        className="rounded-full"
      />
      <IconButton
        icon={List}
        label={t('toc.toggle')}
        onClick={toggleToc}
        active={tocOpen}
        className="rounded-full"
      />
      <IconButton
        icon={focusMode ? Maximize2 : EyeOff}
        label={t('focusMode.toggle')}
        onClick={toggleFocusMode}
        active={focusMode}
        className="rounded-full"
      />
      <IconButton
        icon={LinkIcon}
        label={t('scrollSync.toggle')}
        onClick={toggleScrollSync}
        active={scrollSyncEnabled}
        className="rounded-full"
      />
      <IconButton
        icon={viewMode === 'preview' ? Eye : Columns2}
        label={t('view.toggle')}
        onClick={cycleViewMode}
        className="rounded-full"
      />
    </ToolbarGroup>
  );
}
