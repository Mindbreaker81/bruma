import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { stripFrontmatter } from '../../lib/frontmatter';
import { renderSafeMarkdown } from '../../lib/markdown';
import { useScrollSyncStore } from './scrollSync';

type PreviewProps = {
  content: string;
  documentPath?: string | null;
  hideFrontmatter?: boolean;
  onExternalLinkClick?: (href: string) => void;
  onLocalImageRequest?: (relativeSrc: string) => Promise<string | null>;
  maxWidth?: number;
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
}: PreviewProps) {
  const { t } = useTranslation();
  const sourceForRender = hideFrontmatter ? stripFrontmatter(content) : content;
  const [html, setHtml] = useState(() => renderSafeMarkdown(sourceForRender));
  const containerRef = useRef<HTMLElement | null>(null);
  const ignoreNextScrollRef = useRef(false);

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

  // Subscribe to external scroll source.
  useEffect(() => {
    return useScrollSyncStore.subscribe((state, prev) => {
      if (!state.enabled) return;
      if (state.source !== 'editor') return;
      if (state.ratio === prev.ratio && state.source === prev.source) return;
      const node = containerRef.current;
      if (!node) return;
      const max = node.scrollHeight - node.clientHeight;
      if (max <= 0) return;
      ignoreNextScrollRef.current = true;
      node.scrollTop = state.ratio * max;
    });
  }, []);

  const handleScroll = () => {
    if (ignoreNextScrollRef.current) {
      ignoreNextScrollRef.current = false;
      return;
    }
    if (!useScrollSyncStore.getState().enabled) return;
    const node = containerRef.current;
    if (!node) return;
    const max = node.scrollHeight - node.clientHeight;
    if (max <= 0) return;
    useScrollSyncStore.getState().emit('preview', node.scrollTop / max);
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const anchor = (event.target as HTMLElement | null)?.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href') ?? '';
    if (!href) return;
    if (/^https?:/i.test(href) && onExternalLinkClick) {
      event.preventDefault();
      onExternalLinkClick(href);
    }
  };

  return (
    <article
      ref={containerRef}
      aria-label={t('preview.label')}
      className="bruma-preview min-h-0 flex-1 overflow-auto bg-background px-6 py-5"
      style={{ maxWidth: `${maxWidth}ch`, margin: '0 auto' }}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
      onScroll={handleScroll}
    />
  );
}
