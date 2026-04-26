import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import App from './App';
import { useFileStore } from './features/files/state';
import './i18n';

describe('App', () => {
  beforeEach(() => {
    useFileStore.getState().resetUntitled();
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
});
