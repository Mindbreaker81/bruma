export const FONT_SCALE_MIN = 0.7;
export const FONT_SCALE_MAX = 1.8;
export const FONT_SCALE_STEP = 0.1;
export const FONT_SCALE_DEFAULT = 1;

export function clampFontScale(scale: number): number {
  if (!Number.isFinite(scale)) return FONT_SCALE_DEFAULT;
  const rounded = Math.round(scale * 100) / 100;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, rounded));
}

export function increaseFontScale(scale: number): number {
  return clampFontScale(scale + FONT_SCALE_STEP);
}

export function decreaseFontScale(scale: number): number {
  return clampFontScale(scale - FONT_SCALE_STEP);
}
