import { X } from 'lucide-react';
import { type DragEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Tab } from './document';
import { getDocumentDisplayName, isDirty } from './document';

type TabBarProps = {
  tabs: Tab[];
  activeTabId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onMove: (id: string, toIndex: number) => void;
};

export function TabBar({
  tabs,
  activeTabId,
  onActivate,
  onClose,
  onMove,
}: TabBarProps) {
  const { t } = useTranslation();
  const dragOverIndex = useRef<number | null>(null);

  function handleDragStart(event: DragEvent<HTMLButtonElement>, id: string) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    dragOverIndex.current = index;
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, id: string) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    const toIndex = tabs.findIndex((tab) => tab.id === id);
    if (draggedId && toIndex >= 0) {
      onMove(draggedId, toIndex);
    }
    dragOverIndex.current = null;
  }

  if (tabs.length <= 1 && !tabs[0]?.document.path) {
    return null;
  }

  return (
    <div
      className="flex h-9 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-2 text-xs"
      role="tablist"
      aria-label={t('tabs.label')}
    >
      {tabs.map((tab) => {
        const dirty = isDirty(tab.document);
        const active = tab.id === activeTabId;
        const name = getDocumentDisplayName(tab.document);
        return (
          <div
            key={tab.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-1.5 transition ${
              active
                ? 'bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))]'
                : 'text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))]'
            }`}
            role="tab"
            aria-selected={active}
            draggable
            onDragOver={(event) => handleDragOver(event, tabs.indexOf(tab))}
            onDrop={(event) => handleDrop(event, tab.id)}
          >
            <button
              className="flex items-center gap-1.5"
              type="button"
              draggable
              onDragStart={(event) => handleDragStart(event, tab.id)}
              onClick={() => onActivate(tab.id)}
            >
              <span className="max-w-[12ch] truncate">{name}</span>
              {dirty ? (
                <span
                  className="inline-block size-1.5 rounded-full bg-amber-500"
                  aria-label={t('tabs.unsaved')}
                />
              ) : null}
            </button>
            {tabs.length > 1 ? (
              <button
                className="inline-flex size-4 items-center justify-center rounded text-[rgb(var(--color-muted))] transition hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))]"
                type="button"
                aria-label={t('tabs.close', { name })}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(tab.id);
                }}
              >
                <X className="size-3" aria-hidden />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
