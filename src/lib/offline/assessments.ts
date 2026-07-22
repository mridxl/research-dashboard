import { isAxiosError } from 'axios';

import {
  getSessionAssessment,
  patchSessionAssessment,
  type StoredAssessment,
} from '@/lib/api/research';
import type { StoredAssessmentId } from '@/lib/assessments/registry';
import { useAuthStore } from '@/stores/authStore';

import { getMetadataCacheEntry, putMetadataCacheEntry, putPendingAssessment } from './db';
import { getUidFromToken } from './jwt';

/** Cached per-session assessment bodies, keyed by instrument. */
type CachedAssessmentMap = Partial<Record<StoredAssessmentId, StoredAssessment>>;

export const pendingAssessmentId = (sessionId: string, assessmentId: StoredAssessmentId) =>
  `${sessionId}:${assessmentId}`;

/**
 * True for a record that was saved on this device but has not reached the
 * server yet — scores are server-computed, so such a record has none.
 */
export const isUnsyncedAssessment = (record: unknown): boolean =>
  !!record && typeof record === 'object' && (record as { _unsynced?: boolean })._unsynced === true;

const isNetworkFailure = (err: unknown): boolean =>
  !navigator.onLine || (isAxiosError(err) && !err.response);

async function updateCachedAssessment(
  sessionId: string,
  assessmentId: StoredAssessmentId,
  record: StoredAssessment
): Promise<void> {
  const key = `assessments:${sessionId}` as const;
  const entry = await getMetadataCacheEntry<CachedAssessmentMap>(key);
  await putMetadataCacheEntry(key, { ...(entry?.value ?? {}), [assessmentId]: record });
}

export interface AssessmentSaveResult {
  /** True when the save was queued locally instead of reaching the server. */
  queued: boolean;
  /** The authoritative (scored) record when the server handled the save. */
  record: StoredAssessment | null;
}

/**
 * Save one instrument, falling back to a local queue when the network is
 * unreachable. Replay is last-write-wins: the PATCH replaces the instrument
 * wholesale and the server recomputes scores, and put() on the composite
 * (session, instrument) key means repeated offline edits collapse to the
 * newest one. Validation/auth failures (401/422) are rethrown, never queued —
 * an invalid payload would fail on replay too.
 */
export async function saveAssessmentOfflineAware(
  sessionId: string,
  assessmentId: StoredAssessmentId,
  payload: Record<string, unknown>
): Promise<AssessmentSaveResult> {
  try {
    const record = await patchSessionAssessment<StoredAssessment>(sessionId, assessmentId, payload);
    await updateCachedAssessment(sessionId, assessmentId, record);
    return { queued: false, record };
  } catch (err) {
    if (!isNetworkFailure(err)) {
      throw err;
    }

    const uid = getUidFromToken(useAuthStore.getState().token, true) ?? '';
    await putPendingAssessment({
      id: pendingAssessmentId(sessionId, assessmentId),
      session_id: sessionId,
      assessment_name: assessmentId,
      uid,
      payload,
      syncStatus: 'pending',
      lastError: null,
      attempts: 0,
      updatedAtLocal: Date.now(),
    });

    // Optimistic unscored copy so the sheet shows the saved answers offline.
    await updateCachedAssessment(sessionId, assessmentId, {
      session_id: sessionId,
      ...payload,
      _unsynced: true,
    } as unknown as StoredAssessment);

    return { queued: true, record: null };
  }
}

/**
 * Fetch one instrument with an offline fallback to the cached copy (which may
 * be an unsynced local edit). Network results refresh the cache.
 */
export async function getSessionAssessmentOfflineAware(
  sessionId: string,
  assessmentId: StoredAssessmentId
): Promise<StoredAssessment | null> {
  try {
    const record = await getSessionAssessment<StoredAssessment>(sessionId, assessmentId);
    if (record) {
      await updateCachedAssessment(sessionId, assessmentId, record);
    }
    return record;
  } catch (err) {
    if (!isNetworkFailure(err)) throw err;
    const entry = await getMetadataCacheEntry<CachedAssessmentMap>(`assessments:${sessionId}`);
    return entry?.value?.[assessmentId] ?? null;
  }
}
