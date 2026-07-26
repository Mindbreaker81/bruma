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

function isAbsoluteUrl(value: string): boolean {
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
}

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

  // Resolve local images to data URLs after each render.
  useEffect(() => {
    if (!onLocalImageRequest || !containerRef.current) return;
    const root = containerRef.current;
    const images = Array.from(root.querySelectorAll('img'));

    images.forEach((img) => {
      const original = img.getAttribute('src') ?? '';
      if (!original || isAbsoluteUrl(original)) return;
      if (img.dataset.brumaResolved === original) return;
      img.dataset.brumaResolved = original;
      void onLocalImageRequest(original).then((dataUrl) => {
        if (dataUrl) img.setAttribute('src', dataUrl);
      });
    });
  }, [html, onLocalImageRequest, documentPath]);

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
