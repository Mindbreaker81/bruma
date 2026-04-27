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
      className="flex h-full min-h-0 w-64 shrink-0 flex-col border-r bg-muted/40"
      aria-label="Table of contents"
    >
      <header className="flex h-10 shrink-0 items-center px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('toc.title')}
      </header>
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {headings.length === 0 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            {t('toc.empty')}
          </p>
        ) : (
          <ul className="space-y-1">
            {headings.map((h: TocEntry, i: number) => (
              <li key={`${h.line}-${i}`}>
                <button
                  type="button"
                  className="block w-full rounded px-2 py-1 text-left text-sm text-foreground hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
