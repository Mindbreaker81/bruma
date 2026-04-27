import { invoke } from '@tauri-apps/api/core';

export type Template = {
  id: string;
  name: string;
  content: string;
  locale?: 'es' | 'en';
  isCustom?: boolean;
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

export async function listCustomTemplates(): Promise<Template[]> {
  try {
    const customTemplates = await invoke<{ id: string; name: string }[]>(
      'list_custom_templates'
    );
    return customTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      content: '', // Will be loaded on demand
      isCustom: true,
    }));
  } catch (error) {
    console.error('Failed to list custom templates:', error);
    return [];
  }
}

export async function loadCustomTemplate(id: string): Promise<string> {
  try {
    return await invoke<string>('read_custom_template', { id });
  } catch (error) {
    console.error('Failed to load custom template:', error);
    throw error;
  }
}

export async function getAllTemplates(): Promise<Template[]> {
  const customTemplates = await listCustomTemplates();
  return [...BUILTIN_TEMPLATES, ...customTemplates];
}

export function getTemplateById(id: string): Template | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.id === id);
}
