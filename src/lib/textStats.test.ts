import { describe, expect, it } from 'vitest';

import { countWords, getTextStats } from './textStats';

describe('textStats', () => {
  it('counts words in plain text', () => {
    expect(countWords('hola mundo')).toBe(2);
    expect(countWords('  one   two\tthree\nfour ')).toBe(4);
  });

  it('treats markdown punctuation as separators', () => {
    expect(countWords('# Título principal\n\n*Texto* con `código`.')).toBe(5);
  });

  it('handles unicode and accents', () => {
    expect(countWords('café niño año')).toBe(3);
    expect(countWords("don't worry — it's fine")).toBe(4);
  });

  it('returns zero for empty or whitespace text', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\t')).toBe(0);
  });

  it('reports characters with and without whitespace', () => {
    const stats = getTextStats('hola  mundo');
    expect(stats.characters).toBe(11);
    expect(stats.charactersNoSpaces).toBe(9);
    expect(stats.words).toBe(2);
  });

  it('counts Unicode whitespace and surrogate pairs without changing lengths', () => {
    const text = 'café\u00a0niño 😀';
    expect(getTextStats(text)).toEqual({
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, '').length,
      words: 2,
    });
  });
});
