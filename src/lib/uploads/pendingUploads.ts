import { isAxiosError } from 'axios';
import Dexie, { type EntityTable } from 'dexie';

import { type UploadProgressPayload, uploadResearchTestData } from '@/lib/api/research';

/**
 * Local-first safety net for research uploads (NOT the clinic offline subsystem).
 *
 * Every encrypted upload payload is persisted to IndexedDB before the network
 * request starts and deleted only after the server confirms it. If the tab
 * closes, the machine sleeps, or the upload fails, the recording survives on
 * this device and is re-uploaded in the background from the dashboard. Retries
 * are safe because the server derives a deterministic test id from
 * (session_id, video_index).
 *
 * Nothing is ever auto-discarded. A recording is irreplaceable — a child sat
 * through a five-minute stimulus to produce it — so even a "permanent" server
 * rejection (which, since the payload is client-generated, would signal a bug
 * on our side) keeps the row and surfaces it for a human to decide. Storage is
 * bounded by the researcher explicitly discarding from the dashboard.
 *
 * Privacy: only AES-GCM-encrypted blobs are stored — never plaintext video.
 * The child's name is kept so the indicator can say which recording is stuck.
 *
 * Blobs live in a separate table from metadata so listing/counting pending
 * uploads never pulls ~65 MB per row into memory.
 */

/** Small, listable record — safe to hold in React state. */
export interface PendingUploadMeta {
  /** `${session_id}:${video_index}` — mirrors the server's idempotency key. */
  id: string;
  session_id: string;
  video_index: number;
  /** Child's name, for display in the pending-uploads indicator. */
  patient_name: string;
  encrypted_aes_password: string;
  data_usage_consent: boolean;
  /** Per-run metadata JSON (includes video_version). */
  metadata: Record<string, unknown>;
  size_bytes: number;
  created_at: number;
  attempts: number;
  last_error: string | null;
  last_attempt_at: number | null;
}

/** The heavy half — loaded only when an upload is actually attempted. */
export interface PendingUploadBlobs {
  id: string;
  video_file: Blob;
  video_encrypted_aes_key: Blob;
  encrypted_calibration_points: Blob | null;
  encrypted_mirror_frame: Blob | null;
}

const db = new Dexie('aignosis-research') as Dexie & {
  pendingUploads: EntityTable<PendingUploadMeta, 'id'>;
  pendingUploadBlobs: EntityTable<PendingUploadBlobs, 'id'>;
};

// v1 stored blobs inline on pendingUploads; v2 splits them out.
db.version(1).stores({ pendingUploads: 'id, session_id, created_at' });
db.version(2)
  .stores({
    pendingUploads: 'id, session_id, created_at',
    pendingUploadBlobs: 'id',
  })
  .upgrade(async tx => {
    const legacyRows = await tx.table('pendingUploads').toArray();
    for (const row of legacyRows) {
      if (!row.video_file) continue;
      await tx.table('pendingUploadBlobs').put({
        id: row.id,
        video_file: row.video_file,
        video_encrypted_aes_key: row.video_encrypted_aes_key,
        encrypted_calibration_points: row.encrypted_calibration_points ?? null,
        encrypted_mirror_frame: row.encrypted_mirror_frame ?? null,
      });
      await tx.table('pendingUploads').put({
        id: row.id,
        session_id: row.session_id,
        video_index: row.video_index,
        patient_name: row.patient_name ?? '',
        encrypted_aes_password: row.encrypted_aes_password,
        data_usage_consent: row.data_usage_consent,
        metadata: row.metadata,
        size_bytes: row.video_file?.size ?? 0,
        created_at: row.created_at,
        attempts: 0,
        last_error: null,
        last_attempt_at: null,
      });
    }
  });

export const pendingUploadId = (sessionId: string, videoIndex: number) =>
  `${sessionId}:${videoIndex}`;

// --- reactivity -------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

export const subscribeToPendingUploads = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notify = () => {
  listeners.forEach(listener => listener());
};

export interface FlushState {
  isFlushing: boolean;
  /** Id of the row currently uploading, if any. */
  activeId: string | null;
  activeProgress: UploadProgressPayload | null;
}

let flushState: FlushState = { isFlushing: false, activeId: null, activeProgress: null };

export const getFlushState = (): FlushState => flushState;

const setFlushState = (next: Partial<FlushState>) => {
  flushState = { ...flushState, ...next };
  notify();
};

// --- persistence ------------------------------------------------------------

