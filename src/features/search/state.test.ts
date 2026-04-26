import { beforeEach, describe, expect, it } from 'vitest';

import { useSearchStore } from './state';

describe('search store', () => {
  beforeEach(() => {
    useSearchStore.setState({
      activeIndex: 0,
      caseSensitive: false,
      isOpen: false,
      query: '',
    });
  });

  it('opens, updates query and navigates matches', () => {
    useSearchStore.getState().open();
    useSearchStore.getState().setQuery('bruma');
    useSearchStore.getState().goNext(3);
    useSearchStore.getState().goPrevious(3);

    expect(useSearchStore.getState()).toMatchObject({
      activeIndex: 0,
      isOpen: true,
      query: 'bruma',
    });
  });

  it('resets active index when toggling case sensitivity', () => {
    useSearchStore.setState({ activeIndex: 2, query: 'bruma' });

    useSearchStore.getState().setCaseSensitive(true);

    expect(useSearchStore.getState().activeIndex).toBe(0);
    expect(useSearchStore.getState().caseSensitive).toBe(true);
  });
});
