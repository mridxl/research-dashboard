import { create } from 'zustand';

import type { ResearchTestUploadResponse, UploadProgressPayload } from '@/lib/api/research';
import type { QuestionnaireData } from '@/lib/api/screening';

export interface PatientInfo {
  name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  guardian_phone: string;
}

export interface TestMetadata {
  camera_resolution: { width: number; height: number };
  screen_resolution: { width: number; height: number };
  video_language: string;
  screen_size_inch: number;
  camera_used: string;
}

export interface TestData {
  session_id: string | null;
  video_count: 1 | 2;
  current_video_index: number;
  uploaded_test_ids: string[];
  patient_info: PatientInfo;
  metadata: TestMetadata;
  encrypted_aes_password: string;
  data_usage_consent: boolean;
  device_id?: string;
  webcam_test_completed: boolean;
  encrypted_calibration_points: Blob | null;
  mirror_frame_data_url: string | null;
  encrypted_mirror_frame: Blob | null;
  test_id: string | null;
  questionnaire_data: QuestionnaireData | null;
}

const initialTestData: TestData = {
  session_id: null,
  video_count: 1,
  current_video_index: 1,
  uploaded_test_ids: [],
  patient_info: {
    name: '',
    dob: '',
    gender: 'male',
    guardian_phone: '',
  },
  metadata: {
    camera_resolution: { width: 0, height: 0 },
    screen_resolution: { width: 0, height: 0 },
    video_language: '',
    screen_size_inch: 0,
    camera_used: '',
  },
  encrypted_aes_password: '',
  data_usage_consent: true,
  webcam_test_completed: false,
  encrypted_calibration_points: null,
  mirror_frame_data_url: null,
  encrypted_mirror_frame: null,
  test_id: null,
  questionnaire_data: null,
};

interface TestState {
  testData: TestData;
  setTestData: (data: Partial<TestData> | ((prev: TestData) => Partial<TestData>)) => void;
  resetTestData: () => void;
  resetRunCaptureState: () => void;
  uploadPromises: Promise<ResearchTestUploadResponse>[];
  addUploadPromise: (promise: Promise<ResearchTestUploadResponse>) => void;
  clearUploadPromises: () => void;
  uploadProgress: UploadProgressPayload | null;
  setUploadProgress: (p: UploadProgressPayload | null) => void;
}

export const useTestStore = create<TestState>(set => ({
  testData: initialTestData,

  setTestData: data =>
    set(state => ({
      testData: {
        ...state.testData,
        ...(typeof data === 'function' ? data(state.testData) : data),
      },
    })),

  resetTestData: () =>
    set({
      testData: initialTestData,
      uploadPromises: [],
      uploadProgress: null,
    }),

  resetRunCaptureState: () =>
    set(state => ({
      testData: {
        ...state.testData,
        device_id: undefined,
        webcam_test_completed: false,
        encrypted_calibration_points: null,
        mirror_frame_data_url: null,
        encrypted_mirror_frame: null,
        encrypted_aes_password: '',
        metadata: {
          ...state.testData.metadata,
          camera_resolution: { width: 0, height: 0 },
          screen_resolution: { width: 0, height: 0 },
          camera_used: '',
        },
      },
    })),

  uploadPromises: [],
  uploadProgress: null,

  addUploadPromise: promise =>
    set(state => ({
      uploadPromises: [...state.uploadPromises, promise],
      uploadProgress: { percent: null, loadedMb: 0 },
    })),

  clearUploadPromises: () => set({ uploadPromises: [], uploadProgress: null }),

  setUploadProgress: p => set({ uploadProgress: p }),
}));
