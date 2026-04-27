export type FrontmatterParseResult = {
  frontmatter: string | null;
  body: string;
  fields: Record<string, string>;
};

const FENCE_PATTERN = /^---\r?\n([\s\S]*?\n)---\r?\n?/;

export function parseFrontmatter(source: string): FrontmatterParseResult {
  if (!source.startsWith('---')) {
    return { frontmatter: null, body: source, fields: {} };
  }

  const match = source.match(FENCE_PATTERN);
  if (!match) {
    return { frontmatter: null, body: source, fields: {} };
  }

  const block = match[1] ?? '';
  const consumed = match[0]?.length ?? 0;
  const body = source.slice(consumed);
  const fields = parseSimpleYaml(block);

  return { frontmatter: block.replace(/\n$/, ''), body, fields };
}

export function stripFrontmatter(source: string): string {
  return parseFrontmatter(source).body;
}

function parseSimpleYaml(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = input.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    if (!key) continue;
    let value = line.slice(colon + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}
