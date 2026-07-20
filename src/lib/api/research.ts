import axios from 'axios';

import { apiClient } from './client';
import type { QuestionnaireData } from './screening';
import type { ApiResponse, RSAPublicKey } from './types';

/** Stimulus video version: "1" = original AST video, "2" = new AST video. */
export type StimulusVersion = '1' | '2';

export interface ResearchSessionCreatePayload {
  patient_info: {
    name: string;
    dob: string;
    gender: 'male' | 'female' | 'other';
    guardian_phone?: string;
  };
  metadata: {
    camera_resolution: { width: number; height: number };
    screen_resolution: { width: number; height: number };
    video_language: string;
    screen_size_inch: number;
    camera_used: string;
  };
  data_usage_consent: boolean;
  /** Which stimulus versions to capture, in play order. Run N plays stimulus_versions[N-1]. */
  stimulus_versions: StimulusVersion[];
}

export interface ResearchSessionCreateResponse {
  session_id: string;
  video_count: number;
  stimulus_versions: StimulusVersion[];
}

export interface ResearchTestUploadResponse {
  tid: string;
  session_id: string;
  video_index: number;
}

export type ClinicianDiagnosis = 'autistic' | 'not_autistic' | 'uncertain';

/**
 * Clinical ground-truth labels for a session. All instrument fields are
 * optional/nullable so future additions (CARS2 score, INCLEN result, ISAA,
 * M-CHAT-R, ...) are additive — mirror of the middleware GroundTruth schema.
 */
export interface GroundTruth {
  schema_version: number;
  clinician_diagnosis: ClinicianDiagnosis | null;
  notes: string | null;
}

/** One completed capture run, recorded on the session when its upload lands. */
export interface UploadedRun {
  video_index: number;
  video_version: StimulusVersion;
  tid: string;
}

/** Lean row for the dashboard list — only what the table renders. */
export interface ResearchSessionSummary {
  session_id: string;
  status: string;
  stimulus_versions?: StimulusVersion[];
  uploaded_runs: UploadedRun[];
  has_questionnaire: boolean;
  patient_info?: { name?: string; dob?: string };
  ground_truth?: GroundTruth | null;
  created_at?: string | null;
}

/** Full session, fetched only when resuming so the list stays lean. */
export interface ResearchSessionDetail extends ResearchSessionSummary {
  patient_info?: {
    name?: string;
    dob?: string;
    gender?: string;
    guardian_phone?: string;
  };
  metadata?: ResearchSessionCreatePayload['metadata'];
  data_usage_consent?: boolean;
  timestamps?: Record<string, unknown>;
}

export interface UploadProgressPayload {
  percent: number | null;
  loadedMb: number;
}

export type UploadResearchTestDataOptions = {
  onUploadProgress?: (p: UploadProgressPayload) => void;
};

export const createResearchSession = async (
  payload: ResearchSessionCreatePayload
): Promise<ResearchSessionCreateResponse> => {
  const { data } = await apiClient.post<ApiResponse<ResearchSessionCreateResponse>>(
    '/research/session',
    payload
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to create research session');
  }
  return data.details;
};

export const getResearchSessions = async (): Promise<ResearchSessionSummary[]> => {
  const { data } =
    await apiClient.get<ApiResponse<{ items: ResearchSessionSummary[] }>>('/research/sessions');
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch research sessions');
  }
  return data.details.items;
};

export const getResearchRSAPublicKey = async (): Promise<RSAPublicKey> => {
  const { data } = await apiClient.get<ApiResponse<RSAPublicKey>>('/research/test/rrpk');
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch RSA public key');
  }
  return data.details;
};

