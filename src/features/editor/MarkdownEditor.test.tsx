import { createRef } from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MarkdownEditor, type MarkdownEditorHandle } from './MarkdownEditor';

function renderEditor(value = '# Hola\nMundo') {
  const ref = createRef<MarkdownEditorHandle>();
  const { container } = render(
    <MarkdownEditor
      ref={ref}
      value={value}
      onChange={() => {}}
      ariaLabel="editor"
      placeholder="escribe..."
    />
  );
  return { ref, container };
}

function editorText(container: HTMLElement): string {
  return container.querySelector('.cm-content')?.textContent ?? '';
}

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

describe('MarkdownEditor handle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('selectAll selects the whole document', () => {
    const { ref } = renderEditor();

    expect(ref.current?.hasSelection()).toBe(false);
    ref.current?.selectAll();

    expect(ref.current?.hasSelection()).toBe(true);
    expect(ref.current?.getSelectedText()).toBe('# Hola\nMundo');
  });

  it('paste inserts text at the cursor', () => {
    const { ref, container } = renderEditor();

    ref.current?.paste('pega ');

    // CodeMirror renders each line as its own element: no literal '\n'.
    expect(editorText(container)).toBe('pega # HolaMundo');
  });

  it('undo and redo revert and reapply a paste', () => {
    const { ref, container } = renderEditor();

    ref.current?.paste('xyz');
    expect(editorText(container)).toContain('xyz');

    expect(ref.current?.undo()).toBe(true);
    expect(editorText(container)).not.toContain('xyz');

    expect(ref.current?.redo()).toBe(true);
    expect(editorText(container)).toContain('xyz');
  });

  it('cut and copy go through execCommand with the editor focused', () => {
    const { ref, container } = renderEditor();
    const execCommand = vi.fn().mockReturnValue(true);
    // jsdom does not implement execCommand; define it for this test.
    Object.defineProperty(window.document, 'execCommand', {
      value: execCommand,
      configurable: true,
      writable: true,
    });

    ref.current?.copy();
    expect(execCommand).toHaveBeenCalledWith('copy');
    ref.current?.cut();
    expect(execCommand).toHaveBeenCalledWith('cut');
    expect(container.querySelector('.cm-content')).toBe(
      window.document.activeElement
    );
  });
});
