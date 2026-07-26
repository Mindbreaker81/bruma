import { type DragEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Tab } from './document';
import { getDocumentDisplayName, isDirty } from './document';
import { X, FileText } from 'lucide-react';

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
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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
    setDragOverIndex(index);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, id: string) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    const toIndex = tabs.findIndex((tab) => tab.id === id);
    if (draggedId && toIndex >= 0) {
      onMove(draggedId, toIndex);
    }
    setDragOverIndex(null);
  }

  if (tabs.length <= 1 && !tabs[0]?.document.path) {
    return null;
  }

  return (
    <div
      className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/50 bg-white/70 px-3 text-xs backdrop-blur dark:border-white/10 dark:bg-zinc-950/70"
      role="tablist"
      aria-label={t('tabs.label')}
    >
      {tabs.map((tab) => {
        const dirty = isDirty(tab.document);
        const active = tab.id === activeTabId;
        const name =
          getDocumentDisplayName(tab.document) ?? t('document.untitled');
        return (
          <div
            key={tab.id}
            role="presentation"
            className={`group relative flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 transition ${
              active
                ? 'bg-background text-foreground shadow-sm ring-1 ring-emerald-950/5 dark:ring-white/10'
                : 'text-muted-foreground hover:bg-white hover:text-accent-foreground dark:hover:bg-white/5'
            } ${dragOverIndex === tabs.indexOf(tab) ? 'ring-1 ring-primary/40 bg-primary/5' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tabs.indexOf(tab))}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={(e) => handleDrop(e, tab.id)}
          >
            <button
              className="flex items-center gap-2"
              type="button"
              draggable
              onDragStart={(event) => handleDragStart(event, tab.id)}
              onClick={() => onActivate(tab.id)}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
            >
              <FileText className="size-3.5 opacity-70" aria-hidden />
              <span className="max-w-[12ch] truncate">{name}</span>
              {dirty ? (
                <span
                  className="inline-block size-1.5 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.16)]"
                  aria-label={t('tabs.unsaved')}
                />
              ) : null}
            </button>
            {tabs.length > 1 ? (
              <button
                className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground opacity-0 transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary group-hover:opacity-100"
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
