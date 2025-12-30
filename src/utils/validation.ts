import { z } from 'zod';

export const CreateCardOptionsSchema = z.object({
  desc: z
    .string()
    .max(16384, 'Description too long (max 16384 characters)')
    .optional(),
  due: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date format: YYYY-MM-DD')
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date')
    .refine(
      (date) => new Date(date) >= new Date(new Date().toDateString()),
      'Date cannot be in the past'
    )
    .optional(),
  labels: z
    .string()
    .transform((s) => s.split(',').map((l) => l.trim().toLowerCase()))
    .pipe(z.array(z.string().min(1, 'Empty label name')))
    .optional(),
  members: z
    .string()
    .transform((s) =>
      s.split(',').map((m) => m.trim().toLowerCase().replace(/^@/, ''))
    )
    .pipe(z.array(z.string().min(1, 'Empty username')))
    .optional(),
  list: z.enum(['todo', 'doing', 'done']).default('todo'),
});

export type CreateCardOptions = z.infer<typeof CreateCardOptionsSchema>;

export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
    .join('\n');
}
