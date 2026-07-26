import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type AutosaveOptions = {
  delayMs: number;
  enabled: boolean;
  content: string;
  isDirty: boolean;
  path: string | null;
  resolvedLanguage: string;
  save: () => Promise<boolean>;
};

export function useAutosave(options: AutosaveOptions): string | null {
  const { t } = useTranslation();
  const { content, delayMs, enabled, isDirty, path, resolvedLanguage, save } =
    options;
  const [status, setStatus] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled || !isDirty || !path) return;

    setStatus(t('autosave.savingNow'));
    timerRef.current = setTimeout(() => {
      void save().then((saved) => {
        if (saved) {
          const time = new Date().toLocaleTimeString(resolvedLanguage, {
            hour: '2-digit',
            minute: '2-digit',
          });
          setStatus(t('autosave.lastSavedAt', { time }));
        } else {
          setStatus(null);
        }
        window.setTimeout(() => setStatus(null), 3000);
      });
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [content, delayMs, enabled, isDirty, path, resolvedLanguage, save, t]);

  return status;
}
