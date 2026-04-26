import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import App from './App';
import { useFileStore } from './features/files/state';
import { useThemeStore } from './features/settings/state';
import './i18n';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useFileStore.getState().resetUntitled();
    useThemeStore.getState().setLanguage('system');
  });

  it('renders the editable Bruma shell', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Bruma' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Markdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Guardado|Saved/i)).toBeInTheDocument();
  });

  it('marks the document as dirty when edited', async () => {
    render(<App />);

    act(() => {
      useFileStore.getState().updateContent('# Nota');
    });

    expect(screen.getAllByText(/Sin guardar|Unsaved/i).length).toBeGreaterThan(
      0
    );
  });

  it('cycles the visible language from the toolbar', async () => {
    render(<App />);

    await act(async () => {
      screen.getByRole('button', { name: /language|idioma/i }).click();
    });

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('es');
      expect(
        screen.getByRole('button', { name: /Cambiar idioma/i })
      ).toBeInTheDocument();
    });
  });
});
