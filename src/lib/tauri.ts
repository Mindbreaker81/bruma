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

export async function printCurrentWindow(): Promise<void> {
  if (!isTauriRuntime()) {
    window.print();
    return;
  }

  const { invoke } = await import('@tauri-apps/api/core');

  await invoke('print_current_window');
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

export async function setUpdateAvailableMenuState(
  available: boolean
): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  const { invoke } = await import('@tauri-apps/api/core');

  await invoke('set_update_available_menu_state', { available });
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

type FileDropPayload =
  | {
      type: 'drop';
      paths: string[];
    }
  | {
      type: 'over';
      position: {
        x: number;
        y: number;
      };
    }
  | {
      type: 'cancel';
    };

export async function listenToFileDrop(
  handler: (paths: string[]) => void
): Promise<() => void> {
  if (!isTauriRuntime()) {
    return () => undefined;
  }

  const { getCurrentWindow } = await import('@tauri-apps/api/window');

  return getCurrentWindow().onDragDropEvent((event) => {
    const payload = event.payload as FileDropPayload;

    if (payload.type === 'drop') {
      handler(payload.paths);
    }
  });
}
