import { type RefObject, useEffect } from 'react';

import type { MarkdownEditorHandle } from '../editor/MarkdownEditor';

function scrollRatio(el: HTMLElement): number {
  const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
  return el.scrollTop / maxScroll;
}

function applyScrollRatio(target: HTMLElement, ratio: number) {
  const maxScroll = Math.max(1, target.scrollHeight - target.clientHeight);
  target.scrollTop = ratio * maxScroll;
}

type UseSplitScrollSyncArgs = {
  enabled: boolean;
  editorHandleRef: RefObject<MarkdownEditorHandle | null>;
  previewRef: RefObject<HTMLElement | null>;
};

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
        syncing = true;
        applyScrollRatio(previewEl, scrollRatio(editorEl));
        requestAnimationFrame(() => {
          syncing = false;
        });
      };

      const onPreviewScroll = () => {
        if (syncing) return;
        syncing = true;
        applyScrollRatio(editorEl, scrollRatio(previewEl));
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
