import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';

import { useTestStore } from '@/stores/testStore';

interface TestRouteGuardProps {
  children: React.ReactNode;
}

export const TestRouteGuard = ({ children }: TestRouteGuardProps) => {
  const { testData } = useTestStore();
  const location = useLocation();

  const hasRequiredData =
    testData.patient_info.name.trim() !== '' &&
    testData.patient_info.dob.trim() !== '' &&
    testData.session_id !== null &&
    testData.session_id.trim() !== '' &&
    (testData.video_count === 1 || testData.video_count === 2);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasRequiredData) {
        event.preventDefault();
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasRequiredData]);

  if (!hasRequiredData) {
    return <Navigate to="/test/fillup" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
