/**
 * M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised) – 20 items.
 * Most items: YES = low likelihood (0), NO = elevated (1).
 * Items 2, 5, 12 are reverse-scored: NO = 0, YES = 1.
 */
export const MCHAT_R_REVERSE_ITEMS = new Set([2, 5, 12]);

export const MCHAT_R_QUESTIONS: string[] = [
  'If you point at something across the room, does your child look at it? (e.g. if you point at a toy or an animal, does your child look at the toy or animal?)',
  'Have you ever wondered if your child might be deaf?',
  'Does your child play pretend or make-believe? (e.g. pretend to drink from an empty cup, pretend to talk on a phone, or pretend to feed a doll or stuffed animal?)',
  'Does your child like climbing on things? (e.g. furniture, playground equipment, or stairs)',
  'Does your child make unusual finger movements near his or her eyes? (e.g. does your child wiggle his or her fingers close to his or her eyes?)',
  'Does your child point with one finger to ask for something or to get help? (e.g. pointing to a snack or toy that is out of reach)',
  'Does your child point with one finger to show you something interesting? (e.g. pointing to an airplane in the sky or a big truck in the road)',
  'Is your child interested in other children? (e.g. does your child watch other children, smile at them, or go to them?)',
  'Does your child show you things by bringing them to you or holding them up for you to see? Not just to get help, but to share? (e.g. showing you a flower, a stuffed animal, or a toy truck)',
  'Does your child respond when you call his or her name? (e.g. does he or she look up, talk or babble, or stop what he or she is doing when you call his or her name?)',
  'When you smile at your child, does he or she smile back at you?',
  'Does your child get upset by everyday noises? (e.g. does your child scream or cry to noise such as a vacuum cleaner or loud music?)',
  'Does your child walk?',
  'Does your child look you in the eye when you are talking to him or her, playing with him or her, or dressing him or her?',
  'Does your child try to copy what you do? (e.g. wave bye-bye, clap, or make a funny noise when you do)',
  'If you turn your head to look at something, does your child look around to see what you are looking at?',
  'Does your child try to get you to watch him or her? (e.g. does your child look at you for praise, or say “look” or “watch me”?)',
  "Does your child understand when you tell him or her to do something? (e.g. if you don't point, can your child understand “put the book on the chair” or “bring me the blanket”?)",
  'If something new happens, does your child look at your face to see how you feel about it? (e.g. if he or she hears a strange or funny noise, or sees a new toy, will he or she look at your face?)',
  'Does your child like movement activities? (e.g. being swung or bounced on your knee)',
];

export type MCHATRClassification = 'low' | 'moderate' | 'high';

export const MCHAT_R_CLASSIFICATION_LABELS: Record<MCHATRClassification, string> = {
  low: 'Low likelihood',
  moderate: 'Moderate likelihood',
  high: 'High likelihood',
};

/**
 * Compute total score (sum of 20 item scores 0/1) and classification.
 * 0–2 = low, 3–7 = moderate, 8–20 = high.
 */
export function mchatRScoreFromItems(items: Record<string, number>): {
  total_score: number;
  classification: MCHATRClassification;
} {
  let total = 0;
  for (let i = 1; i <= 20; i++) {
    total += items[String(i)] ?? 0;
  }
  let classification: MCHATRClassification = 'low';
  if (total >= 3 && total <= 7) classification = 'moderate';
  else if (total >= 8) classification = 'high';
  return { total_score: total, classification };
}

/**
 * Convert user selection (yes/no) to stored point (0 or 1) for an item.
 * Most items: yes -> 0, no -> 1. Reverse (2, 5, 12): yes -> 1, no -> 0.
 */
export function yesNoToPoint(itemNum: number, yesNo: 'yes' | 'no'): number {
  const isReverse = MCHAT_R_REVERSE_ITEMS.has(itemNum);
  if (yesNo === 'yes') return isReverse ? 1 : 0;
  return isReverse ? 0 : 1;
}

/**
 * Convert stored point (0 or 1) to user-facing yes/no for an item.
 */
export function pointToYesNo(itemNum: number, point: number): 'yes' | 'no' {
  const isReverse = MCHAT_R_REVERSE_ITEMS.has(itemNum);
  if (point === 1) return isReverse ? 'yes' : 'no';
  return isReverse ? 'no' : 'yes';
}
