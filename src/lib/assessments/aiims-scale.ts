/**
 * AIIMS Modified INDT-ASD Diagnostic Evaluation for ASD (DSM-5).
 * Section A: sub-items with Ask, Observe; 0=No, 1=Yes, 2=Unsure.
 * Section B: B1–B9; B1,B2,B5,B6,B7 derived from Section A.
 */

export type AgeCondition = 'all' | '<4' | '>=4' | '>=6';

export interface AIIMSSectionAItem {
  key: string;
  askText: string;
  observeText: string;
  ageCondition: AgeCondition;
  /** For age-dependent items: alternate text for the other age group (shown for reference). */
  askTextAlt?: string;
  ageConditionAlt?: AgeCondition;
}

export const AIIMS_SECTION_A_ITEMS: AIIMSSectionAItem[] = [
  // A1a – Social emotional reciprocity
  {
    key: 'A1a_i',
    askText:
      'For children aged less than 4 years: Does/did your child ever point with his/her index finger to bring your attention to show the things that interest him/her? (e.g. kite, plane, cow/dog on the road.)',
    askTextAlt:
      'For children aged 4 years or more: Does your child usually bring things to show you on his/her own (e.g. things he/she has made, painted, or new toy/gift)?',
    ageCondition: '<4',
    ageConditionAlt: '>=4',
    observeText:
      'Observe how the child draws attention toward a toy/object of interest; look for coordinated pointing.',
  },
  {
    key: 'A1a_ii',
    askText:
      'For children aged 4 years or more, and able to speak: Does your child talk to you about things he/she likes or has achieved without being asked about them?',
    ageCondition: '>=4',
    observeText: '',
  },
  {
    key: 'A1a_iii',
    askText:
      'Does your child usually prefer to play alone and gets irritated/moves away when his/her siblings or other kids try to play with him/her?',
    ageCondition: 'all',
    observeText: 'Quality of play activity in a group of children or with siblings.',
  },
  {
    key: 'A1a_iv',
    askText:
      'Does your child play games involving turn taking or rule-based play with other children properly? (e.g. Cricket, Hide and seek, Ludo, Stapoo, Ring-a-ring roses.)',
    ageCondition: 'all',
    observeText:
      "Quality of child's involvement in rule-based games or games involving taking turns.",
  },
  {
    key: 'A1a_v',
    askText:
      'Does your child usually share his/her happiness with you or come to you for comfort when hurt or upset?',
    ageCondition: 'all',
    observeText: 'Sharing happiness or distress with the parents.',
  },
  {
    key: 'A1a_vi',
    askText:
      'For children aged 4 years or more: Does your child usually share your happiness or try to comfort you when you are upset/sad?',
    ageCondition: '>=4',
    observeText: "Sharing of parent's happiness or distress by the child.",
  },
  {
    key: 'A1a_vii',
    askText: 'Does your child initiate a conversation with you?',
    ageCondition: 'all',
    observeText: "Quality of child's conversation with parents or yourself.",
  },
  {
    key: 'A1a_viii',
    askText:
      'For children aged 4 years or more: Can you have a conversation with your child during which he/she not only answers your questions, but also adds something new to continue the conversation?',
    ageCondition: '>=4',
    observeText: "Quality of child's conversation with parents or yourself.",
  },
  // A1b – Non-verbal communication
  {
    key: 'A1b_i',
    askText:
      'For children aged less than 4 years: Does your child usually enjoy being taken in the lap or hugged? For children aged 4 years or more: When your child was a baby/toddler, did he/she enjoy being taken in the lap or hugged?',
    ageCondition: 'all',
    observeText:
      'In children below 4 years: Response to being touched and cuddled by parent: enjoys/tolerates/squirms/stiffens/gets upset/indifferent.',
  },
  {
    key: 'A1b_ii',
    askText:
      'Does your child usually make eye contact with you or other people? (e.g. while playing, asking for things, talking to you.)',
    ageCondition: 'all',
    observeText: 'Quality of eye contact.',
  },
  {
    key: 'A1b_iii',
    askText:
      'Does your child usually use various gestures appropriately during social interactions? (e.g. Namaste, Salaam, waving bye-bye, hello, touching feet — at least sometimes spontaneously.)',
    ageCondition: 'all',
    observeText: 'Use of these gestures in response to your greeting and while departing.',
  },
  {
    key: 'A1b_iv',
    askText:
      'Does your child usually show appropriate facial expressions according to the situation? (e.g. being happy, sad, afraid.)',
    ageCondition: 'all',
    observeText:
      'Appropriateness of facial expressions while interacting with parents, with you (stranger), while playing, when given toy/favorite food or when scolded.',
  },
  // A1c – Relationships
  {
    key: 'A1c_i',
    askText: 'Does your child usually enjoy the company of other children?',
    ageCondition: 'all',
    observeText: "Child's interaction with other children.",
  },
  {
    key: 'A1c_ii',
    askText:
      'For children aged 4 years or more: Does your child have friends of his/her age (in school and neighbourhood) with whom he/she loves to chat, share food or play together?',
    ageCondition: '>=4',
    observeText: "Quality of child's interaction with other children of his/her age.",
  },
  {
    key: 'A1c_iii',
    askText:
      'For children aged 4 years or more: Does your child play mostly with children who are much older or much younger than him/her?',
    ageCondition: '>=4',
    observeText: "Quality of child's interaction with other children.",
  },
  // A2a – Stereotyped movement or speech
  {
    key: 'A2a_i',
    askText:
      "Does your child usually repeat words or phrases regardless of meaning (in part or whole) that he/she has heard? (e.g. if you say 'toffee' he will also say 'toffee'; if you ask 'what is your name', he/she also says 'what is your name'.)",
    ageCondition: 'all',
    observeText: 'Immediate echolalia (words or phrases).',
  },
  {
    key: 'A2a_ii',
    askText:
      'Does he/she incessantly repeat things/T.V. serial dialogue regardless of meaning/context, whatever he/she has heard later on?',
    ageCondition: 'all',
    observeText: 'Delayed echolalia.',
  },
  {
    key: 'A2a_iii',
    askText:
      "For children aged 4 years or more: Does your child usually use 'I' for me and 'me' for you incorrectly? (e.g. when you ask 'do you want milk?' he/she says 'yes, you want milk' or 'Rohit wants milk' referring to himself.)",
    ageCondition: '>=4',
    observeText: 'Pronoun reversal.',
  },
  {
    key: 'A2a_iv',
    askText:
      "For children aged 4 years or more: During conversation does your child often speak 'out of context' or irrelevantly?",
    ageCondition: '>=4',
    observeText: 'Out-of-context speech and neologisms.',
  },
  {
    key: 'A2a_v',
    askText:
      'For children aged 6 years or more: Does your child understand that somebody is making fun of him/her or can he/she understand jokes?',
    ageCondition: '>=6',
    observeText: "Child's response to an age-appropriate joke.",
  },
  {
    key: 'A2a_vi',
    askText:
      'Does your child keep on repeating any of the following: flapping hands, hand wringing, toe-walking, rocking or spinning, making unusual finger or hand movements near his/her face?',
    ageCondition: 'all',
    observeText: 'Any type of motor stereotypes, unusual finger/hand movements near face.',
  },
  {
    key: 'A2a_vii',
    askText:
      'Does your child have inappropriate fascination with movement? (e.g. spinning wheels, opening and closing of doors, electric fan, running water and any other revolving object.)',
    ageCondition: 'all',
    observeText: "Child's inappropriate fascination with objects in motion.",
  },
  // A2b – Routines
  {
    key: 'A2b',
    askText:
      'Does your child unreasonably insist on doing things in a particular way and/or become upset if there is any change in the daily routine? (e.g. taking exactly the same route to school or market, insisting on food being served in the same pattern or sequence.)',
    ageCondition: 'all',
    observeText: "Child's insistence on any unusual routines or rituals.",
  },
  // A2c – Fixed interest
  {
    key: 'A2c',
    askText:
      'Does your child prefer to play with a particular part of a toy/object rather than the whole toy/object? (e.g. wheels of a toy rather than the whole toy.)',
    ageCondition: 'all',
    observeText: "Quality of child's play with different toys and objects.",
  },
  // A2d – Sensory symptoms
  {
    key: 'A2d_i',
    askText: 'Is your child indifferent to pain or temperature?',
    ageCondition: 'all',
    observeText: 'Apparent indifference to pain or temperature.',
  },
  {
    key: 'A2d_ii',
    askText: 'Does your child show excess reaction to specific sound or texture?',
    ageCondition: 'all',
    observeText: 'Getting irritated with certain specific sounds or texture of certain clothes.',
  },
  {
    key: 'A2d_iii',
    askText: 'Does your child have excessive smelling?',
    ageCondition: 'all',
    observeText: 'Excessive smelling of hands or arms.',
  },
  {
    key: 'A2d_iv',
    askText: 'Does your child have excessive touching of objects?',
    ageCondition: 'all',
    observeText: 'Excessive touching objects in the room.',
  },
];

