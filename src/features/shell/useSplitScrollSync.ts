import { type RefObject, useEffect } from 'react';

import type { MarkdownEditorHandle } from '../editor/MarkdownEditor';

type UseSplitScrollSyncArgs = {
  enabled: boolean;
  editorHandleRef: RefObject<MarkdownEditorHandle | null>;
  previewRef: RefObject<HTMLElement | null>;
};

/**
 * Returns the 0-based source line of the topmost visible block in `previewEl`,
 * or `null` if no annotated element is visible.
 */
function previewTopLine(previewEl: HTMLElement): number | null {
  const elements =
    previewEl.querySelectorAll<HTMLElement>('[data-source-line]');
  if (elements.length === 0) return null;

  const containerTop = previewEl.getBoundingClientRect().top;
  let candidate: number | null = null;

  for (const el of elements) {
    const top = el.getBoundingClientRect().top - containerTop;
    if (top <= 0) {
      candidate = Number.parseInt(el.dataset.sourceLine ?? '0', 10);
    } else {
      break;
    }
  }

  if (candidate !== null) return candidate;
  // Fallback: nothing reaches the top yet (we're scrolled above the first
  // annotated block). Use the very first annotated line.
  return Number.parseInt(elements[0]!.dataset.sourceLine ?? '0', 10);
}

function scrollPreviewToLine(previewEl: HTMLElement, line: number): void {
  const elements =
    previewEl.querySelectorAll<HTMLElement>('[data-source-line]');
  if (elements.length === 0) return;

  let target: HTMLElement | null = null;
  for (const el of elements) {
    const elLine = Number.parseInt(el.dataset.sourceLine ?? '0', 10);
    if (elLine <= line) {
      target = el;
    } else {
      break;
    }
  }
  target ??= elements[0]!;

  const containerTop = previewEl.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top - containerTop;
  previewEl.scrollTop += targetTop;
}

export function useSplitScrollSync({
  enabled,
  editorHandleRef,
  previewRef,
}: UseSplitScrollSyncArgs) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let attached = false;
    let rafId = 0;
    let removeEditor: (() => void) | null = null;
    let removePreview: (() => void) | null = null;

    const clearListeners = () => {
      removeEditor?.();
      removeEditor = null;
      removePreview?.();
      removePreview = null;
    };

    const tryAttach = () => {
      if (cancelled || attached) return;

      const editorEl = editorHandleRef.current?.getScrollDOM() ?? null;
      const previewEl = previewRef.current;

      if (!editorEl || !previewEl) {
        rafId = requestAnimationFrame(tryAttach);
        return;
      }

      attached = true;

      let syncing = false;

      const onEditorScroll = () => {
        if (syncing) return;
        const line = editorHandleRef.current?.getTopVisibleLine();
        if (line == null) return;
        syncing = true;
        scrollPreviewToLine(previewEl, line);
        requestAnimationFrame(() => {
          syncing = false;
        });
      };

      const onPreviewScroll = () => {
        if (syncing) return;
        const line = previewTopLine(previewEl);
        if (line == null) return;
        syncing = true;
        editorHandleRef.current?.scrollToLineTop(line);
        requestAnimationFrame(() => {
          syncing = false;
        });
      };

      editorEl.addEventListener('scroll', onEditorScroll, { passive: true });
      previewEl.addEventListener('scroll', onPreviewScroll, { passive: true });

      removeEditor = () => {
        editorEl.removeEventListener('scroll', onEditorScroll);
      };
      removePreview = () => {
        previewEl.removeEventListener('scroll', onPreviewScroll);
      };
    };

    tryAttach();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearListeners();
    };
  }, [enabled, editorHandleRef, previewRef]);
}
