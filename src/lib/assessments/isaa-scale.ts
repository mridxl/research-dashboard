/**
 * Indian Scale for Assessment of Autism (ISAA) – 40 items in 6 domains.
 * Rating: 1 = Rarely (up to 20%), 2 = Sometimes (21–40%), 3 = Frequently (41–60%),
 * 4 = Mostly (61–80%), 5 = Always (81–100%).
 */
export const ISAA_RATING_LABELS: Record<number, string> = {
  1: 'Rarely (up to 20%)',
  2: 'Sometimes (21–40%)',
  3: 'Frequently (41–60%)',
  4: 'Mostly (61–80%)',
  5: 'Always (81–100%)',
};

/** Short labels for compact scale row */
export const ISAA_RATING_SHORT: Record<number, string> = {
  1: 'Rarely',
  2: 'Sometimes',
  3: 'Frequently',
  4: 'Mostly',
  5: 'Always',
};

export type ISAAClassification = 'no_autism' | 'mild' | 'moderate' | 'severe';

export const ISAA_CLASSIFICATION_LABELS: Record<ISAAClassification, string> = {
  no_autism: 'No autism',
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
};

/**
 * Compute total score (sum of 40 item ratings) and classification from items.
 * < 70 = no autism, 70–106 = mild, 107–153 = moderate, > 153 = severe.
 */
export function isaaScoreFromItems(items: Record<string, number>): {
  total_score: number;
  classification: ISAAClassification;
} {
  let total = 0;
  for (let i = 1; i <= 40; i++) {
    total += items[String(i)] ?? 0;
  }
  let classification: ISAAClassification = 'no_autism';
  if (total >= 70 && total <= 106) classification = 'mild';
  else if (total >= 107 && total <= 153) classification = 'moderate';
  else if (total > 153) classification = 'severe';
  return { total_score: total, classification };
}

export interface ISAADomain {
  title: string;
  itemStart: number;
  itemEnd: number;
  statements: string[];
}

export const ISAA_DOMAINS: ISAADomain[] = [
  {
    title: 'Social relationship and reciprocity',
    itemStart: 1,
    itemEnd: 9,
    statements: [
      'Has poor eye contact',
      'Lacks social smile',
      'Remains aloof',
      'Does not reach out to others',
      'Unable to relate to people',
      'Unable to respond to social/ environmental cues',
      'Engages in solitary and repetitive play activities',
      'Unable to take turns in social interaction',
      'Does not maintain peer relationships',
    ],
  },
  {
    title: 'Emotional responsiveness',
    itemStart: 10,
    itemEnd: 14,
    statements: [
      'Shows inappropriate emotional response',
      'Shows exaggerated emotions',
      'Engages in self-stimulating emotions',
      'Lacks fear of danger',
      'Excited or agitated for no apparent reason',
    ],
  },
  {
    title: 'Speech, language and communication',
    itemStart: 15,
    itemEnd: 23,
    statements: [
      'Acquired speech and lost it',
      'Has difficulty in using non-verbal language or gestures to communicate',
      'Engages in stereotyped and repetitive use of language',
      'Engages in echolalic speech',
      'Produces infantile squeals/ unusual noises',
      'Unable to initiate or sustain conversation with others',
      'Uses jargon or meaningless words',
      'Uses pronoun reversals',
      'Unable to grasp pragmatics of communication (real meaning)',
    ],
  },
  {
    title: 'Behaviour patterns',
    itemStart: 24,
    itemEnd: 30,
    statements: [
      'Engages in stereotyped and repetitive motor mannerisms',
      'Shows attachment to inanimate objects',
      'Shows hyperactivity/ restlessness',
      'Exhibits aggressive behavior',
      'Throws temper tantrums',
      'Engages in self-injurious behavior',
      'Insists on sameness',
    ],
  },
  {
    title: 'Sensory aspects',
    itemStart: 31,
    itemEnd: 36,
    statements: [
      'Unusually sensitive to sensory stimuli',
      'Stares into space for long periods of time',
      'Has difficulty in tracking objects',
      'Has unusual vision',
      'Insensitive to pain',
      'Responds to objects/people unusually by smelling, touching or tasting',
    ],
  },
  {
    title: 'Cognitive component',
    itemStart: 37,
    itemEnd: 40,
    statements: [
      'Inconsistent attention and concentration',
      'Shows delay in responding',
      'Has unusual memory of some kind',
      "Has 'savant' ability",
    ],
  },
];