export const AIIMS_SECTION_A_KEYS = AIIMS_SECTION_A_ITEMS.map(item => item.key);

export const AIIMS_RESPONSE_LABELS: Record<number, string> = {
  0: 'No',
  1: 'Yes',
  2: 'Unsure',
};

/** Section B: 1–8 are 0/1; 9 is string (additional notes). Complete based on Section A; all items user-entered. */
export const AIIMS_SECTION_B_ITEMS: { key: string; label: string }[] = [
  {
    key: '1',
    label:
      'No. of criteria fulfilled in A1 of the section A (Social Interaction and communication). 0: Two or less. 1: Three.',
  },
  {
    key: '2',
    label:
      'No. of criteria fulfilled in A2 of the section A (restrictive and repetitive). 0: Nil or one. 1: Two or more.',
  },
  {
    key: '3',
    label: 'Is there onset at early development? 0: No. 1: Yes.',
  },
  {
    key: '4',
    label: 'Is there an impaired functioning? 0: No. 1: Yes.',
  },
  {
    key: '5',
    label:
      'Interpretation of questionnaire (1 to 4). 0: No ASD (If response to any of 1-4 is "0"). 1: ASD present (If response to 1-4 is "1").',
  },
  {
    key: '6',
    label:
      'Total number of criteria fulfilled in A1 and A2 together. 0: Four or less. 1: Five or more.',
  },
  {
    key: '7',
    label:
      'Summary assessment of ASD. 0: No ASD (Response to 5 and 6 is "0"). 1: ASD (Response to 5 and 6 is "1" and 8 is "0").',
  },
  {
    key: '8',
    label: 'Can these symptoms be solely explained by Intellectual Disability? 0: No. 1: Yes.',
  },
  {
    key: '9',
    label: 'Additional note and observation during the interview',
  },
];

