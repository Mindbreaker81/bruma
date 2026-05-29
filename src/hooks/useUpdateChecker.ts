import { useCallback, useRef } from 'react';
import type { DownloadEvent, Update } from '@tauri-apps/plugin-updater';

import { isTauriRuntime } from '../lib/tauri';
import {
  isVersionIgnored,
  setIgnoredVersion,
  setLastCheckDate,
} from '../lib/updateStore';

export type UpdateInfo = {
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
};

export type UpdateProgress = {
  downloaded: number;
  total: number | null;
  percent: number | null;
};

type CheckOptions = {
  includeIgnored?: boolean;
};

type CheckResult =
  | { status: 'available'; update: UpdateInfo }
  | { status: 'ignored'; update: UpdateInfo }
  | { status: 'up_to_date' }
  | { status: 'unavailable' };

type Dependencies = {
  check?: () => Promise<Update | null>;
  relaunch?: () => Promise<void>;
  isIgnored?: (version: string) => Promise<boolean>;
  rememberIgnored?: (version: string) => Promise<void>;
  rememberLastCheck?: (date: string) => Promise<void>;
};

function toUpdateInfo(update: Update): UpdateInfo {
  return {
    currentVersion: update.currentVersion,
    version: update.version,
    date: update.date,
    body: update.body,
  };
}

async function loadUpdater(dependencies?: Dependencies) {
  if (dependencies?.check) {
    return dependencies.check;
  }

  if (!isTauriRuntime()) {
    return null;
  }

  const { check } = await import('@tauri-apps/plugin-updater');
  return check;
}

async function loadRelaunch(dependencies?: Dependencies) {
  if (dependencies?.relaunch) {
    return dependencies.relaunch;
  }

  if (!isTauriRuntime()) {
    return null;
  }

  const { relaunch } = await import('@tauri-apps/plugin-process');
  return relaunch;
}

export function useUpdateChecker(dependencies?: Dependencies) {
  const pendingUpdateRef = useRef<Update | null>(null);

  const checkForUpdates = useCallback(
    async (options: CheckOptions = {}): Promise<CheckResult> => {
      const check = await loadUpdater(dependencies);
      if (!check) {
        return { status: 'unavailable' };
      }

      await (dependencies?.rememberLastCheck ?? setLastCheckDate)(
        new Date().toISOString()
      );

      const update = await check();
      pendingUpdateRef.current = update;

      if (!update) {
        return { status: 'up_to_date' };
      }

      const updateInfo = toUpdateInfo(update);
      const ignored = await (dependencies?.isIgnored ?? isVersionIgnored)(
        updateInfo.version
      );

      if (ignored && !options.includeIgnored) {
        return { status: 'ignored', update: updateInfo };
      }

      return { status: 'available', update: updateInfo };
    },
    [dependencies]
  );

  const downloadAndInstall = useCallback(
    async (onProgress?: (progress: UpdateProgress) => void): Promise<void> => {
      const update = pendingUpdateRef.current;
      if (!update) {
        throw new Error('no_update_available');
      }

      let downloaded = 0;
      let total: number | null = null;

      await update.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === 'Started') {
          downloaded = 0;
          total = event.data.contentLength ?? null;
        }

        if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
        }

        if (event.event === 'Finished' && total !== null) {
          downloaded = total;
        }

        onProgress?.({
          downloaded,
          total,
          percent:
            total && total > 0
              ? Math.min(100, (downloaded / total) * 100)
              : null,
        });
      });
    },
    []
  );

  const relaunch = useCallback(async (): Promise<void> => {
    const relaunchApp = await loadRelaunch(dependencies);
    if (!relaunchApp) {
      return;
    }

    await relaunchApp();
  }, [dependencies]);

  const ignoreVersion = useCallback(
    async (version: string): Promise<void> => {
      await (dependencies?.rememberIgnored ?? setIgnoredVersion)(version);
    },
    [dependencies]
  );

  return {
    checkForUpdates,
    downloadAndInstall,
    relaunch,
    ignoreVersion,
  };
}
