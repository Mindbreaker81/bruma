export type TextStats = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
};

const WORD_PATTERN = /[\p{L}\p{N}_'\u2019-]+/gu;

export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.match(WORD_PATTERN);
  return matches ? matches.length : 0;
}

export function getTextStats(text: string): TextStats {
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s+/g, '').length,
    words: countWords(text),
  };
}
