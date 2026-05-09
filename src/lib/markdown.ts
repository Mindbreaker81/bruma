import createDOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

const DOMPurify = createDOMPurify(window);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const markdown: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code, language): string {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }

    return escapeHtml(code);
  },
})
  .use(taskLists, {
    enabled: false,
    label: true,
    labelAfter: true,
  })
  .use((md) => {
    // Annotate every top-level opening block token with its source line, so
    // the preview can be scrolled in lockstep with the editor.
    const renderToken = md.renderer.renderToken.bind(md.renderer);
    md.renderer.renderToken = function (tokens, idx, options) {
      const token = tokens[idx];
      if (token && token.map && token.level === 0 && token.nesting !== -1) {
        token.attrSet('data-source-line', String(token.map[0]));
      }
      return renderToken(tokens, idx, options);
    };
  });

const ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'input',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
];

const ALLOWED_ATTR = [
  'alt',
  'aria-hidden',
  'checked',
  'class',
  'disabled',
  'href',
  'id',
  'src',
  'target',
  'title',
  'type',
];

let hooksInstalled = false;

function installPurifyHooksOnce() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Defense-in-depth: ensure javascript: URLs are never emitted, regardless of
    // DOM implementation used by tests.
    if (
      !node ||
      typeof (node as unknown as { getAttribute?: unknown }).getAttribute !==
        'function'
    ) {
      return;
    }

    const stripIfDangerous = (attr: 'href' | 'src') => {
      const value = (node as unknown as Element).getAttribute(attr);
      if (!value) return;
      if (/^\s*(?:javascript|vbscript):/i.test(value)) {
        (node as unknown as Element).removeAttribute(attr);
      }
    };

    stripIfDangerous('href');
    stripIfDangerous('src');
  });

  // Whitelist `data-source-line` so it survives sanitization without enabling
  // arbitrary data-* attributes from untrusted markdown.
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName === 'data-source-line') {
      data.allowedAttributes['data-source-line'] = true;
    }
  });
}

export function renderMarkdown(source: string): string {
  return markdown.render(source);
}

export function sanitizeMarkdownHtml(html: string): string {
  installPurifyHooksOnce();
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_ATTR,
    ALLOWED_TAGS,
    // Keep arbitrary data-* out of the DOM. The `uponSanitizeAttribute` hook
    // explicitly whitelists only `data-source-line`, which we need for the
    // editor↔preview scroll sync.
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style'],
  });

  // Defense-in-depth: strip dangerous javascript: / vbscript: URLs even if a given
  // DOM implementation doesn't apply DOMPurify URL checks consistently.
  return sanitized.replace(
    /\s(?:href|src)\s*=\s*(["'])\s*(?:javascript|vbscript):[\s\S]*?\1/gi,
    ''
  );
}

export function renderSafeMarkdown(source: string): string {
  return sanitizeMarkdownHtml(renderMarkdown(source));
}
