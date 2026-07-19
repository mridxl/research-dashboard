/* eslint-disable @typescript-eslint/no-unused-vars */
/** Shared constraints + MediaRecorder options for screening session capture. */

export const SCREENING_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  /** Cap at 30 so driver does not negotiate 60 and overload SW encoder; ideal 30 for steady cadence. */
  frameRate: { ideal: 30, max: 30 },
};

/**
 * FPS-first MIME order: H.264/MP4 (usually HW on Chromium) → VP8 (lighter SW encode) → VP9 (better compression, heavier CPU) → generic WebM.
 * We do not list `video/webm;codecs=h264` — rarely supported for MediaRecorder output and non-standard; `isTypeSupported` is almost always false.
 */
const RECORDER_MIME_CANDIDATES = [
  'video/mp4;codecs=avc1',
  'video/mp4;codecs=avc1.42E01E',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9,opus',
  'video/webm',
] as const;

export function pickScreeningRecorderMimeType(): string {
  return RECORDER_MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported(m)) ?? '';
}

/** ~1.8 Mbps keeps encoder load lower on weaker machines while still preserving 1080p30 cadence. */
export const SCREENING_VIDEO_BITS_PER_SECOND = 1_800_000;

/** 64 kbps speech; audio less important than video for upload size. */
export const SCREENING_AUDIO_BITS_PER_SECOND = 64_000;

export function buildScreeningRecorderOptions(_stream: MediaStream): MediaRecorderOptions {
  const mimeType = pickScreeningRecorderMimeType();
  const opts: MediaRecorderOptions = {
    videoBitsPerSecond: SCREENING_VIDEO_BITS_PER_SECOND,
    audioBitsPerSecond: SCREENING_AUDIO_BITS_PER_SECOND,
  };
  if (mimeType) opts.mimeType = mimeType;
  return opts;
}

/** Some browsers reject audioBitsPerSecond or custom mime; degrade gracefully. */
export function createScreeningMediaRecorder(stream: MediaStream): MediaRecorder {
  const opts = buildScreeningRecorderOptions(stream);
  try {
    return new MediaRecorder(stream, opts);
  } catch {
    const { audioBitsPerSecond: _a, ...withoutAudioBitrate } = opts;
    try {
      return new MediaRecorder(stream, withoutAudioBitrate);
    } catch {
      const mimeType = pickScreeningRecorderMimeType();
      try {
        return new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond: SCREENING_VIDEO_BITS_PER_SECOND,
        });
      } catch {
        return new MediaRecorder(stream);
      }
    }
  }
}

export function blobTypeForRecordedChunks(recorderMimeType: string): string {
  if (recorderMimeType) return recorderMimeType;
  return 'video/webm';
}
