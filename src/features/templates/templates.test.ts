import { describe, expect, it } from 'vitest';
import { applyTemplate, getTemplateById } from './templates';

describe('applyTemplate', () => {
  it('replaces {{date}} with ISO date', () => {
    const now = new Date('2024-06-15T10:00:00Z');
    const result = applyTemplate(
      { id: 't', name: 'Test', content: 'Date: {{date}}' },
      { now }
    );
    expect(result).toBe('Date: 2024-06-15');
  });

  it('replaces {{title}} with provided title', () => {
    const result = applyTemplate(
      { id: 't', name: 'Test', content: '# {{title}}' },
      { title: 'Hello' }
    );
    expect(result).toBe('# Hello');
  });

  it('replaces multiple occurrences', () => {
    const result = applyTemplate(
      { id: 't', name: 'Test', content: '{{title}} and {{title}}' },
      { title: 'X' }
    );
    expect(result).toBe('X and X');
  });

  it('uses current date by default', () => {
    const result = applyTemplate({
      id: 't',
      name: 'Test',
      content: '{{date}}',
    });
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getTemplateById', () => {
  it('returns built-in templates', () => {
    expect(getTemplateById('empty')).toBeDefined();
    expect(getTemplateById('blog-post')).toBeDefined();
    expect(getTemplateById('meeting')).toBeDefined();
    expect(getTemplateById('readme')).toBeDefined();
  });

  it('returns undefined for unknown id', () => {
    expect(getTemplateById('unknown')).toBeUndefined();
  });
});
