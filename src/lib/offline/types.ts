import type { ResearchSessionCreatePayload, StimulusVersion } from '@/lib/api/research';
import type { QuestionnaireData } from '@/lib/api/screening';
import type { StoredAssessmentId } from '@/lib/assessments/registry';

export type PendingSyncStatus = 'pending' | 'created' | 'failed';
export type PendingItemStatus = 'pending' | 'failed';

/**
 * A research session created on this device while offline. session_id is the
 * final Firestore document id — sha1(uid:client_session_id)[:32], computed
 * locally with the same derivation the middleware uses — so every downstream
 * record (pending uploads, questionnaire, assessments) can reference it before
 * the create has ever reached the server.
 */
export interface PendingSessionRecord {
  /** Derived 32-hex server document id (primary key). */
  session_id: string;
  /** The client-generated UUID sent to the server for idempotent creation. */
  client_session_id: string;
  uid: string;
  payload: ResearchSessionCreatePayload;
  video_count: number;
  stimulus_versions: StimulusVersion[];
  syncStatus: PendingSyncStatus;
  lastError: string | null;
  attempts: number;
  createdAt: number;
  updatedAt: number;
}

export interface PendingQuestionnaireRecord {
  session_id: string;
  uid: string;
  questionnaire: QuestionnaireData;
  syncStatus: PendingItemStatus;
  lastError: string | null;
  attempts: number;
  createdAt: number;
}

export interface PendingAssessmentRecord {
  /** `${session_id}:${assessment_name}` — put() on this key = local last-write-wins. */
  id: string;
  session_id: string;
  assessment_name: StoredAssessmentId;
  uid: string;
  payload: unknown;
  syncStatus: PendingItemStatus;
  lastError: string | null;
  attempts: number;
  /** Local edit time; replay is last-write-wins against the server. */
  updatedAtLocal: number;
}

export type MetadataCacheKey =
  | 'rsa_public_key'
  | `sessions_list:${string}`
  | `session_detail:${string}`
  | `assessments:${string}`
  | `hls_cached:${string}`
  | `offline_pack:${string}`;

export interface MetadataCacheEntry<T = unknown> {
  key: MetadataCacheKey;
  value: T;
  fetchedAt: number;
}

export interface OfflinePackMeta {
  ready: boolean;
  downloadedAt: number;
  steps: {
    encryptionKey: boolean;
    faceModels: boolean;
    testAssets: boolean;
    stimulusVideos: boolean;
  };
}

/** MediaRecorder chunk journal for crash recovery of an in-progress run. */
export interface DraftRunRecord {
  /** `${session_id}:${video_index}` */
  id: string;
  uid: string;
  mimeType: string;
  chunks: Blob[];
  updatedAt: number;
  patientName?: string;
}

export interface SyncStatusSnapshot {
  pendingSessionCount: number;
  pendingUploadCount: number;
  pendingQuestionnaireCount: number;
  pendingAssessmentCount: number;
  failedCount: number;
  pausedForAuth: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;
}

/** Resolved value of an upload promise that was saved locally instead of sent. */
export interface LocalSubmitResult {
  offline: true;
  session_id: string;
  video_index: number;
}
