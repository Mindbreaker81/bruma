import {
  CaseSensitive,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

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
      className="absolute right-4 top-3 z-10 flex flex-col gap-1 rounded-md border bg-card p-1 shadow-sm"
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
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
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
          className="h-8 w-56 rounded bg-background px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <span className="min-w-14 text-center text-xs tabular-nums text-muted-foreground">
          {matchCount > 0
            ? `${activeIndex + 1} / ${matchCount}`
            : t('search.noMatches')}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={t('search.previous')}
            title={t('search.previous')}
            onClick={onPrevious}
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={t('search.next')}
            title={t('search.next')}
            onClick={onNext}
          >
            <ArrowDown className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
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
          className="inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={t('search.close')}
          title={t('search.close')}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {replaceMode && (
        <div className="flex items-center gap-1 pl-9">
          <input
            type="text"
            className="h-8 w-56 rounded bg-background px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
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
            className="inline-flex h-8 items-center justify-center gap-1 rounded px-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            onClick={onReplaceOne}
            disabled={matchCount === 0}
          >
            {t('search.replace')}
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center gap-1 rounded px-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            onClick={onReplaceAll}
            disabled={matchCount === 0}
          >
            {t('search.replaceAll')}
          </button>
        </div>
      )}
    </form>
  );
}
