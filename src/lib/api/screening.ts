import { apiClient } from './client';
import type { ApiResponse, RSAPublicKey } from './types';

// Questionnaire data type
export interface QuestionnaireData {
  deliveryType: string;
  gestationPeriod: string;
  criedImmediately: string;
  nicuStay: string;
  birthWeightKg: number;
  socialSmileBefore3Months: string;
  sittingBefore8Months: string;
  walkingBefore18Months: string;
  speech: string;
  eyeContact: string;
  repetitiveBehaviour: string;
  hyperactivity: string;
  responseToName: string;
  sensorySensitivity: string;
  signsBefore3Years: string;
  strugglesDailyTasks: string;
}

// Screening test upload response
export interface ScreeningTestUploadResponse {
  tid: string; // Test ID
}

export interface ComplimentaryStatusResponse {
  free_tests_remaining: number;
  deadline: string | null;
  is_expired: boolean;
}

// Get RSA Public Key
export const getRSAPublicKey = async (): Promise<RSAPublicKey> => {
  const { data } = await apiClient.get<ApiResponse<RSAPublicKey>>('/screening-test/rrpk');
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch RSA public key');
  }
  return data.details;
};

export const getComplimentaryStatus = async (): Promise<ComplimentaryStatusResponse> => {
  const { data } = await apiClient.get<ApiResponse<ComplimentaryStatusResponse>>(
    '/screening-test/complimentary-status'
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch complimentary status');
  }
  return data.details;
};

/** Fired during XHR upload; `percent` null when total size unknown. */
export interface UploadProgressPayload {
  percent: number | null;
  loadedMb: number;
}

export type UploadScreeningTestDataOptions = {
  onUploadProgress?: (p: UploadProgressPayload) => void;
};

// Upload Screening Test Data
export const uploadScreeningTestData = async (
  formData: FormData,
  options?: UploadScreeningTestDataOptions
): Promise<ScreeningTestUploadResponse> => {
  console.log('[API] Starting video upload...');

  let lastLoadedMb = 0;

  const { data } = await apiClient.post<ApiResponse<ScreeningTestUploadResponse>>(
    '/screening-test/data',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 900000, // 15 minute timeout
      onUploadProgress: progressEvent => {
        lastLoadedMb = progressEvent.loaded / 1024 / 1024;
        let percent: number | null = null;
        if (progressEvent.total) {
          percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`[API] Upload progress: ${percent}%`);
        } else {
          console.log(`[API] Uploaded: ${lastLoadedMb.toFixed(2)} MB`);
        }
        options?.onUploadProgress?.({ percent, loadedMb: lastLoadedMb });
      },
    }
  );

  console.log('[API] Upload complete, response received');

  if (!data.success) {
    throw new Error(data.message || 'Failed to upload screening test data');
  }

  options?.onUploadProgress?.({ percent: 100, loadedMb: lastLoadedMb });
  return data.details;
};

export const submitQuestionnaire = async (
  tid: string,
  questionnaire: QuestionnaireData
): Promise<void> => {
  const { data } = await apiClient.post<ApiResponse>('/screening-test/questionnaire', {
    tid,
    questionnaire,
  });
  if (!data.success) {
    throw new Error(data.message || 'Failed to submit questionnaire');
  }
};
