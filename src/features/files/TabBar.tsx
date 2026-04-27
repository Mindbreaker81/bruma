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
  const draggedTabId = useRef<string | null>(null);

  function handleDragStart(
    event: React.DragEvent<HTMLDivElement | HTMLButtonElement>,
    tabId: string
  ) {
    draggedTabId.current = tabId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
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
      className="flex h-9 shrink-0 items-center gap-0.5 overflow-x-auto border-b bg-card px-2 text-xs"
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
            role="presentation"
            className={`flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-1.5 transition ${
              active
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tabs.indexOf(tab))}
            onDrop={(e) => handleDrop(e, tab.id)}
          >
            <button
              className="flex items-center gap-1.5"
              type="button"
              draggable
              onDragStart={(event) => handleDragStart(event, tab.id)}
              onClick={() => onActivate(tab.id)}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
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
                className="inline-flex size-4 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                type="button"
                aria-label={t('tabs.close', { name })}
                title={t('tabs.close', { name })}
                onClick={(e) => {
                  e.stopPropagation();
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
