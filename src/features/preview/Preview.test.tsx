import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Preview } from './Preview';
import { useScrollSyncStore } from './scrollSync';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Preview', () => {
  afterEach(() => {
    useScrollSyncStore.setState({
      enabled: true,
      ratio: 0,
      source: null,
    });
  });

  it('subscribes to editor scroll events even when sync is disabled on mount', () => {
    useScrollSyncStore.getState().setEnabled(false);

    render(<Preview content="# Title" />);

    const preview = screen.getByRole('article', { name: 'preview.label' });
    Object.defineProperty(preview, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(preview, 'clientHeight', {
      configurable: true,
      value: 500,
    });

    act(() => {
      useScrollSyncStore.getState().setEnabled(true);
      useScrollSyncStore.getState().emit('editor', 0.4);
    });

    expect(preview.scrollTop).toBe(200);
  });

  it('does not emit preview scroll when sync is disabled', () => {
    useScrollSyncStore.getState().setEnabled(false);

    render(<Preview content={'# Title\n\nBody\n\n'.repeat(100)} />);

    const preview = screen.getByRole('article', { name: 'preview.label' });
    Object.defineProperty(preview, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(preview, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    preview.scrollTop = 250;

    fireEvent.scroll(preview);

    expect(useScrollSyncStore.getState()).toMatchObject({
      enabled: false,
      ratio: 0,
      source: null,
    });
  });
});
