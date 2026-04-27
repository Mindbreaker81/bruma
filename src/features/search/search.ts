export type SearchMatch = {
  from: number;
  to: number;
};

export function findSearchMatches(
  content: string,
  query: string,
  caseSensitive: boolean
): SearchMatch[] {
  if (!query) {
    return [];
  }

  const haystack = caseSensitive ? content : content.toLocaleLowerCase();
  const needle = caseSensitive ? query : query.toLocaleLowerCase();
  const matches: SearchMatch[] = [];
  let index = haystack.indexOf(needle);

  while (index !== -1) {
    matches.push({ from: index, to: index + needle.length });
    index = haystack.indexOf(needle, index + Math.max(needle.length, 1));
  }

  return matches;
}

export function normalizeSearchIndex(
  index: number,
  matchCount: number
): number {
  if (matchCount <= 0) {
    return 0;
  }

  return ((index % matchCount) + matchCount) % matchCount;
}

export function getNextSearchIndex(index: number, matchCount: number): number {
  return normalizeSearchIndex(index + 1, matchCount);
}

export function getPreviousSearchIndex(
  index: number,
  matchCount: number
): number {
  return normalizeSearchIndex(index - 1, matchCount);
}

export type ReplaceResult = {
  content: string;
  cursor: number;
  replacements: number;
};

export function replaceMatchAt(
  content: string,
  matches: SearchMatch[],
  index: number,
  replacement: string
): ReplaceResult {
  if (matches.length === 0) {
    return { content, cursor: 0, replacements: 0 };
  }
  const safeIndex = normalizeSearchIndex(index, matches.length);
  const target = matches[safeIndex];
  if (!target) {
    return { content, cursor: 0, replacements: 0 };
  }
  const next =
    content.slice(0, target.from) + replacement + content.slice(target.to);
  return {
    content: next,
    cursor: target.from + replacement.length,
    replacements: 1,
  };
}

export function replaceAllMatches(
  content: string,
  matches: SearchMatch[],
  replacement: string
): ReplaceResult {
  if (matches.length === 0) {
    return { content, cursor: 0, replacements: 0 };
  }
  const ordered = [...matches].sort((a, b) => a.from - b.from);
  let result = '';
  let cursor = 0;
  for (const match of ordered) {
    result += content.slice(cursor, match.from) + replacement;
    cursor = match.to;
  }
  result += content.slice(cursor);
  return { content: result, cursor: 0, replacements: ordered.length };
}
