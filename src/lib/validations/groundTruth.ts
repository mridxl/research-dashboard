import { z } from 'zod';

/**
 * Ground-truth labels for a research session. Keep this a single object schema:
 * future instruments (CARS2 score, INCLEN result, ISAA, M-CHAT-R, ...) are
 * added as new optional/nullable fields, mirroring the backend GroundTruth model.
 */
export const groundTruthSchema = z.object({
  schema_version: z.number().int().default(1),
  clinician_diagnosis: z.enum(['autistic', 'not_autistic', 'uncertain']).nullable(),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must be at most 2000 characters')
    .refine(value => !/[<>]/.test(value), 'Notes must not contain < or >')
    .nullable(),
});

export type GroundTruthFormData = z.infer<typeof groundTruthSchema>;