/** Domain prefixes for Section A (A1a, A1b, A1c, A2a, A2b, A2c, A2d). */
const AIIMS_A1_DOMAINS = ['A1a', 'A1b', 'A1c'] as const;
const AIIMS_A2_DOMAINS = ['A2a', 'A2b', 'A2c', 'A2d'] as const;

/**
 * Per-item scoring for domain fulfillment. Raw: 0=No, 1=Yes, 2=Unsure.
 * "no_abnormal": No=1 (counts), Yes=0, Unsure=0.
 * "yes_abnormal": Yes=1 (counts), No=0, Unsure=0.
 */
const AIIMS_FULFILLMENT: Record<string, 'no_abnormal' | 'yes_abnormal'> = {
  A1a_i: 'no_abnormal',
  A1a_ii: 'no_abnormal',
  A1a_iii: 'yes_abnormal',
  A1a_iv: 'no_abnormal',
  A1a_v: 'no_abnormal',
  A1a_vi: 'no_abnormal',
  A1a_vii: 'no_abnormal',
  A1a_viii: 'no_abnormal',
  A1b_i: 'no_abnormal',
  A1b_ii: 'no_abnormal',
  A1b_iii: 'no_abnormal',
  A1b_iv: 'no_abnormal',
  A1c_i: 'no_abnormal',
  A1c_ii: 'no_abnormal',
  A1c_iii: 'yes_abnormal',
  A2a_i: 'yes_abnormal',
  A2a_ii: 'yes_abnormal',
  A2a_iii: 'yes_abnormal',
  A2a_iv: 'yes_abnormal',
  A2a_v: 'yes_abnormal',
  A2a_vi: 'yes_abnormal',
  A2a_vii: 'yes_abnormal',
  A2b: 'yes_abnormal',
  A2c: 'yes_abnormal',
  A2d_i: 'yes_abnormal',
  A2d_ii: 'yes_abnormal',
  A2d_iii: 'yes_abnormal',
  A2d_iv: 'yes_abnormal',
};

