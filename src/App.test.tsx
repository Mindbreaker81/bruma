import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.getAllByText(/Guardado|Saved/i).length).toBeGreaterThan(0);
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

  it('renders recent files with basename, full path tooltip and full path label', async () => {
    const path = '/Users/eva/proyectos/bruma/notas/ideas.md';
    const basename = 'ideas.md';

    act(() => {
      useFileStore.setState({ recentFiles: [path] });
    });

    render(<App />);

    await userEvent.click(
      screen.getByRole('button', { name: /Recent files|Abrir recientes/i })
    );

    const recentItem = screen.getByRole('menuitem', {
      name: `${basename}${path}`,
    });

    expect(screen.getByText('ideas.md')).toBeInTheDocument();
    expect(screen.getByText(path)).toBeInTheDocument();
    expect(recentItem).toHaveAttribute('title', path);
  });
});
