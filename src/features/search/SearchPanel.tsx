import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ChevronRight,
  CaseSensitive,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

type SearchPanelProps = {
  activeIndex: number;
  caseSensitive: boolean;
  matchCount: number;
  query: string;
  replaceQuery: string;
  replaceMode: boolean;
  onCaseSensitiveChange: (caseSensitive: boolean) => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onQueryChange: (query: string) => void;
  onReplaceQueryChange: (query: string) => void;
  onToggleReplace: () => void;
  onReplaceOne: () => void;
  onReplaceAll: () => void;
};

export function SearchPanel({
  activeIndex,
  caseSensitive,
  matchCount,
  query,
  replaceQuery,
  replaceMode,
  onCaseSensitiveChange,
  onClose,
  onNext,
  onPrevious,
  onQueryChange,
  onReplaceQueryChange,
  onToggleReplace,
  onReplaceOne,
  onReplaceAll,
}: SearchPanelProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <form
      className="absolute inset-x-4 top-4 z-overlay flex max-w-4xl flex-col gap-2 rounded-[1.25rem] border border-white/60 bg-white/90 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.12)] ring-1 ring-emerald-950/5 backdrop-blur animate-in fade-in slide-in-from-top-2 duration-200 dark:border-white/10 dark:bg-zinc-950/80 dark:ring-white/10"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
          aria-pressed={replaceMode}
          aria-label={t('search.toggleReplace')}
          title={t('search.toggleReplace')}
          onClick={onToggleReplace}
        >
          <ChevronRight
            className={`size-4 transition-transform ${replaceMode ? 'rotate-90' : ''}`}
          />
        </button>
        <input
          ref={inputRef}
          type="text"
          className="h-10 min-w-[14rem] flex-1 rounded-full border border-transparent bg-background/90 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus-visible:border-emerald-800/10 focus-visible:ring-2 focus-visible:ring-primary"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <span className="min-w-16 text-center text-xs tabular-nums text-muted-foreground">
          {matchCount > 0
            ? `${activeIndex + 1} / ${matchCount}`
            : t('search.noMatches')}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={t('search.previous')}
            title={t('search.previous')}
            onClick={onPrevious}
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={t('search.next')}
            title={t('search.next')}
            onClick={onNext}
          >
            <ArrowDown className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
            aria-pressed={caseSensitive}
            aria-label={t('search.caseSensitive')}
            title={t('search.caseSensitive')}
            onClick={() => onCaseSensitiveChange(!caseSensitive)}
          >
            <CaseSensitive className="size-4" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={t('search.close')}
          title={t('search.close')}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {replaceMode && (
        <div className="flex flex-wrap items-center gap-2 pl-11">
          <input
            type="text"
            className="h-10 min-w-[14rem] flex-1 rounded-full border border-transparent bg-background/90 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground transition focus-visible:border-emerald-800/10 focus-visible:ring-2 focus-visible:ring-primary"
            placeholder={t('search.replacePlaceholder')}
            value={replaceQuery}
            onChange={(e) => onReplaceQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onReplaceOne();
              }
            }}
          />
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-1 rounded-full bg-stone-100/80 px-4 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 dark:bg-white/5"
            onClick={onReplaceOne}
            disabled={matchCount === 0}
          >
            {t('search.replaceOneShort')}
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-1 rounded-full bg-stone-100/80 px-4 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 dark:bg-white/5"
            onClick={onReplaceAll}
            disabled={matchCount === 0}
          >
            {t('search.replaceAllShort')}
          </button>
        </div>
      )}
    </form>
  );
}
