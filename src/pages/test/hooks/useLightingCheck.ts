import { useEffect, useMemo, useRef, useState } from 'react';

import type { LightingDebugInfo, LightingStatus } from '../types/webcamTest';

const BRIGHTNESS_LOW = 80;
const BRIGHTNESS_HIGH = 215;
const GOOD_FRAMES_REQUIRED = 3;
const SAMPLE_INTERVAL_MS = 250;

type LightLabels = {
  idle: string;
  checking: string;
  lowLight: string;
  tooBright: string;
  good: string;
  lowLightTip: string;
  tooBrightTip: string;
  goodTip: string;
};

const LIGHT_LABELS: Record<'english' | 'hindi', LightLabels> = {
  english: {
    idle: 'Lighting check will start after camera access',
    checking: 'Checking room lighting...',
    lowLight: 'Room is too dark',
    tooBright: 'Room is too bright',
    good: 'Lighting is good',
    lowLightTip: 'Turn on a light in front of your face.',
    tooBrightTip: 'Reduce strong light behind you or close curtains.',
    goodTip: 'Great. Keep this lighting while starting calibration.',
  },
  hindi: {
    idle: 'कैमरा एक्सेस के बाद लाइटिंग जाँच शुरू होगी',
    checking: 'कमरे की रोशनी जाँची जा रही है...',
    lowLight: 'कमरे में रोशनी कम है',
    tooBright: 'कमरे में रोशनी बहुत तेज है',
    good: 'रोशनी ठीक है',
    lowLightTip: 'चेहरे के सामने वाली लाइट चालू करें।',
    tooBrightTip: 'पीछे की तेज रोशनी कम करें या पर्दे बंद करें।',
    goodTip: 'बहुत बढ़िया। कैलिब्रेशन शुरू करते समय यही रोशनी रखें।',
  },
};

function getMeanBrightness(video: HTMLVideoElement, canvas: HTMLCanvasElement): number | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  const roiWidth = Math.max(1, Math.floor(width * 0.5));
  const roiHeight = Math.max(1, Math.floor(height * 0.5));
  const roiX = Math.floor((width - roiWidth) / 2);
  const roiY = Math.floor((height - roiHeight) / 2);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(roiX, roiY, roiWidth, roiHeight).data;

  if (imageData.length === 0) return null;

  let total = 0;
  for (let i = 0; i < imageData.length; i += 4) {
    total += 0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2];
  }

  return total / (imageData.length / 4);
}

function classifyLighting(meanBrightness: number): Exclude<LightingStatus, 'idle' | 'checking'> {
  if (meanBrightness < BRIGHTNESS_LOW) return 'low_light';
  if (meanBrightness > BRIGHTNESS_HIGH) return 'too_bright';
  return 'good';
}

export function useLightingCheck(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  language: string
) {
  const [detectedStatus, setDetectedStatus] = useState<Exclude<LightingStatus, 'idle'>>('checking');
  const [isStableGood, setIsStableGood] = useState(false);
  const [meanBrightness, setMeanBrightness] = useState<number | null>(null);
  const [goodFrameCount, setGoodFrameCount] = useState(0);
  const goodFrameCountRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastSampleRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const labels = language === 'hindi' ? LIGHT_LABELS.hindi : LIGHT_LABELS.english;

  useEffect(() => {
    if (!enabled) {
      goodFrameCountRef.current = 0;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    queueMicrotask(() => {
      setDetectedStatus('checking');
      setIsStableGood(false);
    });
    goodFrameCountRef.current = 0;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const tick = (timestamp: number) => {
      const video = videoRef.current;
      if (!video || video.paused || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (timestamp - lastSampleRef.current < SAMPLE_INTERVAL_MS) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      lastSampleRef.current = timestamp;
      const meanBrightness = getMeanBrightness(video, canvasRef.current!);
      if (meanBrightness == null) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const nextStatus = classifyLighting(meanBrightness);
      setMeanBrightness(meanBrightness);
      setDetectedStatus(nextStatus);

      if (nextStatus === 'good') {
        goodFrameCountRef.current += 1;
        setGoodFrameCount(goodFrameCountRef.current);
        setIsStableGood(goodFrameCountRef.current >= GOOD_FRAMES_REQUIRED);
      } else {
        goodFrameCountRef.current = 0;
        setGoodFrameCount(0);
        setIsStableGood(false);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, videoRef]);

  const status: LightingStatus = enabled ? detectedStatus : 'idle';

  const message = useMemo(() => {
    if (status === 'idle') return labels.idle;
    if (status === 'checking') return labels.checking;
    if (status === 'low_light') return labels.lowLight;
    if (status === 'too_bright') return labels.tooBright;
    return labels.good;
  }, [labels, status]);

  const tip = useMemo(() => {
    if (status === 'low_light') return labels.lowLightTip;
    if (status === 'too_bright') return labels.tooBrightTip;
    if (status === 'good') return labels.goodTip;
    return '';
  }, [labels, status]);

  const debug: LightingDebugInfo = {
    meanBrightness,
    brightnessLow: BRIGHTNESS_LOW,
    brightnessHigh: BRIGHTNESS_HIGH,
    goodFrameCount,
    sampleIntervalMs: SAMPLE_INTERVAL_MS,
  };

  return {
    status,
    message,
    tip,
    isStableGood: enabled && isStableGood,
    debug,
  };
}
