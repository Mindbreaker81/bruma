import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useUpdateChecker } from './useUpdateChecker';

type MockUpdate = {
  available: boolean;
  currentVersion: string;
  version: string;
  body: string;
  rawJson: Record<string, unknown>;
  downloadAndInstall: ReturnType<typeof vi.fn>;
};

function createUpdate(version = '1.6.1'): MockUpdate {
  return {
    available: true,
    currentVersion: '1.6.0',
    version,
    body: 'Release notes',
    rawJson: {},
    downloadAndInstall: vi.fn(),
  };
}

describe('useUpdateChecker', () => {
  it('returns available when the updater finds a new version', async () => {
    const update = createUpdate();
    const check = vi.fn().mockResolvedValue(update);
    const { result } = renderHook(() =>
      useUpdateChecker({
        check,
        isIgnored: vi.fn().mockResolvedValue(false),
        rememberLastCheck: vi.fn(),
      })
    );

    await expect(result.current.checkForUpdates()).resolves.toEqual({
      status: 'available',
      update: {
        currentVersion: '1.6.0',
        version: '1.6.1',
        body: 'Release notes',
        date: undefined,
      },
    });
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('returns up_to_date when the updater returns null', async () => {
    const { result } = renderHook(() =>
      useUpdateChecker({
        check: vi.fn().mockResolvedValue(null),
        rememberLastCheck: vi.fn(),
      })
    );

    await expect(result.current.checkForUpdates()).resolves.toEqual({
      status: 'up_to_date',
    });
  });

  it('suppresses ignored versions unless requested manually', async () => {
    const update = createUpdate('1.6.2');
    const { result } = renderHook(() =>
      useUpdateChecker({
        check: vi.fn().mockResolvedValue(update),
        isIgnored: vi.fn().mockResolvedValue(true),
        rememberLastCheck: vi.fn(),
      })
    );

    await expect(result.current.checkForUpdates()).resolves.toMatchObject({
      status: 'ignored',
      update: { version: '1.6.2' },
    });

    await expect(
      result.current.checkForUpdates({ includeIgnored: true })
    ).resolves.toMatchObject({
      status: 'available',
      update: { version: '1.6.2' },
    });
  });

  it('downloads, installs and relaunches through the pending update', async () => {
    const downloadAndInstall = vi.fn().mockImplementation(async (onEvent) => {
      onEvent({ event: 'Started', data: { contentLength: 100 } });
      onEvent({ event: 'Progress', data: { chunkLength: 25 } });
      onEvent({ event: 'Finished', data: undefined });
    });
    const update = { ...createUpdate(), downloadAndInstall };
    const relaunch = vi.fn();
    const { result } = renderHook(() =>
      useUpdateChecker({
        check: vi.fn().mockResolvedValue(update),
        isIgnored: vi.fn().mockResolvedValue(false),
        rememberLastCheck: vi.fn(),
        relaunch,
      })
    );

    await act(async () => {
      await result.current.checkForUpdates();
    });

    const onProgress = vi.fn();
    await act(async () => {
      await result.current.downloadAndInstall(onProgress);
      await result.current.relaunch();
    });

    expect(downloadAndInstall).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenLastCalledWith({
      downloaded: 100,
      total: 100,
      percent: 100,
    });
    expect(relaunch).toHaveBeenCalledTimes(1);
  });
});
