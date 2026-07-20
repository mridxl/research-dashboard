import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import Hls from 'hls.js';

import type { StimulusVersion } from '@/lib/api/research';
import { useTestStore } from '@/stores/testStore';

// Stimulus playlists per version: "1" = original AST video, "2" = new AST video
// (same URLs as core/dashboard post-7b14c62). Run N plays the session's stimulus_versions[N-1].
const STIMULUS_URLS: Record<StimulusVersion, Record<'english' | 'hindi', string>> = {
  '1': {
    english:
      'https://aignosis-test-videos.storage.googleapis.com/Test_Videos/ast%20eng%20vid%20hls%20format/playlist.m3u8',
    hindi:
      'https://aignosis-test-videos.storage.googleapis.com/Test_Videos/ast%20hindi%20vid%20hls%20format/playlist.m3u8',
  },
  '2': {
    english:
      'https://aignosis-test-videos.storage.googleapis.com/Test_Videos/new%20ast%20eng%20vid%20hls%20format/playlist.m3u8',
    hindi:
      'https://aignosis-test-videos.storage.googleapis.com/Test_Videos/new%20ast%20hindi%20vid%20hls%20format/playlist.m3u8',
  },
};

interface VideoPlayerProps {
  videoVersion: StimulusVersion;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ videoVersion, onPlay, onPause, onEnded }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const testData = useTestStore(s => s.testData);

    useImperativeHandle(ref, () => videoRef.current!, []);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const language = testData?.metadata?.video_language === 'hindi' ? 'hindi' : 'english';
      const videoSrc = STIMULUS_URLS[videoVersion][language];

      if (Hls.isSupported()) {
        const hls = new Hls();

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Fatal network error, attempting recovery...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Fatal media error, attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal error, cannot recover');
                hls.destroy();
                break;
            }
          }
        });

        hls.loadSource(videoSrc);
        hls.attachMedia(video);

        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;

        return () => {
          video.src = '';
          video.load();
        };
      }
    }, [testData?.metadata?.video_language, videoVersion]);

    return (
      <video
        ref={videoRef}
        autoPlay
        controls
        loop={false}
        playsInline
        className="object-contain w-full h-full"
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        style={{ position: 'fixed', top: 0, left: 0, zIndex: 10 }}
      />
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
