import { useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'antiqos_session_';

interface StoredSession {
  session_id: string;
  thread_id: string;
}

export function useSession(entitySlug: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${entitySlug}`;

  const getStoredSession = useCallback((): StoredSession | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read session from localStorage:', e);
    }
    return null;
  }, [storageKey]);

  const saveSession = useCallback(
    (sessionId: string, threadId: string) => {
      try {
        const data: StoredSession = {
          session_id: sessionId,
          thread_id: threadId,
        };
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save session to localStorage:', e);
      }
    },
    [storageKey]
  );

  const updateThreadId = useCallback(
    (threadId: string) => {
      const stored = getStoredSession();
      if (stored) {
        saveSession(stored.session_id, threadId);
      }
    },
    [getStoredSession, saveSession]
  );

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error('Failed to clear session from localStorage:', e);
    }
  }, [storageKey]);

  return {
    getStoredSession,
    saveSession,
    updateThreadId,
    clearSession,
  };
}
