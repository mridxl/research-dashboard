/**
 * CARS2 (Childhood Autism Rating Scale, Second Edition) – 15 items, 1–4 scale with half-points.
 * Total raw score 15–60. Classification: 15–29.5 non-autistic, 30–36.5 mild–moderate, 37–60 severe.
 */
export const CARS2_RATING_OPTIONS: number[] = [1, 1.5, 2, 2.5, 3, 3.5, 4];

export const CARS2_RATING_LABELS: Record<number, string> = {
  1: '1 – Within normal limits',
  1.5: '1.5',
  2: '2 – Mildly abnormal',
  2.5: '2.5',
  3: '3 – Moderately abnormal',
  3.5: '3.5',
  4: '4 – Severely abnormal',
};

export type CARS2Classification = 'no_autism' | 'mild_moderate' | 'severe';

export const CARS2_CLASSIFICATION_LABELS: Record<CARS2Classification, string> = {
  no_autism: 'Within non-autistic range',
  mild_moderate: 'Mild to moderate autism',
  severe: 'Severe autism',
};

/** Anchor descriptions for each rating level (1–4) per item. */
export interface CARS2ItemDescriptor {
  key: string;
  label: string;
  anchors: {
    1: string;
    2: string;
    3: string;
    4: string;
  };
}

/**
 * 15 items per CARS2 Standard Form (CARS2-ST) with full anchor descriptions.
 */
