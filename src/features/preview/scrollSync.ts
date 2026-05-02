import { create } from 'zustand';

export type ScrollSource = 'editor' | 'preview';

type ScrollSyncState = {
  enabled: boolean;
  ratio: number;
  source: ScrollSource | null;
  emit: (source: ScrollSource, ratio: number) => void;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
};

export function clampRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
}

export const useScrollSyncStore = create<ScrollSyncState>((set, get) => ({
  enabled: true,
  ratio: 0,
  source: null,
  emit: (source, ratio) => {
    if (!get().enabled) return;
    set({ source, ratio: clampRatio(ratio) });
  },
  setEnabled: (enabled) =>
    set((state) => ({
      enabled,
      ratio: enabled ? state.ratio : 0,
      source: enabled ? state.source : null,
    })),
  toggle: () => {
    const enabled = !get().enabled;
    set((state) => ({
      enabled,
      ratio: enabled ? state.ratio : 0,
      source: enabled ? state.source : null,
    }));
  },
}));
