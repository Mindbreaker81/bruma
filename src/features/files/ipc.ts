import { invoke } from '@tauri-apps/api/core';

import { isTauriRuntime } from '../../lib/tauri';
import type { DocumentEol } from './document';

export type OpenedFile = {
  path: string;
  content: string;
  eol: DocumentEol;
};

export type SavedFile = {
  path: string;
  savedAt: number;
};

export async function openFileDialog(): Promise<OpenedFile | null> {
  if (!isTauriRuntime()) {
    throw new Error('fileDialogUnavailable');
  }

  return invoke<OpenedFile | null>('open_file_dialog');
}

export async function readFile(path: string): Promise<OpenedFile> {
  if (!isTauriRuntime()) {
    throw new Error('fileReadUnavailable');
  }

  return invoke<OpenedFile>('read_file', { path });
}

export async function saveFile(args: {
  path: string;
  content: string;
  eol: DocumentEol;
}): Promise<SavedFile> {
  if (!isTauriRuntime()) {
    throw new Error('fileSaveUnavailable');
  }

  return invoke<SavedFile>('save_file', args);
}

export async function saveFileDialog(args: {
  content: string;
  eol: DocumentEol;
  suggested?: string;
}): Promise<SavedFile | null> {
  if (!isTauriRuntime()) {
    throw new Error('fileDialogUnavailable');
  }

  return invoke<SavedFile | null>('save_file_dialog', args);
}

export async function readImageAsDataUrl(
  base: string,
  relative: string
): Promise<string | null> {
  if (!isTauriRuntime()) return null;
  try {
    return await invoke<string>('read_image_as_data_url', { base, relative });
  } catch {
    return null;
  }
}

export async function saveBinaryExportDialog(args: {
  content: string;
  suggested?: string;
  extension: string;
  label?: string;
}): Promise<SavedFile | null> {
  if (!isTauriRuntime()) {
    throw new Error('fileDialogUnavailable');
  }
  return invoke<SavedFile | null>('save_binary_export_dialog', args);
}

export async function saveExportDialog(args: {
  content: string;
  suggested?: string;
  extension: string;
  label?: string;
}): Promise<SavedFile | null> {
  if (!isTauriRuntime()) {
    throw new Error('fileDialogUnavailable');
  }
  return invoke<SavedFile | null>('save_export_dialog', args);
}

export async function syncRecentFilesMenu(paths: string[]): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke('sync_recent_files_menu', { paths });
}
