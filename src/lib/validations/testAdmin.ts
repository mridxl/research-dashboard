import { z } from 'zod';

export const createTestAdminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .transform(val => (val === '' ? null : val))
    .pipe(z.email('Please enter a valid email address').nullable()),
  phone_number: z.string().min(1, 'Phone number is required'),
  gender: z.enum(['male', 'female', 'other']),
});

export const updateTestAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z
    .string()
    .transform(val => (val === '' ? null : val))
    .pipe(z.email('Please enter a valid email address').nullable()),
  phone_number: z.string().min(1, 'Phone number is required').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

export type CreateTestAdminData = z.infer<typeof createTestAdminSchema>;
export type UpdateTestAdminData = z.infer<typeof updateTestAdminSchema>;
