import * as z from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Title must be at least 2 characters.').max(200),
  category: z.string().min(1, 'Please select a work type'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'], { message: 'Please select a priority' }),
  description: z.string().max(5000)
});

export type ProductFormValues = z.infer<typeof productSchema>;
