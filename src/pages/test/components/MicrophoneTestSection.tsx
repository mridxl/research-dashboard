import type { PermissionState } from '../types/webcamTest';

export interface MicrophoneTestSectionProps {
  volume: number;
  permissionState: PermissionState;
  error: string;
  /** Optional translated labels (from parent based on fillup language) */
  translatedLabels?: {
    micTitle: string;
    micSpeak: string;
    micAfterPermission: string;
  };
}

const DEFAULT_LABELS = {
  micTitle: 'Microphone Test',
  micSpeak: 'Speak into the microphone and the volume level will be displayed below:',
  micAfterPermission: 'Microphone access will be enabled after granting permissions.',
};

export function MicrophoneTestSection({
  volume,
  permissionState,
  error,
  translatedLabels,
}: MicrophoneTestSectionProps) {
  const isGranted = permissionState === 'granted';
  const labels = translatedLabels ?? DEFAULT_LABELS;

  return (
    <div className="w-full text-center">
      <h2 className="mb-3 text-xl font-semibold text-foreground">{labels.micTitle}</h2>
      {isGranted ? (
        <>
          <p className="mb-6 leading-relaxed text-muted-foreground">{labels.micSpeak}</p>
          <div
            className="relative h-6 w-full overflow-hidden rounded-full border border-border bg-card"
            role="progressbar"
            aria-valuenow={Math.min(volume, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Microphone volume level"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-primary/80 shadow-sm transition-[width] duration-75"
              style={{ width: `${Math.min(volume, 100)}%` }}
            />
          </div>
        </>
      ) : (
        <p className="mb-6 leading-relaxed text-muted-foreground">{labels.micAfterPermission}</p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3" role="alert">
          <p className="text-sm font-medium text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
