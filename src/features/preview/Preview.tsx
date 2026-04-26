import { useEffect, useState } from 'react';

import { renderSafeMarkdown } from '../../lib/markdown';

type PreviewProps = {
  content: string;
};

const RENDER_DEBOUNCE_MS = 150;

export function Preview({ content }: PreviewProps) {
  const [html, setHtml] = useState(() => renderSafeMarkdown(content));

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setHtml(renderSafeMarkdown(content));
    }, RENDER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [content]);

  return (
    <article
      aria-label="Markdown preview"
      className="bruma-preview h-full min-h-0 overflow-auto bg-[rgb(var(--color-preview))] px-6 py-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
