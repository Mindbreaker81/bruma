import { create } from 'zustand';

import {
  getNextSearchIndex,
  getPreviousSearchIndex,
  normalizeSearchIndex,
} from './search';

type SearchState = {
  activeIndex: number;
  caseSensitive: boolean;
  isOpen: boolean;
  query: string;
  replaceQuery: string;
  replaceMode: boolean;
  close: () => void;
  goNext: (matchCount: number) => void;
  goPrevious: (matchCount: number) => void;
  normalizeActiveIndex: (matchCount: number) => void;
  open: () => void;
  setCaseSensitive: (caseSensitive: boolean) => void;
  setQuery: (query: string) => void;
  setReplaceQuery: (query: string) => void;
  setReplaceMode: (replaceMode: boolean) => void;
  toggleReplaceMode: () => void;
};

export const useSearchStore = create<SearchState>((set, get) => ({
  activeIndex: 0,
  caseSensitive: false,
  isOpen: false,
  query: '',
  replaceQuery: '',
  replaceMode: false,
  close: () => set({ isOpen: false, replaceMode: false }),
  goNext: (matchCount) =>
    set((state) => ({
      activeIndex: getNextSearchIndex(state.activeIndex, matchCount),
    })),
  goPrevious: (matchCount) =>
    set((state) => ({
      activeIndex: getPreviousSearchIndex(state.activeIndex, matchCount),
    })),
  normalizeActiveIndex: (matchCount) =>
    set((state) => ({
      activeIndex: normalizeSearchIndex(state.activeIndex, matchCount),
    })),
  open: () => set({ isOpen: true }),
  setCaseSensitive: (caseSensitive) =>
    set((state) => ({
      activeIndex: 0,
      caseSensitive,
      isOpen: state.isOpen,
    })),
  setQuery: (query) => {
    const current = get();

    set({
      activeIndex: current.query === query ? current.activeIndex : 0,
      isOpen: true,
      query,
    });
  },
  setReplaceQuery: (replaceQuery) => set({ replaceQuery }),
  setReplaceMode: (replaceMode) => set({ replaceMode }),
  toggleReplaceMode: () =>
    set((state) => ({
      replaceMode: !state.replaceMode,
      isOpen: state.isOpen || !state.replaceMode,
    })),
}));
