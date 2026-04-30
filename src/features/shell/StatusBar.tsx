import CheckCheck from 'lucide-react/dist/esm/icons/check-check.js';
import CircleDot from 'lucide-react/dist/esm/icons/circle-dot.js';
import Languages from 'lucide-react/dist/esm/icons/languages.js';
import MoonStar from 'lucide-react/dist/esm/icons/moon-star.js';
import Type from 'lucide-react/dist/esm/icons/type.js';
import { useTranslation } from 'react-i18next';

type StatusBarProps = {
  autosaveStatus: string | null;
  characters: number;
  displayName: string;
  encoding: string;
  eol: string;
  isDirty: boolean;
  languagePreference: 'system' | 'es' | 'en';
  resolvedTheme: 'light' | 'dark';
  words: number;
};

export function StatusBar({
  autosaveStatus,
  characters,
  displayName,
  encoding,
  eol,
  isDirty,
  languagePreference,
  resolvedTheme,
  words,
}: StatusBarProps) {
  const { t } = useTranslation();

  return (
    <footer className="flex h-10 shrink-0 items-center justify-between border-t border-white/50 bg-white/70 px-4 text-xs text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
      <div className="flex min-w-0 items-center gap-2">
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

      <div className="flex items-center gap-2 text-[11px] md:gap-3">
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
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100/80 px-2 py-1 dark:bg-white/5">
          <Languages className="size-3" aria-hidden />
          {t(`language.preference.${languagePreference}`)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100/80 px-2 py-1 dark:bg-white/5">
          <MoonStar className="size-3" aria-hidden />
          {t(`theme.resolved.${resolvedTheme}`)}
        </span>
      </div>
    </footer>
  );
}
