import { useTranslation } from 'react-i18next';

import { Switch } from '../../../components/ui/switch';
import { IconButton, ToolbarGroup } from '../../../components/ui/icon-button';
import { Search } from 'lucide-react';

type ToolbarWriteProps = {
  autosaveEnabled: boolean;
  setAutosaveEnabled: (enabled: boolean) => void;
  handleOpenSearch: () => void;
};

export function ToolbarWrite({
  autosaveEnabled,
  setAutosaveEnabled,
  handleOpenSearch,
}: ToolbarWriteProps) {
  const { t } = useTranslation();

  return (
    <ToolbarGroup label={t('toolbar.write')}>
      <div className="flex items-center gap-2 rounded-full bg-stone-100/80 px-3 py-1.5 dark:bg-white/5">
        <label
          htmlFor="toolbar-autosave"
          className="cursor-pointer text-xs font-medium text-muted-foreground"
        >
          {t('autosave.toggle')}
        </label>
        <Switch
          id="toolbar-autosave"
          checked={autosaveEnabled}
          onCheckedChange={setAutosaveEnabled}
        />
      </div>
      <IconButton
        icon={Search}
        label={t('search.open')}
        onClick={handleOpenSearch}
        className="rounded-full"
      />
    </ToolbarGroup>
  );
}
