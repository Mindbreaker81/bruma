export type TextStats = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
};

const UNICODE_WORD_CHARACTER = /[\p{L}\p{N}\u2019]/u;
const UNICODE_WHITESPACE = /\s/u;

function scanText(
  text: string
): Pick<TextStats, 'charactersNoSpaces' | 'words'> {
  let charactersNoSpaces = 0;
  let words = 0;
  let insideWord = false;

  for (let index = 0; index < text.length; ) {
    const code = text.charCodeAt(index);
    let width = 1;
    let isWhitespace: boolean;
    let isWordCharacter: boolean;

    if (code <= 0x7f) {
      isWhitespace = code === 0x20 || (code >= 0x09 && code <= 0x0d);
      isWordCharacter =
        (code >= 0x30 && code <= 0x39) ||
        (code >= 0x41 && code <= 0x5a) ||
        (code >= 0x61 && code <= 0x7a) ||
        code === 0x27 ||
        code === 0x2d ||
        code === 0x5f;
    } else {
      const codePoint = text.codePointAt(index)!;
      width = codePoint > 0xffff ? 2 : 1;
      const character = String.fromCodePoint(codePoint);
      isWhitespace = UNICODE_WHITESPACE.test(character);
      isWordCharacter = UNICODE_WORD_CHARACTER.test(character);
    }

    if (!isWhitespace) charactersNoSpaces += width;
    if (isWordCharacter && !insideWord) words += 1;
    insideWord = isWordCharacter;
    index += width;
  }

  return { charactersNoSpaces, words };
}

export function countWords(text: string): number {
  return scanText(text).words;
}

export function getTextStats(text: string): TextStats {
  const { charactersNoSpaces, words } = scanText(text);
  return {
    characters: text.length,
    charactersNoSpaces,
    words,
  };
}