/** Fast in-request retries for a transient upload failure. */
const UPLOAD_MAX_ATTEMPTS = 3;
const UPLOAD_RETRY_BASE_MS = 2000;

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Whether a failed upload is worth retrying. Retrying is safe because the
 * endpoint is idempotent per (session_id, video_index): the server derives a
 * deterministic test id from them, so a request that actually landed returns
 * the same tid instead of creating a duplicate test. We only retry failures
 * that look like an interrupted transfer — a dropped connection or client-side
 * timeout (no HTTP response), nginx's 408, a gateway 5xx, or the backend's 400
 * "error parsing the body" (its view of a truncated multipart stream).
 * Validation/auth errors (401, 422, other 400s) are logical failures and must
 * not be retried.
 */
const isTransientUploadError = (error: unknown): boolean => {
  if (axios.isCancel(error)) return false;
  if (!axios.isAxiosError(error)) return false;
  // No HTTP response at all → connection dropped or timed out mid-upload.
  if (!error.response) return true;

  const status = error.response.status;
  if (status === 408 || status === 502 || status === 503 || status === 504) return true;
  if (status === 400) {
    const message = (error.response.data as { message?: string } | undefined)?.message ?? '';
    return /parsing the body/i.test(message);
  }
  return false;
};

const postResearchTestData = async (
  formData: FormData,
  options: UploadResearchTestDataOptions | undefined
): Promise<ResearchTestUploadResponse> => {
  let lastLoadedMb = 0;

  const { data } = await apiClient.post<ApiResponse<ResearchTestUploadResponse>>(
    '/research/test/data',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 900000,
      onUploadProgress: progressEvent => {
        lastLoadedMb = progressEvent.loaded / 1024 / 1024;
        let percent: number | null = null;
        if (progressEvent.total) {
          percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
        options?.onUploadProgress?.({ percent, loadedMb: lastLoadedMb });
      },
    }
  );

  if (!data.success) {
    throw new Error(data.message || 'Failed to upload research test data');
  }

  options?.onUploadProgress?.({ percent: 100, loadedMb: lastLoadedMb });
  return data.details;
};

// Upload one capture run. Retries transient/interrupted uploads a few times
// with exponential backoff + jitter (safe: see isTransientUploadError).
export const uploadResearchTestData = async (
  formData: FormData,
  options?: UploadResearchTestDataOptions
): Promise<ResearchTestUploadResponse> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await postResearchTestData(formData, options);
    } catch (error) {
      if (attempt >= UPLOAD_MAX_ATTEMPTS || !isTransientUploadError(error)) {
        throw error;
      }
      const backoff = UPLOAD_RETRY_BASE_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 500);
      console.warn(
        `[API] Transient upload failure, retrying in ${backoff}ms:`,
        error instanceof Error ? error.message : error
      );
      await delay(backoff);
    }
  }
};

export const getResearchSession = async (sessionId: string): Promise<ResearchSessionDetail> => {
  const { data } = await apiClient.get<ApiResponse<ResearchSessionDetail>>(
    `/research/session/${sessionId}`
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch session');
  }
  return data.details;
};

/** Delete an abandoned session. Server rejects (409) unless it has no uploaded recordings. */
export const deleteResearchSession = async (sessionId: string): Promise<void> => {
  const { data } = await apiClient.delete<ApiResponse>(`/research/session/${sessionId}`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete session');
  }
};

export const getSessionGroundTruth = async (sessionId: string): Promise<GroundTruth | null> => {
  const { data } = await apiClient.get<ApiResponse<{ ground_truth: GroundTruth | null }>>(
    `/research/session/${sessionId}/ground-truth`
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch ground truth');
  }
  return data.details.ground_truth;
};

export const putSessionGroundTruth = async (
  sessionId: string,
  payload: GroundTruth
): Promise<void> => {
  const { data } = await apiClient.put<ApiResponse>(
    `/research/session/${sessionId}/ground-truth`,
    payload
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to save ground truth');
  }
};

export const submitResearchQuestionnaire = async (
  sessionId: string,
  questionnaire: QuestionnaireData
): Promise<void> => {
  const { data } = await apiClient.post<ApiResponse>('/research/questionnaire', {
    session_id: sessionId,
    questionnaire,
  });
  if (!data.success) {
    throw new Error(data.message || 'Failed to submit questionnaire');
  }
};
