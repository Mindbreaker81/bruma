import { useTranslation } from 'react-i18next';

import { Switch } from '../../components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import type { ViewMode } from '../settings/view';

const VIEW_MODES: ViewMode[] = ['editor', 'split', 'preview'];

type ViewModeBarProps = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showFrontmatter: boolean;
  toggleShowFrontmatter: () => void;
  themePreference: string;
  focusMode: boolean;
  splitScrollSync: boolean;
  setSplitScrollSync: (enabled: boolean) => void;
};

export function ViewModeBar({
  viewMode,
  setViewMode,
  showFrontmatter,
  toggleShowFrontmatter,
  themePreference,
  focusMode,
  splitScrollSync,
  setSplitScrollSync,
}: ViewModeBarProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`${focusMode ? 'hidden' : 'flex'} h-12 items-center justify-between border-b border-white/50 bg-white/60 px-4 text-xs text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-zinc-950/60`}
    >
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as ViewMode)}
        className="inline-flex"
      >
        <TabsList>
          {VIEW_MODES.map((mode) => (
            <TabsTrigger key={mode} value={mode}>
              {t(`view.mode.${mode}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <button
          className="rounded-full px-3 py-1.5 transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
          type="button"
          aria-label={t('frontmatter.toggle')}
          title={t('frontmatter.toggle')}
          aria-pressed={!showFrontmatter}
          onClick={toggleShowFrontmatter}
        >
          {showFrontmatter ? t('frontmatter.shown') : t('frontmatter.hidden')}
        </button>
        {viewMode === 'split' ? (
          <div className="flex items-center gap-2 rounded-full bg-stone-100/80 px-3 py-1.5 dark:bg-white/5">
            <label
              htmlFor="view-sync-scroll"
              className="cursor-pointer text-xs font-medium text-muted-foreground"
            >
              {t('view.syncScroll')}
            </label>
            <Switch
              id="view-sync-scroll"
              checked={splitScrollSync}
              onCheckedChange={setSplitScrollSync}
            />
          </div>
        ) : null}
        <span className="truncate">
          {t(`theme.preference.${themePreference}`)} ·{' '}
          {t(`view.mode.${viewMode}`)}
        </span>
      </div>
    </div>
  );
}
