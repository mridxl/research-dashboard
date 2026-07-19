import { capitalizeFirstLetter } from '@/lib/utils';

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred';
};

export const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as {
      response?: {
        data?: {
          message?: string;
          details?: string;
        };
      };
    };
    const details = apiError.response?.data?.details;
    const message = apiError.response?.data?.message;

    if (details) {
      return capitalizeFirstLetter(details);
    }
    if (message) {
      return capitalizeFirstLetter(message);
    }
    return 'An error occurred';
  }
  return capitalizeFirstLetter(getErrorMessage(error));
};