export const savePendingUpload = async (
  meta: PendingUploadMeta,
  blobs: PendingUploadBlobs
): Promise<void> => {
  await db.transaction('rw', db.pendingUploads, db.pendingUploadBlobs, async () => {
    await db.pendingUploads.put(meta);
    await db.pendingUploadBlobs.put(blobs);
  });
  notify();
};

export const deletePendingUpload = async (id: string): Promise<void> => {
  await db.transaction('rw', db.pendingUploads, db.pendingUploadBlobs, async () => {
    await db.pendingUploads.delete(id);
    await db.pendingUploadBlobs.delete(id);
  });
  notify();
};

/** List pending uploads, oldest first. Never loads blobs. */
export const listPendingUploads = async (): Promise<PendingUploadMeta[]> =>
  db.pendingUploads.orderBy('created_at').toArray();

export const countPendingUploads = async (): Promise<number> => db.pendingUploads.count();

/** Rebuild the multipart body — the single source of truth for field names. */
export const buildUploadFormData = (
  meta: PendingUploadMeta,
  blobs: PendingUploadBlobs
): FormData => {
  const formData = new FormData();
  formData.append('video_file', blobs.video_file, 'vid.bin');
  formData.append('video_encrypted_aes_key', blobs.video_encrypted_aes_key, 'vid_aes.bin');
  if (blobs.encrypted_calibration_points) {
    formData.append(
      'encrypted_calibration_points',
      blobs.encrypted_calibration_points,
      'frames.bin'
    );
  }
  if (blobs.encrypted_mirror_frame) {
    formData.append('encrypted_mirror_frame', blobs.encrypted_mirror_frame, 'mirror.bin');
  }
  if (meta.encrypted_aes_password) {
    formData.append('encrypted_aes_password', meta.encrypted_aes_password);
  }
  formData.append('session_id', meta.session_id);
  formData.append('video_index', String(meta.video_index));
  formData.append('data_usage_consent', String(meta.data_usage_consent));
  formData.append('metadata', JSON.stringify(meta.metadata));
  return formData;
};

/**
 * Uploads currently in flight in the live test flow. The background flush skips
 * these so it never races an upload the flow already started.
 */
const inFlightIds = new Set<string>();

export const markUploadInFlight = (id: string) => {
  inFlightIds.add(id);
  notify();
};

export const clearUploadInFlight = (id: string) => {
  inFlightIds.delete(id);
  notify();
};

export const isUploadInFlight = (id: string) => inFlightIds.has(id);

// --- background flush -------------------------------------------------------

const describeError = (error: unknown): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (!error.response) return 'Network unavailable';
    if (status === 401) return 'Signed out — sign in again to upload';
    if (status === 404) return 'Session no longer exists';
    if (status === 403) return 'Not permitted for this account';
    const message = (error.response.data as { message?: string } | undefined)?.message;
    return message || `Server error (HTTP ${status})`;
  }
  return error instanceof Error ? error.message : 'Unknown error';
};

export interface FlushResult {
  uploaded: number;
  failed: number;
}

/**
 * Re-upload every persisted payload not already in flight, deleting rows the
 * server confirms. Sequential on purpose — recovered uploads should not compete
 * with each other for bandwidth. Failures are recorded on the row (attempts,
 * last_error) and retried on the next flush; nothing is discarded automatically.
 * Returns null if a flush is already running.
 */
export const flushPendingUploads = async (): Promise<FlushResult | null> => {
  if (flushState.isFlushing) return null;
  setFlushState({ isFlushing: true, activeId: null, activeProgress: null });

  const result: FlushResult = { uploaded: 0, failed: 0 };

  try {
    const rows = await listPendingUploads();

    for (const meta of rows) {
      if (inFlightIds.has(meta.id)) continue;

      const blobs = await db.pendingUploadBlobs.get(meta.id);
      if (!blobs) {
        // Metadata without its payload can never upload — drop the orphan.
        await deletePendingUpload(meta.id);
        continue;
      }

      setFlushState({ activeId: meta.id, activeProgress: null });

      try {
        await uploadResearchTestData(buildUploadFormData(meta, blobs), {
          onUploadProgress: progress => setFlushState({ activeProgress: progress }),
        });
        await deletePendingUpload(meta.id);
        result.uploaded += 1;
      } catch (error) {
        const description = describeError(error);
        console.warn(
          `[PendingUploads] Upload ${meta.id} failed (${description}); keeping for retry`
        );
        await db.pendingUploads.update(meta.id, {
          attempts: meta.attempts + 1,
          last_error: description,
          last_attempt_at: Date.now(),
        });
        result.failed += 1;
      }
    }
  } finally {
    setFlushState({ isFlushing: false, activeId: null, activeProgress: null });
  }

  return result;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
