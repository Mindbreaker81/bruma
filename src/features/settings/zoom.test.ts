import { describe, expect, it } from 'vitest';

import {
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  clampFontScale,
  decreaseFontScale,
  increaseFontScale,
} from './zoom';

describe('zoom', () => {
  it('clamps below min and above max', () => {
    expect(clampFontScale(0.1)).toBe(FONT_SCALE_MIN);
    expect(clampFontScale(5)).toBe(FONT_SCALE_MAX);
  });

  it('falls back to default when value is not finite', () => {
    expect(clampFontScale(Number.NaN)).toBe(FONT_SCALE_DEFAULT);
    expect(clampFontScale(Number.POSITIVE_INFINITY)).toBe(FONT_SCALE_DEFAULT);
  });

  it('increases and decreases by one step', () => {
    expect(increaseFontScale(1)).toBeCloseTo(1.1, 5);
    expect(decreaseFontScale(1)).toBeCloseTo(0.9, 5);
  });

  it('does not exceed bounds when stepping repeatedly', () => {
    let scale = FONT_SCALE_DEFAULT;
    for (let i = 0; i < 50; i += 1) scale = increaseFontScale(scale);
    expect(scale).toBe(FONT_SCALE_MAX);
    for (let i = 0; i < 50; i += 1) scale = decreaseFontScale(scale);
    expect(scale).toBe(FONT_SCALE_MIN);
  });
});
