import { useState } from 'react';

import { toast } from 'sonner';

import type { AssessmentPatientInfo } from '@/lib/api/research';
import { patchSessionAssessment } from '@/lib/api/research';
import type { StoredAssessmentId } from '@/lib/assessments/registry';
import { handleApiError } from '@/lib/utils/errorHandler';

/**
 * Every assessment form takes the same shape. Session-scoped, unlike the
 * internal dashboard's test-scoped equivalents.
 */
export interface AssessmentFormProps<TData> {
  sessionId: string;
  existingData: TData | null;
  readOnly: boolean;
  onSave?: () => void;
}

export const defaultPatientInfo: AssessmentPatientInfo = {
  name: '',
  gender: 'Male',
  date_of_birth: '',
  assessment_date: new Date().toISOString().slice(0, 10),
  age: '',
  notes: '',
};

/**
 * Seed a form's patient info from the research session, so the psychologist is
 * not retyping details the session already holds. Session gender is lowercase
 * ('male'), the instruments use title case ('Male').
 */
export const patientInfoFromSession = (
  sessionPatient?: { name?: string; dob?: string; gender?: string } | null
): AssessmentPatientInfo => {
  if (!sessionPatient) return { ...defaultPatientInfo };

  const gender = (sessionPatient.gender ?? '').toLowerCase();
  return {
    ...defaultPatientInfo,
    name: sessionPatient.name ?? '',
    date_of_birth: sessionPatient.dob ?? '',
    gender: gender === 'female' ? 'Female' : gender === 'male' ? 'Male' : 'Others',
  };
};

/**
 * Shared save handling: validates the two fields every instrument requires,
 * PATCHes, and surfaces success/failure as a toast.
 */
export function useAssessmentSave(
  sessionId: string,
  assessmentId: StoredAssessmentId,
  label: string
) {
  const [isLoading, setIsLoading] = useState(false);

  const save = async (
    patientInfo: AssessmentPatientInfo,
    payload: Record<string, unknown>,
    onSave?: () => void
  ) => {
    if (!patientInfo.name?.trim()) {
      toast.error("Please enter the child's name");
      return;
    }
    if (!patientInfo.assessment_date?.trim()) {
      toast.error('Please enter the assessment date');
      return;
    }

    setIsLoading(true);
    try {
      await patchSessionAssessment(sessionId, assessmentId, {
        patient_info: { ...patientInfo, age: patientInfo.age ?? '' },
        ...payload,
      });
      toast.success(`${label} assessment saved`);
      onSave?.();
    } catch (error: unknown) {
      console.error(`Error saving ${label} assessment:`, error);
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return { save, isLoading };
}
