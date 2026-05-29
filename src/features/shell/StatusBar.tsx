import { useTranslation } from 'react-i18next';
import { Type, MoonStar, Languages, CircleDot, CheckCheck } from 'lucide-react';
import { withShortcutLabel } from '../../lib/formatShortcut';
import { getShortcutById } from '../../lib/shortcutsCatalog';
import type { ViewMode } from '../settings/view';

type CursorPosition = {
  line: number;
  column: number;
};

type StatusBarProps = {
  autosaveStatus: string | null;
  characters: number;
  cursorPosition: CursorPosition | null;
  displayName: string;
  encoding: string;
  eol: string;
  isDirty: boolean;
  cycleLanguage: () => void;
  cycleTheme: () => void;
  languagePreference: 'system' | 'es' | 'en';
  resolvedTheme: 'light' | 'dark';
  viewMode: ViewMode;
  words: number;
};

export function StatusBar({
  autosaveStatus,
  characters,
  cursorPosition,
  displayName,
  encoding,
  eol,
  isDirty,
  cycleLanguage,
  cycleTheme,
  languagePreference,
  resolvedTheme,
  viewMode,
  words,
}: StatusBarProps) {
  const { t } = useTranslation();
  const languagePreferenceLabel = t(
    `language.preference.${languagePreference}`
  );
  const resolvedThemeLabel = t(`theme.resolved.${resolvedTheme}`);
  const languageToggleLabel = t('language.toggle', {
    language: languagePreferenceLabel,
  });
  const themeToggleLabel = withShortcutLabel(
    t('theme.toggle'),
    getShortcutById('view.toggleTheme')?.shortcut
  );

  return (
    <footer className="flex h-10 shrink-0 items-center gap-3 border-t border-white/50 bg-white/70 px-4 text-xs text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        <span className="truncate font-medium text-foreground/80">
          {displayName}
        </span>
        {autosaveStatus ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
            <CheckCheck className="size-3" aria-hidden />
            {autosaveStatus}
          </span>
        ) : isDirty ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-300">
            <CircleDot className="size-3" aria-hidden />
            {t('document.unsaved')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
            <CheckCheck className="size-3" aria-hidden />
            {t('document.saved')}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 overflow-x-auto text-[11px] [scrollbar-width:none] md:gap-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100/80 px-2 py-1 dark:bg-white/5">
          <Type className="size-3" aria-hidden />
          {t('stats.wordsValue', { count: words })}
        </span>
        <span className="rounded-full bg-stone-100/80 px-2 py-1 tabular-nums dark:bg-white/5">
          {t('stats.charactersValue', { count: characters })}
        </span>
        <span className="rounded-full bg-stone-100/80 px-2 py-1 font-medium tabular-nums dark:bg-white/5">
          {encoding.toUpperCase()}
        </span>
        <span className="rounded-full bg-stone-100/80 px-2 py-1 font-medium tabular-nums dark:bg-white/5">
          {eol.toUpperCase()}
        </span>
        {viewMode !== 'preview' && cursorPosition ? (
          <span className="rounded-full bg-stone-100/80 px-2 py-1 font-medium tabular-nums dark:bg-white/5">
            {t('stats.cursor', {
              line: cursorPosition.line,
              column: cursorPosition.column,
            })}
          </span>
        ) : null}
        <button
          type="button"
          onClick={cycleLanguage}
          aria-label={languageToggleLabel}
          title={languageToggleLabel}
          className="inline-flex items-center gap-1 rounded-full bg-stone-100/80 px-2 py-1 transition hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:hover:bg-white/10"
        >
          <Languages className="size-3" aria-hidden />
          {languagePreferenceLabel}
        </button>
        <button
          type="button"
          onClick={cycleTheme}
          aria-label={themeToggleLabel}
          title={themeToggleLabel}
          className="inline-flex items-center gap-1 rounded-full bg-stone-100/80 px-2 py-1 transition hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:hover:bg-white/10"
        >
          <MoonStar className="size-3" aria-hidden />
          {resolvedThemeLabel}
        </button>
      </div>
    </footer>
  );
}
