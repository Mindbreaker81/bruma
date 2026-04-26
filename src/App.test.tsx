import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(
      screen.getByRole('textbox', { name: /Markdown/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Guardado|Saved/i)).toBeInTheDocument();
  });

  it('marks the document as dirty when edited', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(
      screen.getByRole('textbox', { name: /Markdown/i }),
      '# Nota'
    );

    expect(screen.getAllByText(/Sin guardar|Unsaved/i).length).toBeGreaterThan(
      0
    );
  });
});
