import {
  type MouseEvent,
  type MutableRefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { stripFrontmatter } from '../../lib/frontmatter';
import { renderSafeMarkdown } from '../../lib/markdown';
import { resolveLocalImages } from '../../lib/images';

type PreviewProps = {
  content: string;
  documentPath?: string | null;
  hideFrontmatter?: boolean;
  onExternalLinkClick?: (href: string) => void;
  onLocalImageRequest?: (relativeSrc: string) => Promise<string | null>;
  maxWidth?: number;
  scrollContainerRef?: MutableRefObject<HTMLElement | null>;
};

const RENDER_DEBOUNCE_MS = 150;

export function Preview({
  content,
  documentPath = null,
  hideFrontmatter = false,
  onExternalLinkClick,
  onLocalImageRequest,
  maxWidth = 65,
  scrollContainerRef,
}: PreviewProps) {
  const { t } = useTranslation();
  const sourceForRender = hideFrontmatter ? stripFrontmatter(content) : content;
  const [html, setHtml] = useState(() => renderSafeMarkdown(sourceForRender));
  const containerRef = useRef<HTMLElement | null>(null);

  function assignRefs(node: HTMLElement | null) {
    containerRef.current = node;
    if (scrollContainerRef) {
      scrollContainerRef.current = node;
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setHtml(renderSafeMarkdown(sourceForRender));
    }, RENDER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [sourceForRender]);

  useEffect(() => {
    if (!onLocalImageRequest) return;
    let cancelled = false;
    void resolveLocalImages(html, documentPath, (_basePath, relativeSrc) =>
      onLocalImageRequest(relativeSrc)
    ).then((resolvedHtml) => {
      if (!cancelled && resolvedHtml !== html) {
        setHtml(resolvedHtml);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [documentPath, html, onLocalImageRequest]);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const anchor = (event.target as HTMLElement | null)?.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href') ?? '';
    if (!href) return;

    // Every link is handled here. Anything left to the browser would navigate
    // the webview away from the app shell (a relative `./notes.md` resolves
    // against the app origin and leaves an unrecoverable blank window), so the
    // default is always prevented.
    event.preventDefault();

    if (/^https?:/i.test(href)) {
      onExternalLinkClick?.(href);
      return;
    }

    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1));
      if (!id) return;
      const target = containerRef.current?.querySelector(
        `[id="${CSS.escape(id)}"]`
      );
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <article
      ref={assignRefs}
      aria-label={t('preview.label')}
      className="bruma-preview min-h-0 flex-1 overflow-auto bg-background px-6 py-5"
      style={{ maxWidth: `${maxWidth}ch`, margin: '0 auto' }}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  );
}
