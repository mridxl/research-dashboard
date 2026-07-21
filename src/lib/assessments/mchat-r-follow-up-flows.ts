/**
 * M-CHAT-R/F Follow-Up — flowchart logic for all 20 items (March 2025 protocol).
 *
 * Each item is administered only when its screening response was elevated.
 * The follow-up resolves each item to a score of 0 or 1 by walking the
 * flowchart in the official document. The interview screens positive when
 * two or more items score 1 on the follow-up.
 */

export type MostOften = 'zero' | 'one';

/**
 * All flowchart answers for one item, keyed by example / gate id.
 * Yes/No nodes store a boolean (true = "Yes"); free-text fields store a string.
 */
export type FUResponses = Record<string, boolean | string>;

export interface FUExample {
  id: string;
  label: string;
}

export interface FUGate {
  id: string;
  prompt: string;
}

export interface FUResolveResult {
  /** Resolved item score, or null when the flow is not yet complete. */
  score: 0 | 1 | null;
  /** True when the flow reached the "Yes to both 0 and 1" tiebreaker. */
  needsMostOften: boolean;
}

export interface FUItemFlow {
  itemNum: number;
  /** Original M-CHAT-R question text (child name substituted at render time). */
  question: string;
  /** "(FOR EXAMPLE, …)" helper text. */
  example?: string;
  /** Which screening answer triggers the follow-up. */
  screeningElevatedAnswer: 'yes' | 'no';
  /** Wording of the "You answered … or did not answer this question." line. */
  introAnswer: 'No' | 'Yes';
  /** Layout: single checklist or dual 0/1 example columns. */
  layout: 'single' | 'dual';
  /** Prompt shown above the checklist (e.g. "Does he/she usually…"). */
  examplesPrompt?: string;
  /** Optional helper note under the checklist. */
  examplesNote?: string;
  /** Single-layout examples. */
  examples?: FUExample[];
  /** Dual-layout 0-examples (pass-leaning). */
  zeroExamples?: FUExample[];
  /** Dual-layout 1-examples (fail-leaning). */
  oneExamples?: FUExample[];
  /** Sequential yes/no decision questions rendered after the checklist. */
  gates?: FUGate[];
  /** Human-readable scoring rule shown as a hint. */
  scoreRule: string;
  /** Whether a gate should be visible given current responses. */
  isGateVisible?: (gateId: string, r: FUResponses) => boolean;
  /** Resolve the item score from current responses. */
  resolve: (r: FUResponses, mostOften?: MostOften) => FUResolveResult;
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

const anyYes = (ids: FUExample[], r: FUResponses): boolean => ids.some(e => r[e.id] === true);
const allAnswered = (ids: FUExample[], r: FUResponses): boolean =>
  ids.every(e => r[e.id] !== undefined);
const countYes = (ids: FUExample[], r: FUResponses): number =>
  ids.filter(e => r[e.id] === true).length;
const gateAnswered = (id: string, r: FUResponses): boolean => r[id] !== undefined;
const gateYes = (id: string, r: FUResponses): boolean => r[id] === true;

const pending = (needsMostOften = false): FUResolveResult => ({ score: null, needsMostOften });
const scored = (score: 0 | 1, needsMostOften = false): FUResolveResult => ({
  score,
  needsMostOften,
});

/** Standard "0 examples vs 1 examples + most often" resolution (items 1, 10, 11, 16). */
function resolveDual(
  zero: FUExample[],
  one: FUExample[],
  r: FUResponses,
  mostOften?: MostOften
): FUResolveResult {
  if (!allAnswered(zero, r) || !allAnswered(one, r)) return pending();
  const z = countYes(zero, r);
  const o = countYes(one, r);
  if (z > 0 && o === 0) return scored(0);
  if (o > 0 && z === 0) return scored(1);
  if (z === 0 && o === 0) return scored(1);
  // Yes to both → ask which happens most often
  if (mostOften === 'zero') return scored(0, true);
  if (mostOften === 'one') return scored(1, true);
  return pending(true);
}

/** "Yes to any → 0, No to all → 1" single checklist (items 3, 4, 17, 20). */
function resolveAnyYesPass(ids: FUExample[], r: FUResponses): FUResolveResult {
  if (anyYes(ids, r)) return scored(0);
  if (allAnswered(ids, r)) return scored(1);
  return pending();
}

/** "Yes to two or more → 0, else → 1" single checklist (items 14, 15). */
function resolveCountTwo(ids: FUExample[], r: FUResponses): FUResolveResult {
  if (countYes(ids, r) >= 2) return scored(0);
  if (allAnswered(ids, r)) return scored(1);
  return pending();
}

// ---------------------------------------------------------------------------
// Item definitions
// ---------------------------------------------------------------------------

const item1Zero: FUExample[] = [
  { id: 'i1_look_object', label: 'Look at object?' },
  { id: 'i1_point_object', label: 'Point to object?' },
  { id: 'i1_look_comment', label: 'Look and comment on object?' },
  { id: 'i1_look_if_say', label: 'Look if you point and say "look!"?' },
];
const item1One: FUExample[] = [
  { id: 'i1_ignores', label: 'Ignores you?' },
  { id: 'i1_look_random', label: 'Look around room randomly?' },
  { id: 'i1_look_finger', label: 'Look at your finger?' },
];

const item2Examples: FUExample[] = [
  { id: 'i2_ignore_sounds', label: 'Often ignore sounds?' },
  { id: 'i2_ignore_people', label: 'Often ignore people?' },
];

const item3Examples: FUExample[] = [
  { id: 'i3_drink_cup', label: 'Pretend to drink from a toy cup?' },
  { id: 'i3_eat_spoon', label: 'Pretend to eat from a toy spoon or fork?' },
  { id: 'i3_talk_phone', label: 'Pretend to talk on the telephone?' },
  { id: 'i3_feed_doll', label: 'Pretend to feed a doll or stuffed animal?' },
  { id: 'i3_push_car', label: 'Push a car as if going along a pretend road?' },
  {
    id: 'i3_be_character',
    label: 'Pretend to be a robot, airplane, ballerina, or favorite character?',
  },
  { id: 'i3_toy_pot', label: 'Put a toy pot on a pretend stove?' },
  { id: 'i3_stir_food', label: 'Stir imaginary food?' },
  { id: 'i3_driver', label: 'Put a doll/action figure in a car as the driver or passenger?' },
  { id: 'i3_vacuum', label: 'Pretend to vacuum, sweep, or mow the lawn?' },
  { id: 'i3_other', label: 'Other pretend play?' },
];

const item4Examples: FUExample[] = [
  { id: 'i4_stairs', label: 'Stairs?' },
  { id: 'i4_chairs', label: 'Chairs?' },
  { id: 'i4_furniture', label: 'Furniture?' },
  { id: 'i4_playground', label: 'Playground equipment?' },
];

const item5Zero: FUExample[] = [
  { id: 'i5_look_hands', label: 'Look at hands?' },
  { id: 'i5_peekaboo', label: 'Move fingers when playing peek-a-boo?' },
];
const item5One: FUExample[] = [
  { id: 'i5_wiggle_eyes', label: 'Wiggle fingers near his/her eyes?' },
  { id: 'i5_hold_close', label: 'Hold hands up close to his/her eyes?' },
  { id: 'i5_hold_side', label: 'Hold hands off to the side of his/her eyes?' },
  { id: 'i5_flap_face', label: 'Flap hands near his/her face?' },
];

const item6Examples: FUExample[] = [
  { id: 'i6_reach', label: 'Reach for the object with his/her whole hand?' },
  { id: 'i6_lead', label: 'Lead you to the object?' },
  { id: 'i6_get_self', label: 'Try to get the object for him/herself?' },
  { id: 'i6_words', label: 'Ask for it using words or sounds?' },
];

const item7Examples: FUExample[] = [
  { id: 'i7_airplane', label: 'An airplane in the sky?' },
  { id: 'i7_truck', label: 'A truck on the road?' },
  { id: 'i7_bug', label: 'A bug on the ground?' },
  { id: 'i7_animal', label: 'An animal in the yard?' },
];

const item8Examples: FUExample[] = [
  { id: 'i8_play', label: 'Play with another child?' },
  { id: 'i8_talk', label: 'Talk to another child?' },
  { id: 'i8_babble', label: 'Babble or make vocal noises?' },
  { id: 'i8_watch', label: 'Watch another child?' },
  { id: 'i8_smile', label: 'Smile at another child?' },
  { id: 'i8_shy', label: 'Act shy at first but then smile?' },
  { id: 'i8_excited', label: 'Get excited about another child?' },
];

const item9Examples: FUExample[] = [
  { id: 'i9_picture', label: 'A picture or toy just to show you?' },
  { id: 'i9_drawing', label: 'A drawing he/she has done?' },
  { id: 'i9_flower', label: 'A flower he/she has picked?' },
  { id: 'i9_bug', label: 'A bug found in the grass?' },
  { id: 'i9_blocks', label: 'A few blocks put together?' },
];

const item10Zero: FUExample[] = [
  { id: 'i10_look_up', label: 'Look up?' },
  { id: 'i10_talk', label: 'Talk or babble?' },
  { id: 'i10_stop', label: 'Stop what he/she is doing?' },
];
const item10One: FUExample[] = [
  { id: 'i10_no_response', label: 'Make no response?' },
  { id: 'i10_ignore', label: 'Seem to hear but ignores parent?' },
  { id: 'i10_only_face', label: 'Respond only if parent is right in front of his/her face?' },
  { id: 'i10_only_touch', label: 'Respond only if touched?' },
];

const item11Zero: FUExample[] = [
  { id: 'i11_smile_smile', label: 'Smile when you smile?' },
  { id: 'i11_enter', label: 'Smile when you enter the room?' },
  { id: 'i11_return', label: 'Smile when you return from being away?' },
];
const item11One: FUExample[] = [
  { id: 'i11_always', label: 'Always smile?' },
  { id: 'i11_toy', label: 'Smile at a favorite toy or activity?' },
  { id: 'i11_random', label: 'Smile randomly or at nothing in particular?' },
];

const item12Noises: FUExample[] = [
  { id: 'i12_washer', label: 'A washing machine?' },
  { id: 'i12_crying', label: 'Babies crying?' },
  { id: 'i12_vacuum', label: 'Vacuum cleaner?' },
  { id: 'i12_hairdryer', label: 'Hairdryer?' },
  { id: 'i12_traffic', label: 'Traffic?' },
  { id: 'i12_squealing', label: 'Babies squealing or screeching?' },
  { id: 'i12_music', label: 'Loud music?' },
  { id: 'i12_phone', label: 'Telephone / doorbell ringing?' },
  { id: 'i12_noisy_place', label: 'Noisy places such as a supermarket or restaurant?' },
  { id: 'i12_other', label: 'Other (describe)?' },
];

/** Free-text key paired with the item 12 "Other (describe)" Yes/No node. */
export const ITEM12_OTHER_TEXT_ID = 'i12_other_text';
const item12ReactZero: FUExample[] = [
  { id: 'i12_calm_cover', label: 'Calmly cover his/her ears?' },
  { id: 'i12_tell', label: 'Tell you he/she does not like the noise?' },
];
const item12ReactOne: FUExample[] = [
  { id: 'i12_scream', label: 'Scream?' },
  { id: 'i12_cry', label: 'Cry?' },
  { id: 'i12_cover_upset', label: 'Cover his/her ears while upset?' },
];

const item14Examples: FUExample[] = [
  { id: 'i14_need', label: 'When he/she needs something?' },
  { id: 'i14_play', label: 'When you are playing with him/her?' },
  { id: 'i14_feed', label: 'During feeding?' },
  { id: 'i14_diaper', label: 'During diaper changes?' },
  { id: 'i14_story', label: 'When you are reading a story?' },
  { id: 'i14_talk', label: 'When you are talking to him/her?' },
];

const item15Examples: FUExample[] = [
  { id: 'i15_tongue', label: 'Stick out your tongue?' },
  { id: 'i15_sound', label: 'Make a funny sound?' },
  { id: 'i15_wave', label: 'Wave good bye?' },
  { id: 'i15_clap', label: 'Clap your hands?' },
  { id: 'i15_shhh', label: 'Put your fingers to your lips to signal "Shhh"?' },
  { id: 'i15_kiss', label: 'Blow a kiss?' },
];

const item16Zero: FUExample[] = [
  { id: 'i16_look_toward', label: 'Look toward the thing you are looking at?' },
  { id: 'i16_point_toward', label: 'Point toward the thing you are looking at?' },
  { id: 'i16_look_around', label: 'Look around to see what you are looking at?' },
];
const item16One: FUExample[] = [
  { id: 'i16_ignore', label: 'Ignore you?' },
  { id: 'i16_look_face', label: 'Look at your face?' },
];

const item17Examples: FUExample[] = [
  { id: 'i17_look_watch', label: 'Say "Look!" or "Watch me!"?' },
  { id: 'i17_babble', label: 'Babble or make a noise to get you to watch?' },
  { id: 'i17_praise', label: 'Look at you to get praise or comment?' },
  { id: 'i17_keep_looking', label: 'Keep looking to see if you are looking?' },
];

const item18Examples: FUExample[] = [
  { id: 'i18_shoe', label: 'If you say "Show me your shoe" (no gestures), does he/she show it?' },
  {
    id: 'i18_blanket',
    label: 'If you say "Bring me the blanket" (no gestures), does he/she bring it?',
  },
  {
    id: 'i18_book',
    label: 'If you say "Put the book on the chair" (no hints), does he/she do it?',
  },
];

const item20Examples: FUExample[] = [
  { id: 'i20_laugh', label: 'Laugh or smile?' },
  { id: 'i20_talk', label: 'Talk or babble?' },
  { id: 'i20_request', label: 'Request more by holding out his/her arms?' },
];

export const MCHAT_R_FOLLOW_UP_FLOWS: Record<number, FUItemFlow> = {
  1: {
    itemNum: 1,
    question: 'If you point at something across the room, does {name} look at it?',
    example: 'if you point at a toy or an animal, does your child look at the toy or animal?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'dual',
    examplesPrompt: 'Does he/she …',
    zeroExamples: item1Zero,
    oneExamples: item1One,
    scoreRule:
      'Yes only to 0 examples → 0 · Yes only to 1 (or none) → 1 · Yes to both → most often.',
    resolve: (r, mo) => resolveDual(item1Zero, item1One, r, mo),
  },
  2: {
    itemNum: 2,
    question: 'Have you ever wondered if {name} might be deaf?',
    screeningElevatedAnswer: 'yes',
    introAnswer: 'Yes',
    layout: 'single',
    examplesPrompt: 'What led you to wonder that? Does he/she…',
    examples: item2Examples,
    scoreRule: 'No to both → 0 · Yes to either → 1.',
    resolve: r => {
      if (anyYes(item2Examples, r)) return scored(1);
      if (allAnswered(item2Examples, r)) return scored(0);
      return pending();
    },
  },
  3: {
    itemNum: 3,
    question: 'Does {name} play pretend or make-believe?',
    example: 'pretend to drink from an empty cup, talk on a phone, or feed a doll',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt: 'Does he/she usually…',
    examples: item3Examples,
    scoreRule: 'Yes to any → 0 · No to all → 1.',
    resolve: r => resolveAnyYesPass(item3Examples, r),
  },
  4: {
    itemNum: 4,
    question: 'Does {name} like climbing on things?',
    example: 'furniture, playground equipment, or stairs',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt: 'Does he/she enjoy climbing on…',
    examples: item4Examples,
    scoreRule: 'Yes to any → 0 · No to all → 1.',
    resolve: r => resolveAnyYesPass(item4Examples, r),
  },
  5: {
    itemNum: 5,
    question: 'Does {name} make unusual finger movements near his/her eyes?',
    example: 'does your child wiggle his or her fingers close to his or her eyes?',
    screeningElevatedAnswer: 'yes',
    introAnswer: 'Yes',
    layout: 'dual',
    examplesPrompt: 'Does he/she …',
    zeroExamples: item5Zero,
    oneExamples: item5One,
    gates: [{ id: 'i5_twice_week', prompt: 'Does this happen more than twice a week?' }],
    scoreRule:
      'Only 0 examples (no 1 items) → 0 · No to all → 0 · Any 1 example → ask frequency: more than twice/week? Yes → 1, No → 0.',
    isGateVisible: (id, r) => id === 'i5_twice_week' && anyYes(item5One, r),
    resolve: r => {
      if (anyYes(item5One, r)) {
        if (!gateAnswered('i5_twice_week', r)) return pending();
        return scored(gateYes('i5_twice_week', r) ? 1 : 0);
      }
      if (anyYes(item5Zero, r)) return scored(0);
      if (allAnswered([...item5Zero, ...item5One], r)) return scored(0);
      return pending();
    },
  },
  6: {
    itemNum: 6,
    question: 'Does {name} point with one finger to ask for something or to get help?',
    example: 'pointing to a snack or toy that is out of reach',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt:
      'If something he/she wants is out of reach, how does he/she get it? Does he/she…',
    examples: item6Examples,
    gates: [{ id: 'i6_show_me', prompt: 'If you said "Show me," would he/she point at it?' }],
    scoreRule: 'Yes to any → ask "Show me" point: Yes → 0, No → 1 · No to all → 0.',
    isGateVisible: (id, r) => id === 'i6_show_me' && anyYes(item6Examples, r),
    resolve: r => {
      if (anyYes(item6Examples, r)) {
        if (!gateAnswered('i6_show_me', r)) return pending();
        return scored(gateYes('i6_show_me', r) ? 0 : 1);
      }
      if (allAnswered(item6Examples, r)) return scored(0);
      return pending();
    },
  },
  7: {
    itemNum: 7,
    question: 'Does {name} point with one finger to show you something interesting?',
    example: 'pointing to an airplane in the sky or a big truck in the road',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt: 'Does your child sometimes want you to see something interesting such as…',
    examples: item7Examples,
    gates: [
      {
        id: 'i7_show_interest',
        prompt: 'Would he/she point with one finger to show interest (not to get help)?',
      },
    ],
    scoreRule:
      'Yes to any → point to show interest (not help)? Yes/both → 0, No → 1 · No to all → 1.',
    isGateVisible: (id, r) => id === 'i7_show_interest' && anyYes(item7Examples, r),
    resolve: r => {
      if (anyYes(item7Examples, r)) {
        if (!gateAnswered('i7_show_interest', r)) return pending();
        return scored(gateYes('i7_show_interest', r) ? 0 : 1);
      }
      if (allAnswered(item7Examples, r)) return scored(1);
      return pending();
    },
  },
  8: {
    itemNum: 8,
    question: 'Is {name} interested in other children?',
    example: 'does your child watch other children, smile at them, or go to them?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt: 'Does your child…',
    examples: item8Examples,
    gates: [
      {
        id: 'i8_respond_half',
        prompt:
          'At the playground or supermarket, does he/she respond to other (non-sibling) children more than half the time?',
      },
    ],
    scoreRule: 'Yes to any → responds more than half the time? Yes → 0, No → 1 · No to all → 1.',
    isGateVisible: (id, r) => id === 'i8_respond_half' && anyYes(item8Examples, r),
    resolve: r => {
      if (anyYes(item8Examples, r)) {
        if (!gateAnswered('i8_respond_half', r)) return pending();
        return scored(gateYes('i8_respond_half', r) ? 0 : 1);
      }
      if (allAnswered(item8Examples, r)) return scored(1);
      return pending();
    },
  },
  9: {
    itemNum: 9,
    question:
      'Does {name} show you things by bringing them to you or holding them up for you to see? Not just to get help, but to share?',
    example: 'showing you a flower, a stuffed animal, or a toy truck',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt: 'Does your child sometimes bring you…',
    examples: item9Examples,
    gates: [{ id: 'i9_just_show', prompt: 'Is this sometimes just to show you, not to get help?' }],
    scoreRule: 'Yes to any → just to show (not help)? Yes → 0, No → 1 · No to all → 1.',
    isGateVisible: (id, r) => id === 'i9_just_show' && anyYes(item9Examples, r),
    resolve: r => {
      if (anyYes(item9Examples, r)) {
        if (!gateAnswered('i9_just_show', r)) return pending();
        return scored(gateYes('i9_just_show', r) ? 0 : 1);
      }
      if (allAnswered(item9Examples, r)) return scored(1);
      return pending();
    },
  },
  10: {
    itemNum: 10,
    question: 'Does {name} respond when you call his/her name?',
    example: 'does he or she look up, talk or babble, or stop what he or she is doing?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'dual',
    examplesPrompt: 'When you call his/her name, does he/she …',
    zeroExamples: item10Zero,
    oneExamples: item10One,
    scoreRule: 'Yes only to 0 → 0 · Yes only to 1 (or none) → 1 · Yes to both → most often.',
    resolve: (r, mo) => resolveDual(item10Zero, item10One, r, mo),
  },
  11: {
    itemNum: 11,
    question: 'When you smile at {name}, does he/she smile back at you?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'dual',
    examplesPrompt: 'What makes him/her smile?',
    zeroExamples: item11Zero,
    oneExamples: item11One,
    scoreRule: 'Yes only to 0 → 0 · Yes only to 1 (or none) → 1 · Yes to both → most often.',
    resolve: (r, mo) => resolveDual(item11Zero, item11One, r, mo),
  },
  12: {
    itemNum: 12,
    question: 'Does {name} get upset by everyday noises?',
    example: 'does your child scream or cry to a vacuum cleaner or loud music?',
    screeningElevatedAnswer: 'yes',
    introAnswer: 'Yes',
    layout: 'dual',
    examplesPrompt: 'Does your child have a negative reaction to the sound of…',
    // Noise checklist rendered as the "zero" list visually; reactions appear after 2+.
    zeroExamples: item12Noises,
    oneExamples: [],
    gates: [],
    scoreRule:
      'Negative reaction to fewer than 2 noises → 0. With 2+ noises, score the reaction: only calm (0) → 0, screaming/crying (1) → 1, both → most often.',
    isGateVisible: () => false,
    resolve: (r, mo) => {
      if (countYes(item12Noises, r) >= 2) {
        return resolveDual(item12ReactZero, item12ReactOne, r, mo);
      }
      if (allAnswered(item12Noises, r)) return scored(0);
      return pending();
    },
  },
  13: {
    itemNum: 13,
    question: 'Does {name} walk?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examples: [],
    gates: [{ id: 'i13_walk_alone', prompt: 'Does he/she walk without holding on to anything?' }],
    scoreRule: 'Walks without holding on? Yes → 0, No → 1.',
    resolve: r => {
      if (!gateAnswered('i13_walk_alone', r)) return pending();
      return scored(gateYes('i13_walk_alone', r) ? 0 : 1);
    },
  },
  14: {
    itemNum: 14,
    question: 'Does {name} look you in the eye when you are talking, playing, or dressing him/her?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt: 'Does he/she look you in the eye…',
    examples: item14Examples,
    scoreRule: 'Yes to two or more → 0 · Yes to one or none → 1.',
    resolve: r => resolveCountTwo(item14Examples, r),
  },
  15: {
    itemNum: 15,
    question: 'Does {name} try to copy what you do?',
    example: 'wave bye-bye, clap, or make a funny noise when you do',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt: 'Does your child try to copy you if you…',
    examples: item15Examples,
    scoreRule: 'Yes to two or more → 0 · Yes to one or none → 1.',
    resolve: r => resolveCountTwo(item15Examples, r),
  },
  16: {
    itemNum: 16,
    question:
      'If you turn your head to look at something, does {name} look around to see what you are looking at?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'dual',
    examplesPrompt: 'What does he/she do when you turn to look at something?',
    zeroExamples: item16Zero,
    oneExamples: item16One,
    scoreRule: 'Yes only to 0 → 0 · Yes only to 1 (or none) → 1 · Yes to both → most often.',
    resolve: (r, mo) => resolveDual(item16Zero, item16One, r, mo),
  },
  17: {
    itemNum: 17,
    question: 'Does {name} try to get you to watch him/her?',
    example: 'does your child look at you for praise, or say "look" or "watch me"?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt: 'Does he/she…',
    examples: item17Examples,
    scoreRule: 'Yes to any → 0 · Yes to none → 1.',
    resolve: r => resolveAnyYesPass(item17Examples, r),
  },
  18: {
    itemNum: 18,
    question: 'Does {name} understand when you tell him/her to do something?',
    example: 'without pointing, can your child understand "put the book on the chair"?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt:
      'When the situation gives no clues, can he/she follow a command? (ask until you get a Yes or use all examples)',
    examples: item18Examples,
    gates: [
      {
        id: 'i18_dinner',
        prompt:
          'If it is dinnertime and food is on the table and you tell him/her to sit down, will he/she come sit?',
      },
    ],
    scoreRule: 'Yes to any no-clue command → 0 · No to all → dinnertime sit? Yes → 0, No → 1.',
    isGateVisible: (id, r) =>
      id === 'i18_dinner' && allAnswered(item18Examples, r) && !anyYes(item18Examples, r),
    resolve: r => {
      if (anyYes(item18Examples, r)) return scored(0);
      if (allAnswered(item18Examples, r)) {
        if (!gateAnswered('i18_dinner', r)) return pending();
        return scored(gateYes('i18_dinner', r) ? 0 : 1);
      }
      return pending();
    },
  },
  19: {
    itemNum: 19,
    question:
      'If something new happens, does {name} look at your face to see how you feel about it?',
    example:
      'if he or she hears a strange noise or sees a new toy, will he or she look at your face?',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examples: [],
    gates: [
      {
        id: 'i19_scary_noise',
        prompt:
          'If he/she hears a strange or scary noise, will he/she look at you before responding?',
      },
      { id: 'i19_new_person', prompt: 'Does he/she look at you when someone new approaches?' },
      {
        id: 'i19_unfamiliar',
        prompt: 'Does he/she look at you when faced with something unfamiliar or a little scary?',
      },
    ],
    scoreRule: 'Any "Yes" → 0 · No to all three → 1.',
    isGateVisible: (id, r) => {
      if (id === 'i19_scary_noise') return true;
      if (id === 'i19_new_person')
        return gateAnswered('i19_scary_noise', r) && !gateYes('i19_scary_noise', r);
      if (id === 'i19_unfamiliar')
        return gateAnswered('i19_new_person', r) && !gateYes('i19_new_person', r);
      return false;
    },
    resolve: r => {
      if (!gateAnswered('i19_scary_noise', r)) return pending();
      if (gateYes('i19_scary_noise', r)) return scored(0);
      if (!gateAnswered('i19_new_person', r)) return pending();
      if (gateYes('i19_new_person', r)) return scored(0);
      if (!gateAnswered('i19_unfamiliar', r)) return pending();
      return scored(gateYes('i19_unfamiliar', r) ? 0 : 1);
    },
  },
  20: {
    itemNum: 20,
    question: 'Does {name} like movement activities?',
    example: 'being swung or bounced on your knee',
    screeningElevatedAnswer: 'no',
    introAnswer: 'No',
    layout: 'single',
    examplesPrompt: 'When you swing or bounce him/her, does he/she…',
    examples: item20Examples,
    scoreRule: 'Yes to any → 0 · No to all → 1.',
    resolve: r => resolveAnyYesPass(item20Examples, r),
  },
};

// ---------------------------------------------------------------------------
// Reaction-stage helpers (item 12 only) — exposed for the renderer
// ---------------------------------------------------------------------------

export const ITEM12_REACTION_ZERO = item12ReactZero;
export const ITEM12_REACTION_ONE = item12ReactOne;
export const ITEM12_NOISES = item12Noises;

export function item12ReactionsVisible(r: FUResponses): boolean {
  return countYes(item12Noises, r) >= 2;
}

// ---------------------------------------------------------------------------
// Follow-up summary
// ---------------------------------------------------------------------------

export type FollowUpClassification = 'negative' | 'positive';

export function mchatRFollowUpClassification(totalScore: number): FollowUpClassification {
  return totalScore >= 2 ? 'positive' : 'negative';
}

/** Item numbers that were elevated on screening (stored value 1). */
export function getElevatedItems(items: Record<string, number>): number[] {
  const elevated: number[] = [];
  for (let i = 1; i <= 20; i++) {
    if (items[String(i)] === 1) elevated.push(i);
  }
  return elevated;
}
