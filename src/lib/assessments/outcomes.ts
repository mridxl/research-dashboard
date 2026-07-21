/**
 * Clinical evaluation outcome labels — the same set psychologists use on the
 * internal dashboard (Admin-frontend/src/lib/psych-eval-outcomes.ts).
 *
 * Trimmed for research: the report-paragraph generation (PSYCH_RESULT_SENTENCES,
 * mergePsychResultParagraphs and friends) is omitted because the research
 * dashboard produces no consultation reports.
 */

export type PsychEvalOutcome =
  | 'no_concerns'
  | 'asd_positive_broad'
  | 'asd_positive_direct'
  | 'adhd_standard'
  | 'adhd_mild'
  | 'sld'
  | 'odd_conduct'
  | 'intellectual_disability'
  | 'global_dev_delay'
  | 'epilepsy'
  | 'custom';

export type PsychEvalOutcomeGroup = {
  label: string;
  options: Array<{
    value: PsychEvalOutcome;
    label: string;
    description: string;
  }>;
};

export const PSYCH_EVAL_OUTCOME_GROUPS: PsychEvalOutcomeGroup[] = [
  {
    label: 'No Concerns',
    options: [
      {
        value: 'no_concerns',
        label: 'No Concerns',
        description: 'Screening reveals no significant traits or developmental concerns.',
      },
    ],
  },
  {
    label: 'ASD Positive',
    options: [
      {
        value: 'asd_positive_broad',
        label: 'Developmental Delay Framing',
        description: 'Broader, less label-forward opening before naming ASD.',
      },
      {
        value: 'asd_positive_direct',
        label: 'ASD-Specific Language',
        description: 'Names ASD directly with clearer language for the family.',
      },
    ],
  },
  {
    label: 'Non-ASD with Concerns',
    options: [
      {
        value: 'adhd_standard',
        label: 'ADHD / Attention (Standard)',
        description: 'Attention difficulties, hyperactivity, or both are clearly noted.',
      },
      {
        value: 'adhd_mild',
        label: 'ADHD / Attention (Mild)',
        description: 'Mild features or a monitoring-first approach is preferred.',
      },
      {
        value: 'sld',
        label: 'Specific Learning Difficulty',
        description: 'Difficulties concentrated in reading, writing, or numeracy.',
      },
      {
        value: 'odd_conduct',
        label: 'ODD / Conduct Disorder',
        description: 'Opposition, rule-following, aggression, or social conduct concerns.',
      },
      {
        value: 'intellectual_disability',
        label: 'Intellectual Disability',
        description: 'Concerns relate to cognitive functioning and/or adaptive skills.',
      },
      {
        value: 'global_dev_delay',
        label: 'Global Developmental Delay',
        description: 'Delays across multiple areas without a single specific diagnosis.',
      },
      {
        value: 'epilepsy',
        label: 'Epilepsy / Seizure-Related',
        description: 'History or observed episodes raise the possibility of seizure activity.',
      },
    ],
  },
];

export const PSYCH_EVAL_CUSTOM_GROUP: PsychEvalOutcomeGroup = {
  label: 'Custom',
  options: [
    {
      value: 'custom',
      label: 'Custom Paragraph',
      description:
        'Record the clinical conclusion in your own words. Selecting this clears all preset outcomes.',
    },
  ],
};

export const PSYCH_EVAL_OUTCOME_CONFLICT_PAIRS: Array<[PsychEvalOutcome, PsychEvalOutcome]> = [
  ['asd_positive_broad', 'asd_positive_direct'],
  ['adhd_standard', 'adhd_mild'],
];

export const CUSTOM_RESULT_PARAGRAPH_MAX_LENGTH = 4000;

export const PSYCH_EVAL_OUTCOME_LABELS: Record<PsychEvalOutcome, string> = {
  no_concerns: 'No Concerns',
  asd_positive_broad: 'ASD Positive (Developmental Delay)',
  asd_positive_direct: 'ASD Positive (Direct)',
  adhd_standard: 'ADHD / Attention (Standard)',
  adhd_mild: 'ADHD / Attention (Mild)',
  sld: 'Specific Learning Difficulty',
  odd_conduct: 'ODD / Conduct',
  intellectual_disability: 'Intellectual Disability',
  global_dev_delay: 'Global Developmental Delay',
  epilepsy: 'Epilepsy / Seizure-Related',
  custom: 'Custom',
};

/**
 * Labels for the legacy single-select `clinician_diagnosis` field, so sessions
 * labelled before the expanded outcome set still render a meaningful badge.
 */
export const LEGACY_DIAGNOSIS_LABELS: Record<string, string> = {
  autistic: 'Autistic (legacy)',
  not_autistic: 'Not autistic (legacy)',
  uncertain: 'Uncertain (legacy)',
};

export function getPsychEvalOutcomeLabel(outcome: string | null | undefined): string {
  if (!outcome) return '';
  return (
    PSYCH_EVAL_OUTCOME_LABELS[outcome as PsychEvalOutcome] ??
    LEGACY_DIAGNOSIS_LABELS[outcome] ??
    outcome
  );
}

/**
 * Multi-select toggle honouring the clinical selection rules: `custom` and
 * `no_concerns` are each exclusive, and conflicting pairs replace each other.
 * Mirrors togglePsychEvalOutcome in the internal dashboard.
 */
export function togglePsychEvalOutcome(
  current: PsychEvalOutcome[],
  code: PsychEvalOutcome
): PsychEvalOutcome[] {
  if (code === 'custom') {
    return current.includes('custom') ? [] : ['custom'];
  }

  let next = current.filter(value => value !== 'custom');

  if (code === 'no_concerns') {
    return next.includes('no_concerns') ? [] : ['no_concerns'];
  }

  next = next.filter(value => value !== 'no_concerns');

  if (next.includes(code)) {
    return next.filter(value => value !== code);
  }

  for (const [left, right] of PSYCH_EVAL_OUTCOME_CONFLICT_PAIRS) {
    if (code === left) next = next.filter(value => value !== right);
    if (code === right) next = next.filter(value => value !== left);
  }

  return [...next, code];
}
