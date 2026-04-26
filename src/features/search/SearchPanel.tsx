import {
  CaseSensitive,
  ChevronDown,
  ChevronUp,
  Replace,
  ReplaceAll,
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

  const counter =
    query && matchCount > 0
      ? `${activeIndex + 1}/${matchCount}`
      : t('search.noMatches');

  return (
    <form
      className="absolute right-4 top-3 z-10 flex flex-col gap-1 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-1 shadow-sm"
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
          className="inline-flex size-8 items-center justify-center rounded text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 aria-pressed:bg-[rgb(var(--color-control-hover))] aria-pressed:text-[rgb(var(--color-text))]"
          type="button"
          aria-label={t('search.toggleReplace')}
          aria-pressed={replaceMode}
          onClick={onToggleReplace}
        >
          {replaceMode ? (
            <ChevronUp className="size-4" aria-hidden />
          ) : (
            <ChevronDown className="size-4" aria-hidden />
          )}
        </button>
        <input
          ref={inputRef}
          className="h-8 w-56 rounded bg-[rgb(var(--color-editor))] px-2 text-sm text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-muted))] focus-visible:ring-2 focus-visible:ring-emerald-600"
          aria-label={t('search.label')}
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <span
          className="min-w-14 text-center text-xs tabular-nums text-[rgb(var(--color-muted))]"
          aria-live="polite"
        >
          {counter}
        </span>
        <button
          className="inline-flex size-8 items-center justify-center rounded text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          type="button"
          aria-label={t('search.previous')}
          onClick={onPrevious}
        >
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <button
          className="inline-flex size-8 items-center justify-center rounded text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          type="submit"
          aria-label={t('search.next')}
        >
          <ChevronDown className="size-4" aria-hidden />
        </button>
        <button
          className="inline-flex size-8 items-center justify-center rounded text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 aria-pressed:bg-[rgb(var(--color-control-hover))] aria-pressed:text-[rgb(var(--color-text))]"
          type="button"
          aria-label={t('search.caseSensitive')}
          aria-pressed={caseSensitive}
          onClick={() => onCaseSensitiveChange(!caseSensitive)}
        >
          <CaseSensitive className="size-4" aria-hidden />
        </button>
        <button
          className="inline-flex size-8 items-center justify-center rounded text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          type="button"
          aria-label={t('search.close')}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {replaceMode ? (
        <div className="flex items-center gap-1">
          <span className="inline-flex size-8" aria-hidden />
          <input
            className="h-8 w-56 rounded bg-[rgb(var(--color-editor))] px-2 text-sm text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-muted))] focus-visible:ring-2 focus-visible:ring-emerald-600"
            aria-label={t('search.replaceLabel')}
            placeholder={t('search.replacePlaceholder')}
            value={replaceQuery}
            onChange={(event) => onReplaceQueryChange(event.target.value)}
          />
          <span className="min-w-14" aria-hidden />
          <button
            className="inline-flex h-8 items-center justify-center gap-1 rounded px-2 text-xs text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
            type="button"
            aria-label={t('search.replaceOne')}
            disabled={matchCount === 0}
            onClick={onReplaceOne}
          >
            <Replace className="size-4" aria-hidden />
            {t('search.replaceOneShort')}
          </button>
          <button
            className="inline-flex h-8 items-center justify-center gap-1 rounded px-2 text-xs text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
            type="button"
            aria-label={t('search.replaceAll')}
            disabled={matchCount === 0}
            onClick={onReplaceAll}
          >
            <ReplaceAll className="size-4" aria-hidden />
            {t('search.replaceAllShort')}
          </button>
        </div>
      ) : null}
    </form>
  );
}
