import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/stores/authStore';

import {
  getSyncSnapshot,
  initSyncManager,
  processSyncQueue,
  resumeSyncAfterAuth,
  subscribeSyncStatus,
} from './syncManager';
import type { SyncStatusSnapshot } from './types';

export function useSyncStatus(): SyncStatusSnapshot {
  const [status, setStatus] = useState<SyncStatusSnapshot>(getSyncSnapshot);

  useEffect(() => subscribeSyncStatus(setStatus), []);

  return status;
}

/**
 * Wire the sync manager into a layout. Also refreshes counts and resumes after re-login.
 */
export function useOfflineSyncLifecycle(): SyncStatusSnapshot {
  const token = useAuthStore(s => s.token);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const status = useSyncStatus();
  const pausedForAuth = status.pausedForAuth;
  // Token that sync was last attempted/resumed with. A 401 doesn't rotate the
  // stored token, so without this a pause caused by an expired token would
  // re-trigger resumeSyncAfterAuth() on every render with the *same* expired
  // token forever, re-uploading multi-MB videos in a loop. Only resume when
  // the token has actually changed since the last attempt (e.g. re-login).
  const lastAttemptedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const cleanup = initSyncManager();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    if (pausedForAuth) {
      if (token !== lastAttemptedTokenRef.current) {
        lastAttemptedTokenRef.current = token;
        resumeSyncAfterAuth();
      }
    } else {
      lastAttemptedTokenRef.current = token;
      void processSyncQueue();
    }
  }, [isAuthenticated, token, pausedForAuth]);

  return status;
}
