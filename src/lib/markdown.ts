import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

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
}).use(taskLists, {
  enabled: false,
  label: true,
  labelAfter: true,
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

export function renderMarkdown(source: string): string {
  return markdown.render(source);
}

export function sanitizeMarkdownHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_ATTR,
    ALLOWED_TAGS,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style'],
  });
}

export function renderSafeMarkdown(source: string): string {
  return sanitizeMarkdownHtml(renderMarkdown(source));
}
