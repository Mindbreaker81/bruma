import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';
import './i18n';

describe('App', () => {
  it('renders the Bruma shell', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Bruma' })).toBeInTheDocument();
    expect(screen.getByText(/Markdown/i)).toBeInTheDocument();
  });
});
