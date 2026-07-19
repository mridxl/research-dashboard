import { toast } from 'sonner';
import type { z } from 'zod';

/**
 * Validates data against a Zod schema and shows the first error as a toast.
 * Returns the parsed data if valid, or null if validation fails.
 */
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> | null {
  const result = schema.safeParse(data);

  if (!result.success) {
    toast.error(result.error.issues[0].message);
    return null;
  }

  return result.data;
}
