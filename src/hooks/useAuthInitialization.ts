import { useEffect } from 'react';

import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to initialize auth state and set up periodic verification.
 * Call this once at the app root (App.tsx).
 *
 * Handles:
 * - Verifying auth on mount
 * - Periodic re-verification every 10 minutes
 * - Proper cleanup of intervals
 */
export function useAuthInitialization() {
  useEffect(() => {
    // Verify auth on mount
    useAuthStore.getState().verifyAuth();

    // Periodic verification every 10 minutes
    const interval = setInterval(
      () => {
        const state = useAuthStore.getState();
        if (state.isAuthenticated) {
          state.verifyAuth(true);
        }
      },
      10 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, []);
}
