import { renderSafeMarkdown } from './markdown';

const EMBEDDED_STYLES = `
:root { color-scheme: light; }
body {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', sans-serif;
  margin: 0;
  padding: 2.5rem clamp(1rem, 5vw, 4rem);
  background: #fff;
  color: #18181b;
  line-height: 1.6;
  max-width: 48rem;
  margin-inline: auto;
}
h1, h2, h3, h4, h5, h6 { line-height: 1.2; margin: 1.4em 0 0.5em; }
h1 { font-size: 1.9rem; }
h2 { font-size: 1.45rem; border-bottom: 1px solid #e4e4e7; padding-bottom: 0.25rem; }
h3 { font-size: 1.2rem; }
p, ul, ol, blockquote, pre, table { margin: 0 0 1rem; }
ul, ol { padding-left: 1.5rem; }
a { color: #047857; text-underline-offset: 0.15em; }
blockquote { border-left: 3px solid #e4e4e7; padding-left: 1rem; color: #52525b; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
:not(pre) > code { background: #f4f4f5; border-radius: 4px; padding: 0.1rem 0.3rem; font-size: 0.9em; }
pre { background: #f4f4f5; border-radius: 8px; padding: 1rem; overflow: auto; border: 1px solid #e4e4e7; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #e4e4e7; padding: 0.45rem 0.6rem; }
th { background: #f4f4f5; font-weight: 600; }
img { max-width: 100%; height: auto; }
hr { border: 0; border-top: 1px solid #e4e4e7; margin: 1.5rem 0; }
@media print { body { padding: 1rem; } }
`;

export type ExportHtmlOptions = {
  title?: string;
  includeStyles?: boolean;
};

export function buildExportHtml(
  source: string,
  options: ExportHtmlOptions = {}
): string {
  const { title = 'Bruma export', includeStyles = true } = options;
  const body = renderSafeMarkdown(source);
  const safeTitle = escapeHtml(title);
  const head = includeStyles
    ? `<style>${EMBEDDED_STYLES}</style>`
    : '<style></style>';

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
${head}
</head>
<body>
${body}
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
