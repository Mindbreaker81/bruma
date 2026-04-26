import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { parseHeadings } from '../../lib/toc';

type TableOfContentsProps = {
  content: string;
  onSelect: (line: number) => void;
};

export function TableOfContents({ content, onSelect }: TableOfContentsProps) {
  const { t } = useTranslation();
  const entries = useMemo(() => parseHeadings(content), [content]);

  return (
    <aside
      aria-label={t('toc.title')}
      className="flex h-full min-h-0 w-64 shrink-0 flex-col border-r border-[rgb(var(--color-border))] bg-[rgb(var(--color-panel))]"
    >
      <header className="flex h-10 shrink-0 items-center px-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--color-muted))]">
        {t('toc.title')}
      </header>
      <nav className="flex-1 overflow-auto px-2 pb-2 text-sm">
        {entries.length === 0 ? (
          <p className="px-2 py-2 text-[rgb(var(--color-muted))]">
            {t('toc.empty')}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((entry) => (
              <li key={`${entry.line}-${entry.slug}`}>
                <button
                  className="block w-full rounded px-2 py-1 text-left text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-control-hover))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  type="button"
                  style={{
                    paddingLeft: `${0.5 + (entry.level - 1) * 0.75}rem`,
                  }}
                  title={entry.text}
                  onClick={() => onSelect(entry.line)}
                >
                  <span className="block truncate">{entry.text}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