export const CARS2_ITEMS: CARS2ItemDescriptor[] = [
  {
    key: '1',
    label: 'Relating to People',
    anchors: {
      1: "No evidence of difficulty or abnormality in relating to people: The child's behaviour is appropriate for his or her age. Some shyness, fussiness, or annoyance at being told what to do may be observed, but not to an atypical degree.",
      2: 'Mildly abnormal relationships: The child may avoid looking the adult in the eye, avoid the adult or become fussy if interaction is forced, be excessively shy, not be as responsive to the adult as is typical, or cling to parents somewhat more than most children of the same age.',
      3: "Moderately abnormal relationships: The child shows aloofness (seems unaware of adult) at times. Persistent and forceful attempts are necessary to get the child's attention at times. Minimal contact is initiated by the child.",
      4: "Severely abnormal relationships: The child is consistently aloof or unaware of what the adult is doing. He or she almost never responds to or initiates contact with the adult. Only the most persistent attempts to get the child's attention have any effect.",
    },
  },
  {
    key: '2',
    label: 'Imitation',
    anchors: {
      1: 'Appropriate imitation: The child can imitate sounds, words, and movements that are appropriate for his or her skill level.',
      2: 'Mildly abnormal imitation: The child imitates simple behaviours such as clapping or single verbal sounds most of the time; occasionally imitates only after prodding or after a delay.',
      3: 'Moderately abnormal imitation: The child imitates only part of the time and requires a great deal of persistence and help from the adult; frequently imitates only after a delay.',
      4: 'Severely abnormal imitation: The child rarely or never imitates sounds, words, or movements even with prodding and assistance from the adult.',
    },
  },
  {
    key: '3',
    label: 'Emotional Response',
    anchors: {
      1: 'Age-appropriate and situation-appropriate emotional response: The child shows the appropriate type and degree of emotional response, as indicated by a change in facial expression, posture, and manner.',
      2: 'Mildly abnormal emotional response: The child occasionally displays a somewhat inappropriate type or degree of emotional reaction. Reactions are sometimes unrelated to the objects or events surrounding him or her.',
      3: 'Moderately abnormal emotional response: The child shows definite signs of inappropriate type and/or degree of emotional response. Reactions may be quite inhibited or excessive and unrelated to the situation; child may grimace, laugh, or become rigid even though no apparent emotion-producing objects or events are present.',
      4: 'Severely abnormal emotional response: Responses are seldom appropriate to the situation; once the child gets in a certain mood, it is very difficult to change the mood. Conversely, the child may show wildly different emotions when nothing has changed.',
    },
  },
  {
    key: '4',
    label: 'Body Use',
    anchors: {
      1: 'Age-appropriate body use. The child moves with the same ease, agility, and coordination as a normal child of the same age.',
      2: 'Mildly abnormal body use. Some minor peculiarities may be present, such as clumsiness, repetitive movements, poor coordination, or the rare appearance of more unusual movements.',
      3: 'Moderately abnormal body use. Behaviours that are clearly strange or unusual for a child of this age may include strange finger movements, peculiar finger or body posturing, staring or picking at the body, self-directed aggression, rocking, spinning, finger-wiggling, or toe-walking.',
      4: 'Severely abnormal body use. Intense or frequent movements of the type listed above are signs of severely abnormal body use. These behaviours may persist despite attempts to discourage them or involve the child in other activities.',
    },
  },
  {
    key: '5',
    label: 'Object Use',
    anchors: {
      1: 'Appropriate interest in, or use of, toys and other objects. The child shows normal interest in toys and other objects appropriate for his or her skill level and uses these toys in an appropriate manner.',
      2: 'Mildly inappropriate interest in, or use of, toys and other objects. The child may show atypical interest in a toy or play with it in an inappropriately childish way (e.g., banging or sucking on the toy).',
      3: 'Moderately inappropriate interest in, or use of, toys and other objects. The child may show little interest in toys or other objects, or may be preoccupied with using an object or toy in some strange way. He or she may focus on some insignificant part of a toy, become fascinated with light reflecting off the object, repetitively move some part of the object, or play with one object exclusively.',
      4: 'Severely inappropriate interest in, or use of, toys and other objects. The child may engage in the same behaviours as above, with greater frequency and intensity. The child is difficult to distract when engaged in these inappropriate activities.',
    },
  },
  {
    key: '6',
    label: 'Adaptation to Change',
    anchors: {
      1: 'Age-appropriate adaptation to change. While the child may notice or comment on changes in routine, he or she accepts these changes without undue distress.',
      2: 'Mildly abnormal adaptation to change. When an adult tries to change tasks, the child may continue the same activity or use the same materials.',
      3: 'Moderately abnormal adaptation to change. The child actively resists changes in routine, tries to continue the old activity, and is difficult to distract. He or she may become angry and unhappy when an established routine is altered.',
      4: 'Severely abnormal adaptation to change. The child shows severe reaction to change. If a change is forced, he or she may become extremely angry or uncooperative and respond with tantrums.',
    },
  },
  {
    key: '7',
    label: 'Visual Response',
    anchors: {
      1: "Age-appropriate visual response. The child's visual behaviour is normal and appropriate for his or her age. Vision is used together with other senses as a way to explore a new object.",
      2: 'Mildly abnormal visual response. The child must be occasionally reminded to look at objects. The child may be more interested in looking at mirrors or lighting than are his or her peers, may occasionally stare off into space, or may also avoid looking people in the eye.',
      3: 'Moderately abnormal visual response. The child must be reminded frequently to look at what he or she is doing. He or she may stare into space, avoid looking people in the eye, look at objects from an unusual angle, or hold objects very close to the eyes.',
      4: 'Severely abnormal visual response. The child consistently avoids looking at people or certain objects and may show extreme forms of other visual peculiarities described above.',
    },
  },
  {
    key: '8',
    label: 'Listening Response',
    anchors: {
      1: "Age-appropriate listening response. The child's listening behaviour is normal and appropriate for his or her age. Listening is used together with other senses.",
      2: "Mildly abnormal listening response. There may be some lack of response or mild overreaction to certain sounds. Responses to sounds may be delayed, and sounds may need repetition to catch the child's attention. The child may be distracted by extraneous sounds.",
      3: "Moderately abnormal listening response. The child's responses to sounds vary; often ignores a sound the first few times it is made; may be startled or cover ears when hearing some everyday sounds.",
      4: 'Severely abnormal listening response. The child overreacts and/or underreacts to sounds to an extremely marked degree, regardless of the type of sound.',
    },
  },
  {
    key: '9',
    label: 'Taste, Smell, and Touch Response and Use',
    anchors: {
      1: 'Normal use of, and response to, taste, smell, and touch. The child explores new objects in an age-appropriate manner, generally by feeling and looking. Taste or smell may be used when appropriate. When reacting to minor everyday pain, the child expresses discomfort but does not overreact.',
      2: 'Mildly abnormal use of, and response to, taste, smell, and touch. The child may persist in putting objects in his or her mouth; may smell or taste inedible objects; may ignore or overreact to mild pain that a normal child would express as discomfort.',
      3: 'Moderately abnormal use of, and response to, taste, smell, and touch. The child may be moderately preoccupied with touching, smelling, or tasting objects or people. The child may either react too much or too little.',
      4: 'Severely abnormal use of, and response to, taste, smell, and touch. The child is preoccupied with smelling, tasting, or feeling objects more for the sensation than for normal exploration or use of the objects. The child may completely ignore pain or react very strongly to slight discomfort.',
    },
  },
  {
    key: '10',
    label: 'Fear or Nervousness',
    anchors: {
      1: "Normal fear or nervousness. The child's behaviour is appropriate both to the situation and for his or her age.",
      2: 'Mildly abnormal fear or nervousness. The child occasionally shows too much or too little fear or nervousness compared to the reaction of a normal child of the same age in a similar situation.',
      3: 'Moderately abnormal fear or nervousness. The child shows either quite a bit more or quite a bit less fear than is typical even for a younger child in a similar situation.',
      4: 'Severely abnormal fear or nervousness. Fear persists even after repeated experience with harmless events or objects. It is extremely difficult to calm or comfort the child. The child may, conversely, fail to show appropriate regard for hazards that other children of the same age avoid.',
    },
  },
  {
    key: '11',
    label: 'Verbal Communication',
    anchors: {
      1: 'Normal verbal communication, age and situation appropriate.',
      2: 'Mildly abnormal verbal communication. Speech shows overall retardation. Most speech is meaningful; however, some echolalia or pronoun reversal may occur. Some peculiar words or jargon may be used occasionally.',
      3: 'Moderately abnormal verbal communication. Speech may be absent. When present, verbal communication may be a mixture of some meaningful speech and some peculiar speech such as jargon, echolalia, or pronoun reversal. Peculiarities in meaningful speech include excessive questioning or preoccupation with particular topics.',
      4: 'Severely abnormal verbal communication. Meaningful speech is not used. The child may make infantile squeals, weird or animal-like sounds, or complex noises approximating speech, or may show persistent, bizarre use of some recognisable words or phrases.',
    },
  },
  {
    key: '12',
    label: 'Nonverbal Communication',
    anchors: {
      1: 'Normal use of nonverbal communication, age and situation appropriate.',
      2: 'Mildly abnormal use of nonverbal communication. Immature use of nonverbal communication; may only point vaguely, or reach for what he or she wants in situations where a typically developing same-age child may point or gesture more specifically to indicate what he or she wants.',
      3: 'Moderately abnormal use of nonverbal communication. The child is generally unable to express needs or desires nonverbally and cannot understand the nonverbal communication of others.',
      4: 'Severely abnormal use of nonverbal communication. The child uses only bizarre or peculiar gestures that have no apparent meaning and shows no awareness of the meanings associated with the gestures or facial expressions of others.',
    },
  },
  {
    key: '13',
    label: 'Activity Level',
    anchors: {
      1: 'Normal activity level for age and circumstances. The child is neither more active nor less active than a normal child of the same age in a similar situation.',
      2: 'Mildly abnormal activity level. The child may either be mildly restless or somewhat "lazy" and slow moving at times. The child\'s activity level interferes only slightly with his or her performance.',
      3: 'Moderately abnormal activity level. The child may be quite active and difficult to restrain. He or she may have boundless energy and may not go to sleep readily at night. Conversely, the child may be quite lethargic and need a great deal of prodding to get him or her to move about.',
      4: 'Severely abnormal activity level. The child exhibits extremes of activity or inactivity and may even shift from one extreme to the other.',
    },
  },
  {
    key: '14',
    label: 'Level and Consistency of Intellectual Response',
    anchors: {
      1: 'Intelligence is normal and reasonably consistent across various areas. The child is as intelligent as typical children of the same age and does not have any unusual intellectual skills or problems.',
      2: 'Mildly abnormal intellectual functioning. The child has very low intelligence (IQ score is 70 or lower) and his or her skills appear fairly evenly delayed across all areas.',
      3: "Moderately abnormal intellectual functioning. The child's overall intelligence is in the range from intellectually disabled to average (IQ score less than 115), and there is significant variability in skills. At least one skill is in average range.",
      4: 'Severely abnormal intellectual functioning. A rating of 4 is given when extreme savant skills are present, regardless of overall level of intelligence.',
    },
  },
  {
    key: '15',
    label: 'General Impressions',
    anchors: {
      1: 'No autism spectrum disorder. The child shows none of the symptoms characteristic of autism.',
      2: 'Mild autism spectrum disorder. The child shows only a few symptoms or only a mild degree of autism.',
      3: 'Moderate autism spectrum disorder. The child shows a number of symptoms or a moderate degree of autism.',
      4: 'Severe autism spectrum disorder. The child shows many symptoms or an extreme degree of autism.',
    },
  },
];

/**
 * Compute total score (sum of 15 item ratings 1–4, including half-points) and classification.
 * <30 = no_autism, 30–36.5 = mild_moderate, 37+ = severe.
 */
export function cars2ScoreFromItems(items: Record<string, number>): {
  total_score: number;
  classification: CARS2Classification;
} {
  let total = 0;
  for (let i = 1; i <= 15; i++) {
    total += items[String(i)] ?? 0;
  }
  let classification: CARS2Classification = 'no_autism';
  if (total >= 30 && total <= 36.5) classification = 'mild_moderate';
  else if (total >= 37) classification = 'severe';
  return { total_score: total, classification };
}
