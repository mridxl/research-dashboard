/**
 * NICHQ Vanderbilt ADHD Diagnostic Parent Rating Scale.
 * Items 1–9: Inattention. Items 10–18: Hyperactivity/Impulsivity. 0–3 scale.
 * Positive = 2 or 3. ADHD: 6+ positive in a domain + performance impairment.
 */
export const VANDERBILT_FREQUENCY_LABELS: Record<number, string> = {
  0: 'Never',
  1: 'Occasionally',
  2: 'Often',
  3: 'Very Often',
};

export const VANDERBILT_INATTENTION_ITEMS: { key: string; label: string }[] = [
  { key: '1', label: 'Does not pay attention to details or makes careless mistakes' },
  { key: '2', label: 'Has difficulty keeping attention to tasks/activities' },
  { key: '3', label: 'Does not seem to listen when spoken to directly' },
  { key: '4', label: 'Does not follow through on instructions / fails to finish work' },
  { key: '5', label: 'Has difficulty organizing tasks and activities' },
  {
    key: '6',
    label: 'Avoids or is reluctant to engage in tasks requiring sustained mental effort',
  },
  { key: '7', label: 'Loses things necessary for tasks or activities' },
  { key: '8', label: 'Is easily distracted by extraneous stimuli' },
  { key: '9', label: 'Is forgetful in daily activities' },
];

export const VANDERBILT_HYPERACTIVITY_ITEMS: { key: string; label: string }[] = [
  { key: '10', label: 'Fidgets with hands or feet or squirms in seat' },
  { key: '11', label: 'Leaves seat when remaining seated is expected' },
  { key: '12', label: 'Runs about or climbs excessively in inappropriate situations' },
  { key: '13', label: 'Has difficulty playing or engaging in leisure activities quietly' },
  { key: '14', label: 'Is "on the go" or acts as if "driven by a motor"' },
  { key: '15', label: 'Talks too much' },
  { key: '16', label: 'Blurts out answers before questions have been completed' },
  { key: '17', label: 'Has difficulty waiting his or her turn' },
  { key: '18', label: 'Interrupts or intrudes on others' },
];

export const VANDERBILT_PERFORMANCE_ITEMS: { key: string; label: string }[] = [
  { key: '1', label: 'Academic: Reading' },
  { key: '2', label: 'Academic: Mathematics' },
  { key: '3', label: 'Academic: Written expression' },
  { key: '4', label: 'Academic: Overall' },
  { key: '5', label: 'Behavioral: Relationship with parents' },
  { key: '6', label: 'Behavioral: Relationship with siblings' },
  { key: '7', label: 'Behavioral: Relationship with peers' },
  { key: '8', label: 'Behavioral: Participation in organized activities' },
];

export type VanderbiltClassification =
  | 'none'
  | 'predominantly_inattentive'
  | 'predominantly_hyperactive_impulsive'
  | 'combined';

export const VANDERBILT_CLASSIFICATION_LABELS: Record<VanderbiltClassification, string> = {
  none: 'No ADHD criteria met',
  predominantly_inattentive: 'Predominantly Inattentive',
  predominantly_hyperactive_impulsive: 'Predominantly Hyperactive/Impulsive',
  combined: 'Combined',
};

/** Positive = 2 or 3 */
function isPositive(v: number): boolean {
  return v === 2 || v === 3;
}

export function vanderbiltScoreFromItems(
  items: Record<string, number>,
  performance: Record<string, number>
): {
  inattention_count: number;
  hyperactivity_count: number;
  performance_impairment: boolean;
  classification: VanderbiltClassification;
} {
  let inattention_count = 0;
  for (let i = 1; i <= 9; i++) {
    if (isPositive(items[String(i)] ?? 0)) inattention_count++;
  }
  let hyperactivity_count = 0;
  for (let i = 10; i <= 18; i++) {
    if (isPositive(items[String(i)] ?? 0)) hyperactivity_count++;
  }
  const perfVals = [1, 2, 3, 4, 5, 6, 7, 8].map(i => performance[String(i)] ?? 0);
  const count4or5 = perfVals.filter(p => p >= 4).length;
  const has5 = perfVals.some(p => p === 5);
  const performance_impairment = count4or5 >= 2 || has5;

  let classification: VanderbiltClassification = 'none';
  if (inattention_count >= 6 && hyperactivity_count >= 6 && performance_impairment) {
    classification = 'combined';
  } else if (inattention_count >= 6 && hyperactivity_count < 6 && performance_impairment) {
    classification = 'predominantly_inattentive';
  } else if (inattention_count < 6 && hyperactivity_count >= 6 && performance_impairment) {
    classification = 'predominantly_hyperactive_impulsive';
  }
  return {
    inattention_count,
    hyperactivity_count,
    performance_impairment,
    classification,
  };
}
