import { type RefObject, useEffect } from 'react';

import type { MarkdownEditorHandle } from '../editor/MarkdownEditor';

type UseSplitScrollSyncArgs = {
  enabled: boolean;
  editorHandleRef: RefObject<MarkdownEditorHandle | null>;
  previewRef: RefObject<HTMLElement | null>;
};

type LineEntry = {
  line: number;
  top: number;
  el: HTMLElement;
};

/**
 * Snapshot of the line→element map for a preview pane. Built once per render
 * (invalidated by MutationObserver) so scroll handlers can binary-search
 * instead of walking the DOM and reading layout on every tick.
 */
type PreviewIndex = {
  /** Sorted by line ascending; `top` is offsetTop relative to `previewEl`. */
  entries: LineEntry[];
  /** True when the cached snapshot is out of date. */
  dirty: boolean;
};

function buildPreviewIndex(previewEl: HTMLElement): LineEntry[] {
  const nodes = previewEl.querySelectorAll<HTMLElement>('[data-source-line]');
  const entries: LineEntry[] = [];
  for (const el of nodes) {
    const line = Number.parseInt(el.dataset.sourceLine ?? '', 10);
    if (Number.isNaN(line)) continue;
    entries.push({ line, top: el.offsetTop, el });
  }
  // Source order in the DOM matches source-line order, but defensively sort.
  entries.sort((a, b) => a.line - b.line);
  return entries;
}

function ensureFreshIndex(
  previewEl: HTMLElement,
  index: PreviewIndex
): LineEntry[] {
  if (index.dirty || index.entries.length === 0) {
    index.entries = buildPreviewIndex(previewEl);
    index.dirty = false;
  }
  return index.entries;
}

/**
 * Returns the 0-based source line of the topmost visible block in `previewEl`,
 * or `null` if no annotated element is visible. Uses cached `offsetTop` values
 * and `previewEl.scrollTop` instead of `getBoundingClientRect`.
 */
function previewTopLine(
  previewEl: HTMLElement,
  index: PreviewIndex
): number | null {
  const entries = ensureFreshIndex(previewEl, index);
  if (entries.length === 0) return null;

  const scrollTop = previewEl.scrollTop;
  // Binary search for the last entry whose top is <= scrollTop.
  let lo = 0;
  let hi = entries.length - 1;
  let candidate = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (entries[mid]!.top <= scrollTop) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return entries[Math.max(candidate, 0)]!.line;
}

function scrollPreviewToLine(
  previewEl: HTMLElement,
  line: number,
  index: PreviewIndex
): void {
  const entries = ensureFreshIndex(previewEl, index);
  if (entries.length === 0) return;

  let lo = 0;
  let hi = entries.length - 1;
  let candidate = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (entries[mid]!.line <= line) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  previewEl.scrollTop = entries[candidate]!.top;
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
    let observer: MutationObserver | null = null;

    const clearListeners = () => {
      removeEditor?.();
      removeEditor = null;
      removePreview?.();
      removePreview = null;
      observer?.disconnect();
      observer = null;
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
      const index: PreviewIndex = { entries: [], dirty: true };

      // Rebuild the line→element index whenever the preview DOM changes.
      observer = new MutationObserver(() => {
        index.dirty = true;
      });
      observer.observe(previewEl, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      const onEditorScroll = () => {
        if (syncing) return;
        const line = editorHandleRef.current?.getTopVisibleLine();
        if (line == null) return;
        syncing = true;
        scrollPreviewToLine(previewEl, line, index);
        requestAnimationFrame(() => {
          syncing = false;
        });
      };

      const onPreviewScroll = () => {
        if (syncing) return;
        const line = previewTopLine(previewEl, index);
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
