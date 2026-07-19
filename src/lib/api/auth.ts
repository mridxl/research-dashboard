import axios from 'axios';

import { apiClient } from './client';
import type { ApiResponse, AuthResponse } from './types';

/**
 * Result of a token verification attempt.
 * - "valid":   the server confirmed the token is good.
 * - "invalid": the server definitively rejected the token (401 / success:false).
 * - "unknown": verification was inconclusive (offline, 5xx, timeout, etc.) and
 *              the caller should preserve the existing auth state rather than
 *              logging the user out.
 */
export type VerifyResult = 'valid' | 'invalid' | 'unknown';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/research/auth/login', {
    email,
    password,
  });

  if (!data.success) {
    throw new Error(data.message || 'Login failed');
  }

  return data.details;
};

export const verifyToken = async (): Promise<VerifyResult> => {
  try {
    const { data } = await apiClient.get<ApiResponse>('/research/auth/verify');
    return data.success === true ? 'valid' : 'invalid';
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return 'invalid';
    }
    return 'unknown';
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post<ApiResponse>('/research/auth/logout');
  } catch {
    // Ignore network errors
  }
};
