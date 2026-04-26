export function isTauriRuntime(): boolean {
  return '__TAURI_INTERNALS__' in window;
}

export async function setAppWindowTitle(title: string): Promise<void> {
  if (!isTauriRuntime()) {
    document.title = title;
    return;
  }

  const { getCurrentWindow } = await import('@tauri-apps/api/window');

  await getCurrentWindow().setTitle(title);
}

export async function listenToMenuActions(
  handler: (action: string) => void
): Promise<() => void> {
  if (!isTauriRuntime()) {
    return () => undefined;
  }

  const { listen } = await import('@tauri-apps/api/event');

  return listen<string>('menu://action', (event) => {
    handler(event.payload);
  });
}

export async function listenToRecentOpen(
  handler: (path: string) => void
): Promise<() => void> {
  if (!isTauriRuntime()) {
    return () => undefined;
  }

  const { listen } = await import('@tauri-apps/api/event');

  return listen<string>('menu://recent-open', (event) => {
    handler(event.payload);
  });
}
