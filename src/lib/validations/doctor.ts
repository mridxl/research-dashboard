import { z } from 'zod';

/** Treat empty string like missing so optional fields do not fail email/phone validation on PATCH. */
const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

export const createDoctorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Please enter a valid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
  gender: z.enum(['male', 'female', 'other']),
  city: z.string().min(1, 'City is required'),
});

export const updateDoctorSchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().min(1, 'Name is required').optional()),
  email: z.preprocess(emptyToUndefined, z.email('Please enter a valid email address').optional()),
  phone_number: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^\+?\d{10,15}$/, 'Invalid phone number format')
      .optional()
  ),
  gender: z.preprocess(emptyToUndefined, z.enum(['male', 'female', 'other']).optional()),
  city: z.preprocess(emptyToUndefined, z.string().min(1, 'City is required').optional()),
});

export type CreateDoctorData = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorData = z.infer<typeof updateDoctorSchema>;
