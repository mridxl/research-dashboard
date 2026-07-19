import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

/**
 * Hook to manage audio level analysis from a media stream (e.g. microphone).
 * Returns current volume (0–255 scale) and start/stop analysis functions.
 */
export function useAudioAnalyser(): {
  volume: number;
  startAnalysis: (stream: MediaStream) => void;
  stopAnalysis: () => void;
} {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAnalysis = useCallback((stream: MediaStream) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    try {
      const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
      audioContextRef.current = new AudioContextCtor();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 32;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      intervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / bufferLength;
        setVolume(avg);
      }, 100);
    } catch (e) {
      console.warn('Audio analyser initialization failed:', e);
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setVolume(0);
  }, []);

  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  return { volume, startAnalysis, stopAnalysis };
}
