import { z } from 'zod';

import {
  CUSTOM_RESULT_PARAGRAPH_MAX_LENGTH,
  PSYCH_EVAL_OUTCOME_CONFLICT_PAIRS,
} from '@/lib/assessments/outcomes';

const OUTCOME_CODES = [
  'no_concerns',
  'asd_positive_broad',
  'asd_positive_direct',
  'adhd_standard',
  'adhd_mild',
  'sld',
  'odd_conduct',
  'intellectual_disability',
  'global_dev_delay',
  'epilepsy',
  'custom',
] as const;

/**
 * Ground-truth labels for a research session — mirrors the middleware
 * GroundTruth model, including its clinical selection rules so the user gets
 * the error inline instead of a 422 round-trip.
 *
 * `clinician_diagnosis` is the superseded single-select field: parsed so old
 * sessions round-trip, but the form only writes `outcome_codes`.
 */
export const groundTruthSchema = z
  .object({
    schema_version: z.number().int().default(1),
    clinician_diagnosis: z.enum(['autistic', 'not_autistic', 'uncertain']).nullable(),
    outcome_codes: z.array(z.enum(OUTCOME_CODES)).nullable(),
    custom_result_paragraph: z
      .string()
      .trim()
      .max(
        CUSTOM_RESULT_PARAGRAPH_MAX_LENGTH,
        `Custom paragraph must be at most ${CUSTOM_RESULT_PARAGRAPH_MAX_LENGTH} characters`
      )
      .refine(value => !/[<>]/.test(value), 'Custom paragraph must not contain < or >')
      .nullable(),
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes must be at most 2000 characters')
      .refine(value => !/[<>]/.test(value), 'Notes must not contain < or >')
      .nullable(),
  })
  .superRefine((value, ctx) => {
    const codes = value.outcome_codes ?? [];
    if (codes.length === 0) return;

    if (new Set(codes).size !== codes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcome_codes'],
        message: 'Duplicate outcome codes are not allowed',
      });
      return;
    }

    if (codes.includes('custom')) {
      if (codes.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outcome_codes'],
          message: 'Custom outcome must be selected alone',
        });
        return;
      }
      if (!value.custom_result_paragraph?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['custom_result_paragraph'],
          message: 'Write the custom paragraph, or pick a preset outcome instead',
        });
      }
      return;
    }

    if (codes.includes('no_concerns') && codes.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcome_codes'],
        message: 'No Concerns cannot be combined with other outcomes',
      });
    }

    for (const [left, right] of PSYCH_EVAL_OUTCOME_CONFLICT_PAIRS) {
      if (codes.includes(left) && codes.includes(right)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['outcome_codes'],
          message: `Cannot select both ${left} and ${right}`,
        });
      }
    }
  });

export type GroundTruthFormData = z.infer<typeof groundTruthSchema>;
