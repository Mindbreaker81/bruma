export type TocEntry = {
  level: number;
  text: string;
  line: number;
  slug: string;
};

const ATX_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function parseHeadings(source: string): TocEntry[] {
  const lines = source.split(/\r?\n/);
  const entries: TocEntry[] = [];
  const seen = new Map<string, number>();
  let inFence = false;
  let fenceMarker = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const fenceMatch = line.match(/^(\s{0,3})(```|~~~)/);
    if (fenceMatch && fenceMatch[2]) {
      const marker = fenceMatch[2];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = '';
      }
      continue;
    }
    if (inFence) continue;

    const match = line.match(ATX_PATTERN);
    if (!match || !match[1] || match[2] === undefined) continue;
    const level = match[1].length;
    const text = match[2].trim();
    if (!text) continue;
    const baseSlug = slugify(text) || `heading-${i + 1}`;
    const count = seen.get(baseSlug) ?? 0;
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;
    seen.set(baseSlug, count + 1);
    entries.push({ level, text, line: i, slug });
  }

  return entries;
}
