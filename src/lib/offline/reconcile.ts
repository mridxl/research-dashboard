import { getResearchSyncStatus } from '@/lib/api/research';
import { deletePendingUpload, pendingUploadId } from '@/lib/uploads/pendingUploads';
import { useAuthStore } from '@/stores/authStore';

import { listPendingSessionsForUid, updatePendingSession } from './db';
import { getUidFromToken } from './jwt';
import { isSyncProcessing, processSyncQueue, setReconcileInProgress } from './syncManager';

const SYNC_STATUS_CHUNK = 50;

/**
 * After app restart, reconcile offline-created sessions against the server so
 * work another pass (or another device) already completed isn't redone:
 *
 * - A session found server-side is marked 'created' locally, unblocking its
 *   queued run uploads / questionnaire / assessments.
 * - A run listed in the server's uploaded_runs is deleted from the local
 *   pending-upload queue. This is safe because uploaded_runs is only written
 *   after GCS upload success (_record_upload_on_session) — the analogue of
 *   core/dashboard's UNCONFIRMED_STATUSES care.
 * - Queued questionnaires are left alone: submitting is idempotent for an
 *   identical payload, so the sync pass resolves them naturally.
 */
export async function reconcileWithServer(): Promise<void> {
  if (!navigator.onLine) return;
  // Don't race an in-flight sync pass — it may be mutating/deleting the very
  // records we're about to read and rewrite. It will trigger its own pass
  // when it's done anyway.
  if (isSyncProcessing()) return;

  // Set the mutex synchronously, before any await, so a sync pass cannot slip
  // in between the isSyncProcessing() check above and the first await below.
  setReconcileInProgress(true);
  try {
    const token = useAuthStore.getState().token;
    const uid = getUidFromToken(token, true);
    if (!uid) return;

    const pendingSessions = await listPendingSessionsForUid(uid);
    if (pendingSessions.length === 0) return;

    for (let start = 0; start < pendingSessions.length; start += SYNC_STATUS_CHUNK) {
      const chunk = pendingSessions.slice(start, start + SYNC_STATUS_CHUNK);
      const items = await getResearchSyncStatus(chunk.map(s => s.client_session_id));

      for (const item of items) {
        if (!item.session_id || !item.status) continue;
        const local = chunk.find(s => s.client_session_id === item.client_session_id);
        if (!local) continue;

        if (local.syncStatus !== 'created') {
          await updatePendingSession(local.session_id, {
            syncStatus: 'created',
            lastError: null,
          });
        }

        // Drop local pending uploads the server has confirmed landed.
        for (const run of item.uploaded_runs) {
          await deletePendingUpload(pendingUploadId(local.session_id, run.video_index));
        }
      }
    }
  } catch (err) {
    console.warn('[offline] reconcile failed', err);
  } finally {
    setReconcileInProgress(false);
  }

  // Always kick a sync pass once the mutex clears: any sync trigger that
  // arrived while reconcile held the flag (including the uid-missing and
  // nothing-to-reconcile early returns above) would otherwise be dropped
  // silently, since those paths carry no rerunRequested signal of their own.
  await processSyncQueue();
}
