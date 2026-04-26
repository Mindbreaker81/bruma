export type Template = {
  id: string;
  name: string;
  content: string;
  locale?: 'es' | 'en';
};

export function applyTemplate(
  template: Template,
  options: { now?: Date; title?: string } = {}
): string {
  const now = options.now ?? new Date();
  const dateStr = now.toISOString().split('T')[0] ?? '';
  const title = options.title ?? '';
  return template.content
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{title\}\}/g, title);
}

export const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'empty',
    name: 'template.empty',
    content: '',
  },
  {
    id: 'blog-post',
    name: 'template.blogPost',
    locale: 'en',
    content: `---
title: "{{title}}"
date: {{date}}
---

# {{title}}

Start writing your blog post here.
`,
  },
  {
    id: 'meeting',
    name: 'template.meeting',
    locale: 'en',
    content: `# Meeting {{date}}

## Attendees
- 

## Agenda
1. 

## Agreements
- 
`,
  },
  {
    id: 'readme',
    name: 'template.readme',
    locale: 'en',
    content: `# {{title}}

## Description

Brief description of the project.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`
`,
  },
];

export function getTemplateById(id: string): Template | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.id === id);
}
