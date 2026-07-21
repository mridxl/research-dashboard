/**
 * The assessments available in the research dashboard.
 *
 * Mirrors the internal dashboard's set minus INCLEN (DSM-IV), which is disabled
 * there and superseded by AIIMS Modified (DSM-5).
 *
 * `id` doubles as the API path segment and the Firestore key under
 * `research_sessions/{id}.assessments`, so these strings must stay in sync with
 * RESEARCH_ASSESSMENT_NAMES in middleware/app/schemas/research_assessments.py.
 */

export type ResearchAssessmentId =
  | 'evaluation'
  | 'isaa'
  | 'mchat_r'
  | 'cars2'
  | 'aiims'
  | 'vanderbilt'
  | 'dst';

/** Assessment ids that are persisted under `assessments` (excludes `evaluation`,
 *  which lives on `ground_truth`). */
export type StoredAssessmentId = Exclude<ResearchAssessmentId, 'evaluation'>;

export const STORED_ASSESSMENT_IDS: StoredAssessmentId[] = [
  'isaa',
  'mchat_r',
  'cars2',
  'aiims',
  'vanderbilt',
  'dst',
];

export interface ResearchAssessmentOption {
  id: ResearchAssessmentId;
  label: string;
  description: string;
}

export const RESEARCH_ASSESSMENT_OPTIONS: ResearchAssessmentOption[] = [
  {
    id: 'evaluation',
    label: 'Clinical evaluation',
    description: 'Ground-truth outcome labels and clinical notes',
  },
  {
    id: 'isaa',
    label: 'ISAA',
    description: 'Indian Scale for Assessment of Autism',
  },
  {
    id: 'mchat_r',
    label: 'M-CHAT-R',
    description: 'Modified Checklist for Autism in Toddlers, Revised',
  },
  {
    id: 'cars2',
    label: 'CARS2',
    description: 'Childhood Autism Rating Scale, 2nd Edition',
  },
  {
    id: 'aiims',
    label: 'AIIMS-INCLEN',
    description: 'AIIMS Modified INDT-ASD (DSM-5)',
  },
  {
    id: 'vanderbilt',
    label: 'Vanderbilt',
    description: 'Vanderbilt ADHD diagnostic rating scale',
  },
  {
    id: 'dst',
    label: 'DST',
    description: 'Developmental Screening Test (Bharath Raj)',
  },
];
