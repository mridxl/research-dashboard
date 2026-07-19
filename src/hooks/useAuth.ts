import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to access auth state and actions.
 */
export const useAuth = () => {
  const token = useAuthStore(s => s.token);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isLoading = useAuthStore(s => s.isLoading);
  const verifyAuth = useAuthStore(s => s.verifyAuth);
  const login = useAuthStore(s => s.login);
  const logout = useAuthStore(s => s.logout);

  return { token, isAuthenticated, isLoading, verifyAuth, login, logout };
};
