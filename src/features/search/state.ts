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
  close: () => void;
  goNext: (matchCount: number) => void;
  goPrevious: (matchCount: number) => void;
  normalizeActiveIndex: (matchCount: number) => void;
  open: () => void;
  setCaseSensitive: (caseSensitive: boolean) => void;
  setQuery: (query: string) => void;
};

export const useSearchStore = create<SearchState>((set, get) => ({
  activeIndex: 0,
  caseSensitive: false,
  isOpen: false,
  query: '',
  close: () => set({ isOpen: false }),
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
}));
