import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownEditor } from './MarkdownEditor';

describe('MarkdownEditor gutter', () => {
  it('renders line numbers when showGutter is true', () => {
    const { container } = render(
      <MarkdownEditor
        value="# Hola\nMundo"
        onChange={() => {}}
        ariaLabel="editor"
        placeholder="escribe..."
        showGutter
      />
    );

    expect(container.querySelector('.cm-lineNumbers')).not.toBeNull();
  });

  it('does not render line numbers when showGutter is false', () => {
    const { container } = render(
      <MarkdownEditor
        value="# Hola\nMundo"
        onChange={() => {}}
        ariaLabel="editor"
        placeholder="escribe..."
        showGutter={false}
      />
    );

    expect(container.querySelector('.cm-lineNumbers')).toBeNull();
  });
});
