import { CaseSensitive, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

type SearchPanelProps = {
  activeIndex: number;
  caseSensitive: boolean;
  matchCount: number;
  query: string;
  onCaseSensitiveChange: (caseSensitive: boolean) => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onQueryChange: (query: string) => void;
};

export function SearchPanel({
  activeIndex,
  caseSensitive,
  matchCount,
  query,
  onCaseSensitiveChange,
  onClose,
  onNext,
  onPrevious,
  onQueryChange,
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
      className="absolute right-4 top-3 z-10 flex items-center gap-1 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-1 shadow-sm"
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
        className="inline-flex size-8 items-center justify-center rounded text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))]"
        type="button"
        aria-label={t('search.previous')}
        onClick={onPrevious}
      >
        <ChevronUp className="size-4" aria-hidden />
      </button>
      <button
        className="inline-flex size-8 items-center justify-center rounded text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))]"
        type="submit"
        aria-label={t('search.next')}
      >
        <ChevronDown className="size-4" aria-hidden />
      </button>
      <button
        className="inline-flex size-8 items-center justify-center rounded text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] aria-pressed:bg-[rgb(var(--color-control-hover))] aria-pressed:text-[rgb(var(--color-text))]"
        type="button"
        aria-label={t('search.caseSensitive')}
        aria-pressed={caseSensitive}
        onClick={() => onCaseSensitiveChange(!caseSensitive)}
      >
        <CaseSensitive className="size-4" aria-hidden />
      </button>
      <button
        className="inline-flex size-8 items-center justify-center rounded text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))]"
        type="button"
        aria-label={t('search.close')}
        onClick={onClose}
      >
        <X className="size-4" aria-hidden />
      </button>
    </form>
  );
}
