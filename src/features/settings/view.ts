export type ViewMode = 'editor' | 'preview' | 'split';

export function getNextViewMode(mode: ViewMode): ViewMode {
  if (mode === 'editor') {
    return 'split';
  }

  if (mode === 'split') {
    return 'preview';
  }

  return 'editor';
}
