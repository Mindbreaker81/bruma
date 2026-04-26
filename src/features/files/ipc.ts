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
