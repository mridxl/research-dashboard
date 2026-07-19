import { useTestStore } from '@/stores/testStore';

import type { FaceDetectorState } from '../types/webcamTest';

export interface PositioningGuideProps {
  faceDetector: FaceDetectorState;
}

const COVERAGE_THRESHOLD = 0.6;

const INSTRUCTIONS_EN = [
  { id: 1, text: 'Look directly into the camera' },
  { id: 2, text: 'Centre your face within the ellipse' },
  { id: 3, text: 'Move closer until your face fills ≥ 60% of the frame' },
  { id: 4, text: 'Hold still — border turns green when ready' },
] as const;

const INSTRUCTIONS_HI = [
  { id: 1, text: 'कैमरे की सीध में देखें' },
  { id: 2, text: 'अपना चेहरा अंडाकार के बीच में रखें' },
  { id: 3, text: 'तब तक पास आएं जब तक चेहरा फ्रेम का ≥ 60% न भर जाए' },
  { id: 4, text: 'स्थिर रहें — तैयार होने पर बॉर्डर हरा हो जाएगा' },
] as const;

const TITLES = {
  english: 'Positioning Guide',
  hindi: 'पोजिशनिंग गाइड',
} as const;

function getInstructions(lang: string) {
  return lang === 'hindi' ? INSTRUCTIONS_HI : INSTRUCTIONS_EN;
}

function getTitle(lang: string) {
  return lang === 'hindi' ? TITLES.hindi : TITLES.english;
}

function getActiveId(faceDetector: FaceDetectorState): number | null {
  if (faceDetector.isSuccess) return 4;
  const { metrics } = faceDetector;
  if (!metrics) return 1;
  if (metrics.coverage < COVERAGE_THRESHOLD) return 3;
  return 2;
}

export function PositioningGuide({ faceDetector }: PositioningGuideProps) {
  const activeId = getActiveId(faceDetector);
  const videoLanguage = useTestStore(s => s.testData.metadata.video_language) || 'english';
  const instructions = getInstructions(videoLanguage);
  const title = getTitle(videoLanguage);

  return (
    <aside
      className="webcam-instructions w-full shrink-0 lg:max-w-[300px]"
      aria-label="Positioning guide"
    >
      <h2 className="webcam-inst-title">{title}</h2>
      <ul className="webcam-inst-list">
        {instructions.map(({ id, text }) => (
          <li key={id} className={`webcam-inst-item ${activeId === id ? 'active' : ''}`}>
            <span className="webcam-inst-num">{String(id).padStart(2, '0')}</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
