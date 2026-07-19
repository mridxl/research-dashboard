import { type RefObject } from 'react';

import { Camera } from 'lucide-react';

import type {
  FaceDetectorState,
  FaceMovementHint,
  LightingDebugInfo,
  LightingStatus,
  PermissionState,
} from '../types/webcamTest';

export interface WebcamPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  faceDetector: FaceDetectorState;
  permissionState: PermissionState;
  permissionStatusText: string;
  language: string;
  lightingStatus: LightingStatus;
  lightingMessage: string;
  lightingTip: string;
  lightingDebug: LightingDebugInfo;
  showDebugPanel?: boolean;
}

const ELLIPSE_VIEWBOX = { width: 600, height: 600 };
const ELLIPSE_CX = 300;
const ELLIPSE_CY = 300;
const ELLIPSE_RX = 173;
const ELLIPSE_RY = 200;

function getArrowLabel(hint: FaceMovementHint, language: string): string {
  const isHindi = language === 'hindi';
  if (hint === 'left') return isHindi ? 'बाएं जाएं' : 'Move left';
  if (hint === 'right') return isHindi ? 'दाएं जाएं' : 'Move right';
  if (hint === 'up') return isHindi ? 'ऊपर जाएं' : 'Move up';
  if (hint === 'down') return isHindi ? 'नीचे जाएं' : 'Move down';
  return isHindi ? 'पास आएं' : 'Move closer';
}

function getLightTone(status: LightingStatus): 'good' | 'warn' {
  return status === 'good' ? 'good' : 'warn';
}

