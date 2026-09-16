import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import '../../i18n';
import { PreferencesDialog } from './PreferencesDialog';

function renderDialog() {
  return render(
    <PreferencesDialog
      open
      onClose={vi.fn()}
      autosaveEnabled
      autosaveDelayMs={2000}
      editorFontFamily="mono"
      editorTabSize={2}
      editorShowGutter
      editorWrap
      previewMaxWidth={80}
      previewShowToc
      onAutosaveEnabledChange={vi.fn()}
      onAutosaveDelayMsChange={vi.fn()}
      onEditorFontFamilyChange={vi.fn()}
      onEditorTabSizeChange={vi.fn()}
      onEditorShowGutterChange={vi.fn()}
      onEditorWrapChange={vi.fn()}
      onPreviewMaxWidthChange={vi.fn()}
      onPreviewShowTocChange={vi.fn()}
    />
  );
}

describe('PreferencesDialog', () => {
  it('renderiza las etiquetas traducidas (sin claves i18n crudas)', () => {
    const { container } = renderDialog();

    expect(
      screen.getByText(/Retraso autoguardado|Autosave delay/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Tipografía|Font family/)).toBeInTheDocument();
    expect(screen.getByText(/Ajustar líneas|Wrap lines/)).toBeInTheDocument();

    expect(container.textContent).not.toMatch(/[a-z]+\.[a-zA-Z]+/);
  });
});
