import { z } from 'zod';

const deliveryType = z.enum(['Normal', 'Cesarean'], {
  message: 'Please select delivery type',
});

const gestationPeriod = z.enum(['Pre term', 'Full term'], {
  message: 'Please select gestation period',
});

const speech = z.enum(['Normal', 'Delayed'], {
  message: 'Please select speech status',
});

const baseQuestionnaireSchema = z.object({
  deliveryType: deliveryType,
  gestationPeriod: gestationPeriod,
  criedImmediately: z.enum(['Yes', 'No'], {
    message: 'Please select if the child cried immediately after birth',
  }),
  nicuStay: z.enum(['Yes', 'No'], {
    message: 'Please select if there was a NICU stay',
  }),
  birthWeightKg: z
    .string()
    .min(1, 'Please enter birth weight')
    .refine(val => {
      const weight = Number(val);
      return Number.isFinite(weight) && weight > 0 && weight <= 10;
    }, 'Birth weight must be a valid number in kilograms (e.g., 2.8)'),
  socialSmileBefore3Months: z.enum(['Yes', 'No'], {
    message: 'Please select if the child started socially smiling before 3 months',
  }),
  sittingBefore8Months: z.enum(['Yes', 'No'], {
    message: 'Please select if the child started sitting before 8 months',
  }),
  walkingBefore18Months: z.enum(['Yes', 'No'], {
    message: 'Please select if the child started walking before 18 months',
  }),
  speech: speech,
  eyeContact: z.enum(['Yes', 'No'], {
    message: 'Please select if the child maintains eye contact',
  }),
  repetitiveBehaviour: z.enum(['Yes', 'No'], {
    message: 'Please select if the child engages in repetitive behaviour',
  }),
  hyperactivity: z.enum(['Yes', 'No'], {
    message: 'Please select if the child shows hyperactivity',
  }),
  responseToName: z.enum(['Yes', 'No'], {
    message: 'Please select if the child responds to their name',
  }),
  sensorySensitivity: z.enum(['Yes', 'No'], {
    message: 'Please select if the child has sensory sensitivity',
  }),
  signsBefore3Years: z.string().optional(),
  strugglesDailyTasks: z.string().optional(),
});

export const questionnaireSchema = baseQuestionnaireSchema.superRefine((data, ctx) => {
  const requiresFollowUp =
    data.eyeContact === 'No' ||
    data.repetitiveBehaviour === 'Yes' ||
    data.hyperactivity === 'Yes' ||
    data.responseToName === 'No' ||
    data.sensorySensitivity === 'Yes';

  if (requiresFollowUp) {
    if (!data.signsBefore3Years) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please answer if signs were before 3 years.',
        path: ['signsBefore3Years'],
      });
    }
    if (!data.strugglesDailyTasks) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please answer if child struggles with daily tasks.',
        path: ['strugglesDailyTasks'],
      });
    }
  }
});

export type QuestionnaireFormData = z.infer<typeof baseQuestionnaireSchema>;