export function WebcamPreview({
  videoRef,
  faceDetector,
  permissionState,
  permissionStatusText,
  language,
  lightingStatus,
  lightingMessage,
  lightingTip,
  lightingDebug,
  showDebugPanel = false,
}: WebcamPreviewProps) {
  const isGranted = permissionState === 'granted';
  const showArrows = !faceDetector.isSuccess && faceDetector.movementHints.length > 0;
  const lightTone = getLightTone(lightingStatus);

  return (
    <div className="webcam-test-shell">
      {isGranted ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-video"
            aria-label="Camera preview for face detection"
          />
          <svg
            className={`webcam-ellipse-svg ${faceDetector.isSuccess ? 'state-success' : 'state-fail'}`}
            viewBox={`0 0 ${ELLIPSE_VIEWBOX.width} ${ELLIPSE_VIEWBOX.height}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              <mask id="webcam-ellipseMask">
                <rect width={ELLIPSE_VIEWBOX.width} height={ELLIPSE_VIEWBOX.height} fill="white" />
                <ellipse
                  cx={ELLIPSE_CX}
                  cy={ELLIPSE_CY}
                  rx={ELLIPSE_RX}
                  ry={ELLIPSE_RY}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width={ELLIPSE_VIEWBOX.width}
              height={ELLIPSE_VIEWBOX.height}
              fill="rgba(8,8,20,0.65)"
              mask="url(#webcam-ellipseMask)"
            />
            <ellipse
              id="ellipseRing"
              className={`webcam-ellipse-ring ${faceDetector.status === 'loading' ? 'animating' : ''}`}
              cx={ELLIPSE_CX}
              cy={ELLIPSE_CY}
              rx={ELLIPSE_RX}
              ry={ELLIPSE_RY}
              fill="none"
              stroke={faceDetector.isSuccess ? '#22c76a' : '#e83535'}
              strokeWidth={4}
              strokeDasharray={faceDetector.isSuccess ? '0' : '8 5'}
            />
            <circle
              className="focus-dot"
              cx={ELLIPSE_CX}
              cy={200}
              r={2.5}
              fill="rgba(255,255,255,0.25)"
            />
            <circle
              className="focus-dot"
              cx={ELLIPSE_CX}
              cy={400}
              r={2.5}
              fill="rgba(255,255,255,0.25)"
            />
            <line
              x1={127}
              y1={50}
              x2={127}
              y2={68}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
            <line
              x1={127}
              y1={50}
              x2={145}
              y2={50}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
            <line
              x1={473}
              y1={50}
              x2={455}
              y2={50}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
            <line
              x1={473}
              y1={50}
              x2={473}
              y2={68}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
            <line
              x1={127}
              y1={550}
              x2={127}
              y2={532}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
            <line
              x1={127}
              y1={550}
              x2={145}
              y2={550}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
            <line
              x1={473}
              y1={550}
              x2={455}
              y2={550}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
            <line
              x1={473}
              y1={550}
              x2={473}
              y2={532}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
          </svg>

          {showArrows && (
            <div className="webcam-direction-layer" aria-hidden>
              {faceDetector.movementHints.includes('up') && (
                <div className="webcam-direction-cue cue-up">↑</div>
              )}
              {faceDetector.movementHints.includes('down') && (
                <div className="webcam-direction-cue cue-down">↓</div>
              )}
              {faceDetector.movementHints.includes('left') && (
                <div className="webcam-direction-cue cue-left">←</div>
              )}
              {faceDetector.movementHints.includes('right') && (
                <div className="webcam-direction-cue cue-right">→</div>
              )}
              {faceDetector.movementHints.includes('forward') && (
                <div className="webcam-direction-cue cue-forward">⇢</div>
              )}
            </div>
          )}

          <div className={`webcam-light-pill ${lightTone}`} aria-live="polite">
            <span className="webcam-light-title">{lightingMessage}</span>
            {lightingTip && <span className="webcam-light-tip">{lightingTip}</span>}
          </div>

          <div className="webcam-instruction-card" aria-live="polite">
            <p className="webcam-instruction-text">{faceDetector.message}</p>
            {showArrows && (
              <p className="webcam-instruction-subtext">
                {faceDetector.movementHints.map(hint => getArrowLabel(hint, language)).join(' • ')}
              </p>
            )}
          </div>

          <div className="webcam-status-pill">
            <span
              className={`webcam-status-dot ${
                faceDetector.isSuccess
                  ? 'dot-success'
                  : faceDetector.status === 'no_face' || faceDetector.status === 'adjust'
                    ? 'dot-fail'
                    : 'dot-active'
              }`}
              aria-hidden
            />
            <span className="webcam-status-text">
              {faceDetector.status === 'loading' ? 'Loading models…' : faceDetector.message}
            </span>
          </div>

          {showDebugPanel && (
            <pre className="webcam-debug-panel" aria-label="Face and lighting debug panel">
              {`FACE
status: ${faceDetector.status}
message: ${faceDetector.message}
isSuccess: ${String(faceDetector.isSuccess)}
modelsLoaded: ${String(faceDetector.modelsLoaded)}
error: ${faceDetector.error ?? 'none'}
movementHints: ${faceDetector.movementHints.join(', ') || 'none'}
coverage: ${faceDetector.metrics ? faceDetector.metrics.coverage.toFixed(4) : 'n/a'}
offsetX: ${faceDetector.metrics ? faceDetector.metrics.offsetX.toFixed(4) : 'n/a'}
offsetY: ${faceDetector.metrics ? faceDetector.metrics.offsetY.toFixed(4) : 'n/a'}
totalFaces: ${faceDetector.debug.totalFaces}
validFaces: ${faceDetector.debug.validFaces}
bestScore: ${faceDetector.debug.bestDetectionScore?.toFixed(4) ?? 'n/a'}
faceEvalMs: ${faceDetector.debug.frameEvalMs?.toFixed(2) ?? 'n/a'}

LIGHT
status: ${lightingStatus}
message: ${lightingMessage}
tip: ${lightingTip || 'none'}
meanBrightness: ${lightingDebug.meanBrightness?.toFixed(2) ?? 'n/a'}
thresholdLow: ${lightingDebug.brightnessLow}
thresholdHigh: ${lightingDebug.brightnessHigh}
goodFrameCount: ${lightingDebug.goodFrameCount}
sampleIntervalMs: ${lightingDebug.sampleIntervalMs}`}
            </pre>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080814] text-[#7070a0]">
          <Camera className="mb-4 h-16 w-16" aria-hidden />
          <p className="text-sm font-medium">{permissionStatusText}</p>
        </div>
      )}
    </div>
  );
}
