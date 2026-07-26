import { useEffect, useRef, useState } from 'react';

import type { Tab } from '../features/files/document';
import { readFile } from '../features/files/ipc';
import {
  clearSession,
  createSessionSnapshot,
  hasRecoverableChanges,
  readSession,
  writeSession,
  type PendingSession,
} from '../lib/session';

type SessionOptions = {
  activeTabId: string | null;
  tabs: Tab[];
};

export function useSessionRestore(options: SessionOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(
    null
  );
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (!session) return;
    setPendingSession(session);

    if (session.tabs && session.tabs.length > 0) {
      void Promise.all(
        session.tabs.map(async (tab) => {
          if (!tab.restoreFromDisk || !tab.document.path) return tab;
          try {
            const file = await readFile(tab.document.path);
            return {
              id: tab.id,
              document: {
                ...tab.document,
                content: file.content,
                savedContent: file.content,
                eol: file.eol,
              },
            };
          } catch {
            return null;
          }
        })
      ).then((tabs) => {
        const restoredTabs = tabs.filter((tab): tab is Tab => tab !== null);
        const activeTabId = restoredTabs.some(
          (tab) => tab.id === session.activeTabId
        )
          ? (session.activeTabId ?? null)
          : (restoredTabs[0]?.id ?? null);
        setPendingSession({
          ...session,
          tabs: restoredTabs,
          activeTabId,
        });
        setIsRestoreDialogOpen(true);
      });
      return;
    }

    if (!session.path) {
      setIsRestoreDialogOpen(true);
      return;
    }

    void readFile(session.path)
      .then((file) => {
        if (file.content !== session.content) {
          setIsRestoreDialogOpen(true);
        } else {
          clearSession();
          setPendingSession(null);
        }
      })
      .catch(() => setIsRestoreDialogOpen(true));
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!hasRecoverableChanges(options.tabs)) return;

    timerRef.current = setTimeout(() => {
      writeSession(
        createSessionSnapshot(options.tabs, options.activeTabId, Date.now())
      );
    }, 500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [options.activeTabId, options.tabs]);

  return {
    isRestoreDialogOpen,
    pendingSession,
    setIsRestoreDialogOpen,
    setPendingSession,
  };
}
