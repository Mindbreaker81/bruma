import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import '../../i18n';
import { UpdateDialog } from './UpdateDialog';

const update = {
  currentVersion: '1.6.0',
  version: '1.6.1',
  body: 'Fixes and improvements',
};

describe('UpdateDialog', () => {
  it('renders update metadata and actions', async () => {
    const onInstall = vi.fn();
    const onIgnore = vi.fn();

    render(
      <UpdateDialog
        open
        status="available"
        update={update}
        progress={null}
        onOpenChange={vi.fn()}
        onInstall={onInstall}
        onRemindLater={vi.fn()}
        onIgnore={onIgnore}
      />
    );

    expect(screen.getByText('1.6.0')).toBeInTheDocument();
    expect(screen.getByText('1.6.1')).toBeInTheDocument();
    expect(screen.getByText('Fixes and improvements')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Update now|Actualizar ahora/i })
    );
    expect(onInstall).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByRole('button', {
        name: /Ignore this version|Ignorar esta versión/i,
      })
    );
    expect(onIgnore).toHaveBeenCalledTimes(1);
  });

  it('renders download progress', () => {
    render(
      <UpdateDialog
        open
        status="downloading"
        update={update}
        progress={{ downloaded: 50, total: 100, percent: 50 }}
        onOpenChange={vi.fn()}
        onInstall={vi.fn()}
        onRemindLater={vi.fn()}
        onIgnore={vi.fn()}
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Downloading update|Descargando actualización/i)
    ).toBeInTheDocument();
  });

  it('renders up-to-date state without install action', () => {
    render(
      <UpdateDialog
        open
        status="up_to_date"
        update={null}
        progress={null}
        onOpenChange={vi.fn()}
        onInstall={vi.fn()}
        onRemindLater={vi.fn()}
        onIgnore={vi.fn()}
      />
    );

    expect(screen.getByText(/up to date|actualizado/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Update now|Actualizar ahora/i })
    ).not.toBeInTheDocument();
  });
});
