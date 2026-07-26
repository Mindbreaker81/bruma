import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UpdateDialogStatus } from '../features/settings/UpdateDialog';
import {
  useUpdateChecker,
  type UpdateInfo,
  type UpdateProgress,
} from './useUpdateChecker';

export function useUpdateFlow() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [status, setStatus] = useState<UpdateDialogStatus>('checking');
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { checkForUpdates, downloadAndInstall, ignoreVersion, relaunch } =
    useUpdateChecker();

  const check = useCallback(
    async (manual = true) => {
      setStatus('checking');
      setError(null);
      setProgress(null);
      if (manual) setIsOpen(true);

      try {
        const result = await checkForUpdates({ includeIgnored: manual });
        if (result.status === 'available') {
          setUpdate(result.update);
          setStatus('available');
          setIsOpen(true);
        } else if (result.status === 'ignored') {
          if (manual) {
            setUpdate(result.update);
            setStatus('available');
            setIsOpen(true);
          }
        } else {
          setUpdate(null);
          setStatus('up_to_date');
          if (manual) setIsOpen(true);
        }
      } catch (cause) {
        console.error('Update check failed:', cause);
        setStatus('error');
        setError(cause instanceof Error ? cause.message : t('updates.error'));
        if (manual) setIsOpen(true);
      }
    },
    [checkForUpdates, t]
  );

  const install = useCallback(() => {
    setStatus('downloading');
    setError(null);
    void downloadAndInstall(setProgress)
      .then(async () => {
        setStatus('installing');
        await relaunch();
      })
      .catch((cause) => {
        console.error('Update install failed:', cause);
        setStatus('error');
        setError(cause instanceof Error ? cause.message : t('updates.error'));
      });
  }, [downloadAndInstall, relaunch, t]);

  const ignore = useCallback(() => {
    if (update) void ignoreVersion(update.version);
    setIsOpen(false);
  }, [ignoreVersion, update]);

  const hasUpdateAvailable =
    Boolean(update) &&
    (status === 'available' ||
      status === 'downloading' ||
      status === 'installing');

  return {
    check,
    error,
    hasUpdateAvailable,
    ignore,
    install,
    isOpen,
    progress,
    setIsOpen,
    status,
    update,
  };
}
