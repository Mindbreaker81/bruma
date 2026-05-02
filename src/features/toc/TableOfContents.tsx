import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseHeadings, type TocEntry } from '../../lib/toc';

type TableOfContentsProps = {
  content: string;
  onSelect: (line: number) => void;
};

export function TableOfContents({ content, onSelect }: TableOfContentsProps) {
  const { t } = useTranslation();
  const headings = useMemo(() => parseHeadings(content), [content]);

  return (
    <aside
      className="flex h-full min-h-0 w-72 shrink-0 flex-col border-r border-white/50 bg-white/70 backdrop-blur animate-in fade-in slide-in-from-left-2 duration-200 dark:border-white/10 dark:bg-zinc-950/70"
      aria-label={t('toc.label')}
    >
      <header className="flex h-12 shrink-0 items-center px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {t('toc.title')}
      </header>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {headings.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            {t('toc.empty')}
          </p>
        ) : (
          <ul className="space-y-1">
            {headings.map((h: TocEntry, i: number) => (
              <li key={`${h.line}-${i}`}>
                <button
                  type="button"
                  className="block w-full rounded-2xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{ paddingLeft: `${(h.level - 1) * 1 + 0.5}rem` }}
                  onClick={() => onSelect(h.line)}
                >
                  <span className="truncate">{h.text}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
