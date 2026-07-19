import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { logout as apiLogout, verifyToken } from '@/lib/api/auth';
import { queryClient } from '@/lib/react-query/queryClient';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastVerified: number | null;
}

interface AuthActions {
  login: (token: string) => void;
  logout: () => Promise<void>;
  verifyAuth: (force?: boolean) => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      isLoading: true,
      lastVerified: null,

      login: (token: string) => {
        set({
          token,
          isAuthenticated: true,
          isLoading: false,
          lastVerified: Date.now(),
        });
      },

      logout: async () => {
        try {
          await apiLogout();
        } catch (error) {
          console.warn('API logout error (ignored):', error);
        }

        set({
          token: null,
          isAuthenticated: false,
          isLoading: false,
          lastVerified: null,
        });

        queryClient.clear();
        queryClient.cancelQueries();
      },

      verifyAuth: async (force = false) => {
        const state = get();

        if (!state.token) {
          set({ isAuthenticated: false, isLoading: false });
          return false;
        }

        // Skip re-verification if last verified within 5 minutes (unless forced)
        if (!force && state.lastVerified && Date.now() - state.lastVerified < 5 * 60 * 1000) {
          set({ isLoading: false });
          return state.isAuthenticated;
        }

        set({ isLoading: true });

        const result = await verifyToken();

        if (result === 'valid') {
          set({
            isAuthenticated: true,
            lastVerified: Date.now(),
            isLoading: false,
          });
          return true;
        }

        if (result === 'invalid') {
          set({
            isAuthenticated: false,
            lastVerified: null,
            isLoading: false,
          });
          return false;
        }

        // result === 'unknown': verification was inconclusive (offline, 5xx,
        // timeout). Preserve the existing auth state so the user isn't logged
        // out mid-test by a transient failure.
        set({ isLoading: false });
        return state.isAuthenticated;
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