/** Raw response (0=No, 1=Yes, 2=Unsure) -> score for fulfillment (0 or 1). */
function fulfillmentScore(key: string, raw: number): number {
  const rule = AIIMS_FULFILLMENT[key];
  if (!rule) return 0;
  if (rule === 'no_abnormal') return raw === 0 ? 1 : 0; // No counts
  return raw === 1 ? 1 : 0; // Yes counts
}

function domainFulfilled(section_a: Record<string, number>, domain: string): boolean {
  if (domain === 'A2b') return fulfillmentScore('A2b', section_a['A2b'] ?? -1) === 1;
  if (domain === 'A2c') return fulfillmentScore('A2c', section_a['A2c'] ?? -1) === 1;
  const prefix = domain + '_';
  return AIIMS_SECTION_A_KEYS.some(
    k => k.startsWith(prefix) && fulfillmentScore(k, section_a[k] ?? -1) === 1
  );
}

export function aiimsDomainFulfilled(section_a: Record<string, number>, domain: string): boolean {
  return domainFulfilled(section_a, domain);
}

export interface AIIMSSectionB {
  '1'?: number;
  '2'?: number;
  '3'?: number;
  '4'?: number;
  '5'?: number;
  '6'?: number;
  '7'?: number;
  '8'?: number;
  '9'?: string;
}

/**
 * Compute Section B from Section A and existing Section B.
 * B1, B2, B5, B6, B7 are derived; B3, B4, B8, B9 preserved from section_b.
 */
export function aiimsSectionBFromSectionA(
  section_a: Record<string, number>,
  section_b: AIIMSSectionB = {}
): AIIMSSectionB {
  const a1Count = AIIMS_A1_DOMAINS.filter(d => domainFulfilled(section_a, d)).length;
  const a2Count = AIIMS_A2_DOMAINS.filter(d => domainFulfilled(section_a, d)).length;
  const b1 = a1Count >= 3 ? 1 : 0;
  const b2 = a2Count >= 2 ? 1 : 0;
  const totalCriteria = a1Count + a2Count;
  const b6 = totalCriteria >= 5 ? 1 : 0;
  const b3 = section_b['3'] === 0 || section_b['3'] === 1 ? section_b['3'] : 0;
  const b4 = section_b['4'] === 0 || section_b['4'] === 1 ? section_b['4'] : 0;
  const b5 = b1 === 1 && b2 === 1 && b3 === 1 && b4 === 1 ? 1 : 0;
  const b8 = section_b['8'] === 0 || section_b['8'] === 1 ? section_b['8'] : 0;
  const b7 = b5 === 1 && b6 === 1 && b8 === 0 ? 1 : 0;
  return {
    '1': b1,
    '2': b2,
    '3': b3,
    '4': b4,
    '5': b5,
    '6': b6,
    '7': b7,
    '8': b8,
    '9': section_b['9'] ?? '',
  };
}

/**
 * ASD present: use B7 if section_b has it; else derive from section_a (A1a,A1b,A1c all fulfilled, ≥2 of A2).
 */
export function aiimsAsdPresent(
  section_a: Record<string, number>,
  section_b?: AIIMSSectionB | null
): boolean {
  if (section_b != null && (section_b['7'] === 0 || section_b['7'] === 1)) {
    return section_b['7'] === 1;
  }
  const a1Ok =
    domainFulfilled(section_a, 'A1a') &&
    domainFulfilled(section_a, 'A1b') &&
    domainFulfilled(section_a, 'A1c');
  const a2Count = AIIMS_A2_DOMAINS.filter(d => domainFulfilled(section_a, d)).length;
  return !!a1Ok && a2Count >= 2;
}

/**
 * Whether the item applies to the given age. ageYears can be number or parsed from string.
 */
export function aiimsItemAppliesToAge(
  item: AIIMSSectionAItem,
  ageYears: number | string | undefined
): boolean {
  if (ageYears === undefined || ageYears === null || ageYears === '') return true;
  const n = typeof ageYears === 'string' ? parseFloat(ageYears) : ageYears;
  if (Number.isNaN(n)) return true;
  if (item.ageCondition === 'all') return true;
  if (item.ageCondition === '<4') return n < 4;
  if (item.ageCondition === '>=4') return n >= 4;
  if (item.ageCondition === '>=6') return n >= 6;
  return true;
}
