import { type MouseEvent, useEffect, useRef, useState } from 'react';

import { renderSafeMarkdown } from '../../lib/markdown';
import { useScrollSyncStore } from './scrollSync';

type PreviewProps = {
  content: string;
  documentPath?: string | null;
  onExternalLinkClick?: (href: string) => void;
  onLocalImageRequest?: (relativeSrc: string) => Promise<string | null>;
};

const RENDER_DEBOUNCE_MS = 150;

function isAbsoluteUrl(value: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|data:|blob:)/i.test(value);
}

export function Preview({
  content,
  documentPath = null,
  onExternalLinkClick,
  onLocalImageRequest,
}: PreviewProps) {
  const [html, setHtml] = useState(() => renderSafeMarkdown(content));
  const containerRef = useRef<HTMLElement | null>(null);
  const ignoreNextScrollRef = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setHtml(renderSafeMarkdown(content));
    }, RENDER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [content]);

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
      if (state.source !== 'editor') return;
      if (state === prev) return;
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
      aria-label="Markdown preview"
      className="bruma-preview h-full min-h-0 overflow-auto bg-[rgb(var(--color-preview))] px-6 py-5"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
      onScroll={handleScroll}
    />
  );
}
