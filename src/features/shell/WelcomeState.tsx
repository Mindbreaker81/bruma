import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { COMMAND_REGISTRY } from '../../lib/shortcuts';
import {
  SplitSquareVertical,
  Search,
  FilePlus2,
  FileInput,
  Command,
  Clock3,
  ArrowRight,
} from 'lucide-react';

type WelcomeStateProps = {
  recentFiles: string[];
  onDismiss: () => void;
  onNewDocument: () => void;
  onOpenDocument: () => void;
  onOpenRecent: (path: string) => void;
};

function Kbd({ value }: { value: string | null }) {
  if (!value) return null;
  const parts = value.replace('Mod', '⌘').split('+');
  return (
    <span className="ml-1 inline-flex items-center gap-1">
      {parts.map((p) => (
        <kbd
          key={p}
          className="rounded border border-emerald-950/10 bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground shadow-sm dark:border-white/10 dark:bg-white/10"
        >
          {p}
        </kbd>
      ))}
    </span>
  );
}

function getPathBasename(path: string): string {
  const segments = path.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] ?? path;
}

export function WelcomeState({
  recentFiles,
  onDismiss,
  onNewDocument,
  onOpenDocument,
  onOpenRecent,
}: WelcomeStateProps) {
  const { t } = useTranslation();
  const visibleRecentFiles = recentFiles.slice(0, 3);
  const shortcuts = {
    newDocument: COMMAND_REGISTRY.newDocument.defaultShortcut,
    toggleSearch: COMMAND_REGISTRY.toggleSearch.defaultShortcut,
    toggleViewMode: COMMAND_REGISTRY.toggleViewMode.defaultShortcut,
  };

  return (
    <div className="absolute inset-0 z-overlay overflow-auto bg-background/90 p-5 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="mx-auto flex min-h-full w-full max-w-5xl items-center">
        <section className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,24rem)]">
          <div className="rounded-[2rem] border border-white/50 bg-white/80 p-8 shadow-[0_30px_80px_rgba(16,24,40,0.08)] ring-1 ring-emerald-950/5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 dark:ring-white/10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
              {t('welcome.eyebrow')}
            </p>
            <h2 className="max-w-2xl text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
              {t('welcome.title')}
            </h2>
            <p className="mt-4 max-w-[42rem] text-pretty text-base leading-7 text-muted-foreground md:text-lg">
              {t('welcome.body')}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                className="h-11 rounded-full px-5 shadow-[0_18px_40px_rgba(4,120,87,0.18)]"
                onClick={onDismiss}
              >
                <FilePlus2 className="size-4" aria-hidden />
                {t('welcome.startWriting')}
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-full border-emerald-950/10 bg-white/70 px-5 dark:border-white/10 dark:bg-white/5"
                onClick={onOpenDocument}
              >
                <FileInput className="size-4" aria-hidden />
                {t('welcome.openDocument')}
              </Button>
              <Button
                variant="ghost"
                className="h-11 rounded-full px-4 text-muted-foreground"
                onClick={onNewDocument}
              >
                {t('actions.newDocument')}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-emerald-950/10 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 inline-flex rounded-full bg-white p-2 text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-300">
                  <Command className="size-4" aria-hidden />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t('welcome.shortcutsTitle')}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t('welcome.shortcutsBody')}
                  <Kbd value={shortcuts.newDocument} />
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-950/10 bg-stone-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 inline-flex rounded-full bg-white p-2 text-foreground shadow-sm dark:bg-white/10">
                  <Search className="size-4" aria-hidden />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t('welcome.searchTitle')}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t('welcome.searchBody')}
                  <Kbd value={shortcuts.toggleSearch} />
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-950/10 bg-zinc-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 inline-flex rounded-full bg-white p-2 text-foreground shadow-sm dark:bg-white/10">
                  <SplitSquareVertical className="size-4" aria-hidden />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t('welcome.previewTitle')}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t('welcome.previewBody')}
                  <Kbd value={shortcuts.toggleViewMode} />
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/50 bg-white/70 p-6 shadow-[0_24px_60px_rgba(16,24,40,0.08)] ring-1 ring-emerald-950/5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 dark:ring-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {t('welcome.recentLabel')}
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-foreground">
                  {t('recent.open')}
                </h3>
              </div>
              <div className="rounded-full bg-emerald-100/80 p-2 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Clock3 className="size-4" aria-hidden />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {visibleRecentFiles.length > 0 ? (
                visibleRecentFiles.map((path) => (
                  <button
                    key={path}
                    type="button"
                    className="group flex w-full items-center justify-between rounded-2xl border border-transparent bg-stone-100/75 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-900/10 hover:bg-white dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                    onClick={() => onOpenRecent(path)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {getPathBasename(path)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {path}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-950/10 bg-stone-100/60 px-4 py-5 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/5">
                  {t('welcome.noRecent')}
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
