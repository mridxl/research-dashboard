import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_MDW_BACKEND || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRedirecting = false;

// React Router navigation function set by the app
let navigateFunction: ((path: string) => void) | null = null;

export const setNavigate = (navigate: (path: string) => void) => {
  navigateFunction = navigate;
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

interface ApiErrorResponse {
  success: boolean;
  message?: string;
  details?: unknown;
}

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    if (status === 401) {
      if (isRedirecting) {
        return Promise.reject(error);
      }

      isRedirecting = true;
      useAuthStore.getState().logout();

      if (navigateFunction) {
        navigateFunction('/login');
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      } else {
        window.location.href = '/login';
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
    }

    return Promise.reject(error);
  }
);
