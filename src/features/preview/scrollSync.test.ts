import { afterEach, describe, expect, it } from 'vitest';

import { clampRatio, useScrollSyncStore } from './scrollSync';

describe('scrollSync', () => {
  afterEach(() => {
    useScrollSyncStore.setState({
      enabled: true,
      ratio: 0,
      source: null,
    });
  });

  it('clamps ratios into 0..1', () => {
    expect(clampRatio(-0.3)).toBe(0);
    expect(clampRatio(1.4)).toBe(1);
    expect(clampRatio(Number.NaN)).toBe(0);
    expect(clampRatio(0.42)).toBeCloseTo(0.42);
  });

  it('records the last source when emit is called and sync is enabled', () => {
    useScrollSyncStore.getState().emit('editor', 0.5);
    expect(useScrollSyncStore.getState()).toMatchObject({
      ratio: 0.5,
      source: 'editor',
    });
  });

  it('does not record when sync is disabled', () => {
    useScrollSyncStore.getState().setEnabled(false);
    useScrollSyncStore.getState().emit('preview', 0.7);
    expect(useScrollSyncStore.getState().ratio).toBe(0);
    expect(useScrollSyncStore.getState().source).toBeNull();
  });

  it('clears the last scroll event when sync is disabled', () => {
    useScrollSyncStore.getState().emit('editor', 0.6);
    useScrollSyncStore.getState().setEnabled(false);
    expect(useScrollSyncStore.getState()).toMatchObject({
      enabled: false,
      ratio: 0,
      source: null,
    });
  });

  it('toggles enabled', () => {
    useScrollSyncStore.getState().toggle();
    expect(useScrollSyncStore.getState().enabled).toBe(false);
    useScrollSyncStore.getState().toggle();
    expect(useScrollSyncStore.getState().enabled).toBe(true);
  });
});
