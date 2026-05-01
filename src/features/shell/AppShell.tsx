import type { DragEvent, ReactNode } from 'react';

type AppShellProps = {
  dataFocus: boolean;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  children: ReactNode;
};

export function AppShell({
  dataFocus,
  onDragOver,
  onDrop,
  children,
}: AppShellProps) {
  return (
    <div
      className="bruma-shell relative flex min-h-[100dvh] min-h-0 flex-col overflow-hidden bg-background text-foreground antialiased"
      data-focus={dataFocus ? 'on' : 'off'}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_65%)]" />
        <div className="absolute right-[-6rem] top-24 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute left-[-4rem] top-40 h-48 w-48 rounded-full bg-stone-200/40 blur-3xl dark:bg-stone-400/10" />
      </div>
      {children}
    </div>
  );
}
