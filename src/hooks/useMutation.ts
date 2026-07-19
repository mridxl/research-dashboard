import {
  useMutation as useReactMutation,
  type UseMutationOptions,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { handleApiError } from '@/lib/utils/errorHandler';

/**
 * Wrapper around React Query's useMutation with default error handling and success toasts
 *
 * @example
 * ```tsx
 * const mutation = useMutation({
 *   mutationFn: createDoctor,
 *   onSuccess: (data) => {
 *     toast.success('Doctor created successfully');
 *     queryClient.invalidateQueries({ queryKey: ['doctors'] });
 *   },
 * });
 * ```
 */
export function useMutation<TData = unknown, TError = unknown, TVariables = void>(
  options: UseMutationOptions<TData, TError, TVariables> & {
    showErrorToast?: boolean; // Whether to show error toast (default: true)
    showSuccessToast?: boolean; // Whether to show success toast (default: false)
    successMessage?: string; // Success message to show
    invalidateQueries?: string[]; // Query keys to invalidate on success
  }
): UseMutationResult<TData, TError, TVariables> {
  const {
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    invalidateQueries,
    ...mutationOptions
  } = options;

  const queryClient = useQueryClient();

  const {
    onSuccess: originalOnSuccess,
    onError: originalOnError,
    ...restOptions
  } = mutationOptions;

  return useReactMutation<TData, TError, TVariables>({
    ...restOptions,
    onSuccess: (data, variables, context) => {
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }

      // Invalidate specified queries
      if (invalidateQueries && invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }

      if (originalOnSuccess) {
        (originalOnSuccess as (data: TData, variables: TVariables, context: unknown) => void)(
          data,
          variables,
          context
        );
      }
    },
    onError: (error: TError, variables: TVariables, context) => {
      if (showErrorToast) {
        const errorMessage = handleApiError(error);
        toast.error(errorMessage);
      }
      if (originalOnError) {
        (originalOnError as (error: TError, variables: TVariables, context: unknown) => void)(
          error,
          variables,
          context
        );
      }
    },
  });
}
