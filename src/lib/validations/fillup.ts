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
  stimulusVersions: z.array(z.enum(['1', '2'])).min(1, 'Please select at least one video version'),
  consent: z
    .boolean()
    .refine(val => val === true, { message: 'Please provide consent to proceed' }),
});

export type FillupFormData = z.infer<typeof fillupFormSchema>;
