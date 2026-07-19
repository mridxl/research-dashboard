/** Permission state for camera/microphone access on the webcam test page */
export type PermissionState = 'initial' | 'requesting' | 'granted' | 'denied';

export const PERMISSION_STATE: Record<PermissionState, PermissionState> = {
  initial: 'initial',
  requesting: 'requesting',
  granted: 'granted',
  denied: 'denied',
} as const;

/** Face detector status (matches detector.js logic) */
export type FaceDetectorStatus = 'loading' | 'no_face' | 'adjust' | 'success';

/** Movement cues shown as arrows on webcam preview */
export type FaceMovementHint = 'left' | 'right' | 'up' | 'down' | 'forward';

/** Simple lighting status used to gate calibration */
export type LightingStatus = 'idle' | 'checking' | 'low_light' | 'too_bright' | 'good';

export interface FaceDetectorDebugInfo {
  totalFaces: number;
  validFaces: number;
  bestDetectionScore: number | null;
  frameEvalMs: number | null;
}

export interface LightingDebugInfo {
  meanBrightness: number | null;
  brightnessLow: number;
  brightnessHigh: number;
  goodFrameCount: number;
  sampleIntervalMs: number;
}

/** Metrics from face detection (coverage and offset from ellipse centre) */
export interface FaceDetectorMetrics {
  coverage: number;
  offsetX: number;
  offsetY: number;
}

/** Full state returned by useFaceDetector */
export interface FaceDetectorState {
  status: FaceDetectorStatus;
  message: string;
  metrics: FaceDetectorMetrics | null;
  movementHints: FaceMovementHint[];
  debug: FaceDetectorDebugInfo;
  isSuccess: boolean;
  modelsLoaded: boolean;
  error: string | null;
}
