import { useEffect } from 'react';

import {
  useQuery as useReactQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { handleApiError } from '@/lib/utils/errorHandler';

/**
 * Wrapper around React Query's useQuery with default error handling
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useQuery({
 *   queryKey: ['doctors'],
 *   queryFn: getDoctors,
 * });
 * ```
 */
export function useQuery<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
  options: Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> & {
    queryKey: UseQueryOptions<TQueryFnData, TError, TData>['queryKey'];
    showErrorToast?: boolean;
    onError?: (error: TError) => void;
  }
): UseQueryResult<TData, TError> {
  const { showErrorToast = true, onError, ...queryOptions } = options;

  const query = useReactQuery<TQueryFnData, TError, TData>(queryOptions);

  useEffect(() => {
    if (query.error) {
      if (showErrorToast) {
        const errorMessage = handleApiError(query.error);
        toast.error(errorMessage);
      }
      onError?.(query.error);
    }
  }, [query.error, showErrorToast, onError]);

  return query;
}
