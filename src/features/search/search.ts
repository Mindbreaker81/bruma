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
