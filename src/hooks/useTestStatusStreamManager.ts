import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Assessment, PaginatedResponse, TestUpdateEvent } from '@/lib/api/types';
import { useNotificationStore } from '@/stores/notificationStore';

import { useTestStatusStream } from './useTestStatusStream';

interface UseTestStatusStreamManagerOptions {
  enabled?: boolean;
  showNotifications?: boolean;
}

/**
 * High-level hook that manages SSE connection with React Query integration.
 * - Connects to the SSE stream when mounted
 * - Updates React Query cache optimistically on test updates
 * - Shows toast notifications for important status changes
 */
export function useTestStatusStreamManager(options: UseTestStatusStreamManagerOptions = {}) {
  const { enabled = true, showNotifications = true } = options;
  const queryClient = useQueryClient();

  /**
   * Handle test update events from the SSE stream.
   * Updates the React Query cache optimistically and shows notifications.
   */
  const handleUpdate = useCallback(
    (update: TestUpdateEvent) => {
      // Handle change_type: for new tests, immediately refetch to show them
      if (update.change_type === 'added') {
        console.log('[SSE Manager] New test created, refreshing data:', update.id.slice(0, 8));
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        queryClient.invalidateQueries({ queryKey: ['recentTests'] });
        return;
      }

      // Handle removed tests: filter them from cache
      if (update.change_type === 'removed') {
        console.log('[SSE Manager] Test removed:', update.id.slice(0, 8));
        queryClient.setQueriesData<PaginatedResponse<Assessment>>(
          { queryKey: ['assessments'] },
          oldData => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              items: oldData.items.filter(item => item.id !== update.id),
            };
          }
        );
        queryClient.setQueriesData<PaginatedResponse<Assessment>>(
          { queryKey: ['recentTests'] },
          oldData => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              items: oldData.items.filter(item => item.id !== update.id),
            };
          }
        );
        return;
      }

      // Handle modified tests: update existing items in cache
      // Track patient name to use in notification
      let patientName = '';

      // Update all 'assessments' queries in the cache
      let foundInCache = false;

      queryClient.setQueriesData<PaginatedResponse<Assessment>>(
        { queryKey: ['assessments'] },
        oldData => {
          if (!oldData) return oldData;

          const updatedItems = oldData.items.map(item => {
            if (item.id === update.id) {
              foundInCache = true;
              patientName = item.patient_info?.name || '';
              return {
                ...item,
                status: update.status,
                error_message: update.error_message,
                timestamps: {
                  ...item.timestamps,
                  ...update.timestamps,
                  created_at: update.timestamps.created_at || item.timestamps.created_at || '',
                },
              };
            }
            return item;
          });

          return {
            ...oldData,
            items: updatedItems,
          };
        }
      );

      // Also update 'recentTests' query (used on Dashboard)
      queryClient.setQueriesData<PaginatedResponse<Assessment>>(
        { queryKey: ['recentTests'] },
        oldData => {
          if (!oldData) return oldData;

          const updatedItems = oldData.items.map(item => {
            if (item.id === update.id) {
              foundInCache = true;
              if (!patientName) patientName = item.patient_info?.name || '';
              return {
                ...item,
                status: update.status,
                error_message: update.error_message,
                timestamps: {
                  ...item.timestamps,
                  ...update.timestamps,
                  created_at: update.timestamps.created_at || item.timestamps.created_at || '',
                },
              };
            }
            return item;
          });

          return {
            ...oldData,
            items: updatedItems,
          };
        }
      );

      // If not found in cache (unlikely for 'modified'), invalidate queries to trigger refetch
      if (!foundInCache) {
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        queryClient.invalidateQueries({ queryKey: ['recentTests'] });
      }

      // Handle Notifications & Terminal States
      const isReportGenerated = update.status === 'REPORT_GENERATED';
      const isIncompleteVideo = update.status === 'INCOMPLETE_VIDEO';
      const isFailed =
        !isIncompleteVideo &&
        (update.status.includes('FAILED') ||
          update.status.includes('ERROR') ||
          update.status === 'ERROR');

      if (isReportGenerated || isFailed || isIncompleteVideo) {
        const { addNotification, updateNotification, markTestHighlighted } =
          useNotificationStore.getState();

        const notifStatus = isReportGenerated
          ? 'completed'
          : isIncompleteVideo
            ? 'warning'
            : 'failed';
        const notifMessage = isReportGenerated
          ? 'Report generated successfully'
          : isIncompleteVideo
            ? update.error_message || 'Video recording was incomplete — please re-record'
            : update.error_message || 'Test processing failed';

        const notificationId = addNotification({
          testId: update.id,
          patientName: patientName || 'Unknown Patient',
          status: notifStatus,
          message: notifMessage,
        });

        // Trigger row highlight
        markTestHighlighted(update.id);

        // Show toast for terminal states
        if (showNotifications) {
          const testIdShort = update.id.slice(0, 8);
          if (isReportGenerated) {
            toast.success('Report Ready', {
              description: `Test ${testIdShort}... report has been generated`,
            });
          } else if (isIncompleteVideo) {
            toast.warning('Incomplete recording', {
              description:
                update.error_message || `Test ${testIdShort}... — please capture the full video`,
            });
          } else {
            toast.error('Test Failed', {
              description: update.error_message || `Test ${testIdShort}... encountered an error`,
            });
          }
        }

        // If we didn't have the patient name, try to fetch it after invalidating queries
        if (!patientName) {
          // We need to wait for the invalidation to complete (refresh data)
          // and then try to update the notification
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ['assessments'] }),
            queryClient.invalidateQueries({ queryKey: ['recentTests'] }),
          ]).then(() => {
            // Check cache again
            const updatedAssessments = queryClient.getQueryData<PaginatedResponse<Assessment>>([
              'assessments',
            ]);
            const updatedRecent = queryClient.getQueryData<PaginatedResponse<Assessment>>([
              'recentTests',
            ]);

            const foundItem =
              updatedAssessments?.items?.find(t => t.id === update.id) ||
              updatedRecent?.items?.find(t => t.id === update.id);

            if (foundItem?.patient_info?.name) {
              updateNotification(notificationId, {
                patientName: foundItem.patient_info.name,
              });
            }
          });
        }
      }
    },
    [queryClient, showNotifications]
  );

  const handleConnect = useCallback((clinicId: string) => {
    console.log(`[SSE Manager] Connected to real-time updates for clinic: ${clinicId}`);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('[SSE Manager] Stream error:', error.message);
    // Don't show toast for connection errors - they're handled by reconnection logic
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('[SSE Manager] Disconnected from real-time updates');
  }, []);

  const { disconnect, reconnect, isConnected } = useTestStatusStream({
    enabled,
    onUpdate: handleUpdate,
    onConnect: handleConnect,
    onError: handleError,
    onDisconnect: handleDisconnect,
  });

  return {
    disconnect,
    reconnect,
    isConnected,
  };
}
