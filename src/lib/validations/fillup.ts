import { z } from 'zod';

const GENDERS = ['male', 'female', 'other'] as const;
const LANGUAGES = ['english', 'hindi'] as const;

export const fillupFormSchema = z.object({
  patientName: z.string().min(1, "Please enter the child's name"),
  dateOfBirth: z.string().min(1, "Please enter the child's date of birth"),
  patientGender: z.enum(GENDERS, {
    message: "Please select the child's gender",
  }),
  guardianPhone: z.string().optional(),
  screenSize: z.number().gt(0, 'Please select your screen size'),
  selectedLanguage: z.enum(LANGUAGES, {
    message: 'Please select a language',
  }),
  videoCount: z.union([z.literal(1), z.literal(2)]),
  consent: z
    .boolean()
    .refine(val => val === true, { message: 'Please provide consent to proceed' }),
});

export type FillupFormData = z.infer<typeof fillupFormSchema>;
