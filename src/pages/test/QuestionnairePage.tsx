import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { toast } from 'sonner';

import { Questionnaire, type QuestionnaireData } from '@/components/test/Questionnaire';
import { TestSubmitLoader } from '@/components/test/TestSubmitLoader';
import { submitResearchQuestionnaire } from '@/lib/api/research';
import { autismFacts } from '@/lib/constants/facts';
import { queryClient } from '@/lib/react-query/queryClient';
import { useTestStore } from '@/stores/testStore';

const NEW_FACT_INTERVAL = 7000;

export const QuestionnairePage = () => {
  const navigate = useNavigate();
  const testData = useTestStore(s => s.testData);
  const setTestData = useTestStore(s => s.setTestData);
  const uploadPromises = useTestStore(s => s.uploadPromises);
  const clearUploadPromises = useTestStore(s => s.clearUploadPromises);
  const uploadProgress = useTestStore(s => s.uploadProgress);

  const [factIndex, setFactIndex] = useState(0);
  const [submissionPhase, setSubmissionPhase] = useState<'upload' | 'questionnaire' | 'finishing'>(
    'upload'
  );
  const [isFormFilled, setIsFormFilled] = useState(false);
  const [queuedQuestionnaire, setQueuedQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [skippedQuestionnaire, setSkippedQuestionnaire] = useState(false);

  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (uploadPromises.length === 0 || !testData.session_id) {
      navigate('/dashboard', { replace: true });
    }
  }, [uploadPromises.length, testData.session_id, navigate]);

  // A resumed session may already have its questionnaire — the server allows
  // only one per session, so skip straight to awaiting the uploads.
  useEffect(() => {
    if (testData.questionnaire_completed && !isFormFilled) {
      setSkippedQuestionnaire(true);
      setIsFormFilled(true);
    }
  }, [testData.questionnaire_completed, isFormFilled]);

  useEffect(() => {
    if (isFormFilled) {
      const factInterval = setInterval(() => {
        setFactIndex(prevIndex => (prevIndex + 1) % autismFacts.length);
      }, NEW_FACT_INTERVAL);

      return () => clearInterval(factInterval);
    }
  }, [isFormFilled]);

  useEffect(() => {
    const processSubmission = async () => {
      if (uploadPromises.length === 0 || isProcessingRef.current || !testData.session_id) return;
      const isSkipped = skippedQuestionnaire && !queuedQuestionnaire;
      const hasQuestionnaire = Boolean(queuedQuestionnaire);
      if (!isFormFilled || (!isSkipped && !hasQuestionnaire)) return;

      isProcessingRef.current = true;

      try {
        setSubmissionPhase('upload');
        const uploadResponses = await Promise.all(uploadPromises);
        const lastTid = uploadResponses[uploadResponses.length - 1]?.tid;
        if (lastTid) {
          setTestData({ test_id: lastTid });
        }

        if (hasQuestionnaire && queuedQuestionnaire) {
          setSubmissionPhase('questionnaire');
          const questionnaireData = {
            ...queuedQuestionnaire,
            signsBefore3Years: queuedQuestionnaire.signsBefore3Years || '',
            strugglesDailyTasks: queuedQuestionnaire.strugglesDailyTasks || '',
          };
          await submitResearchQuestionnaire(testData.session_id, questionnaireData);
        } else {
          setSubmissionPhase('finishing');
        }

        // The session now has its uploads (and questionnaire); drop the cached
        // dashboard list so the completed session shows without a manual reload.
        void queryClient.invalidateQueries({ queryKey: ['researchSessions'] });

        clearUploadPromises();
        navigate('/test/thankyou', { replace: true });
      } catch (err) {
        console.error('Submission error:', err);
        toast.error('Failed to submit. Please try again.');
        clearUploadPromises();
        navigate('/test/error', { replace: true });
      } finally {
        isProcessingRef.current = false;
      }
    };

    processSubmission();
  }, [
    isFormFilled,
    queuedQuestionnaire,
    skippedQuestionnaire,
    uploadPromises,
    testData.session_id,
    setTestData,
    clearUploadPromises,
    navigate,
  ]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handleBackButton = () => {
      window.history.pushState(null, '', window.location.href);
      if (!isFormFilled) {
        toast.info('Please complete or skip the questionnaire before leaving.');
      }
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [isFormFilled]);

  if (uploadPromises.length === 0) {
    return null;
  }

  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-background">
      {!isFormFilled ? (
        <Questionnaire
          setIsFormFilled={setIsFormFilled}
          onFormCollected={data => setQueuedQuestionnaire(data)}
          onSkip={() => {
            setSkippedQuestionnaire(true);
            setIsFormFilled(true);
          }}
        />
      ) : (
        <TestSubmitLoader
          factIndex={factIndex}
          phase={submissionPhase}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  );
};
