import { invoke } from '@tauri-apps/api/core';

import { readFile, saveFile } from '../features/files/ipc';
import type { DocumentEol } from '../features/files/document';
import { useFileStore } from '../features/files/state';

type BrumaE2EApi = {
  openFileFromPath: (path: string) => Promise<void>;
  setActiveContent: (content: string) => void;
  getActiveContent: () => string;
  saveActiveToPath: (path: string) => Promise<void>;
  getRecentFiles: () => string[];
  emitRecentOpen: (path: string) => Promise<void>;
};

declare global {
  interface Window {
    brumaE2E?: BrumaE2EApi;
  }
}

export function installE2EBridge(): void {
  // Only attach in development builds or explicit E2E mode.
  // This keeps the surface minimal in release bundles.
  const e2eEnabled =
    import.meta.env.DEV ||
    import.meta.env.VITE_E2E === '1' ||
    import.meta.env.VITE_E2E === 'true';
  if (!e2eEnabled) return;
  if (window.brumaE2E) return;

  window.brumaE2E = {
    async openFileFromPath(path) {
      const opened = await readFile(path);
      useFileStore.getState().openTab(opened);
    },
    setActiveContent(content) {
      useFileStore.getState().updateContent(content);
    },
    getActiveContent() {
      return useFileStore.getState().document.content;
    },
    async saveActiveToPath(path) {
      const state = useFileStore.getState();
      const content = state.document.content;
      const eol = state.document.eol as DocumentEol;
      const result = await saveFile({ path, content, eol });
      state.markSaved(result.savedAt, result.path);
    },
    getRecentFiles() {
      return useFileStore.getState().recentFiles;
    },
    async emitRecentOpen(path) {
      // This is implemented on the Rust side and emits the same event the native menu uses.
      await invoke('e2e_emit_recent_open', { path });
    },
  };
}
