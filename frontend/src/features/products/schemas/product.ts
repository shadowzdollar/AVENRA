import * as z from 'zod';

const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const productSchema = z.object({
  image: z
    .any()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, 'Max file size is 5MB.')
    .refine(
      (files) =>
        !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
  name: z.string().min(2, 'Engagement title must be at least 2 characters.'),
  category: z.string().min(1, 'Please select a practice category'),
  price: z.number({ message: 'Engagement fee is required' }),
  description: z.string().min(5, 'Description must be at least 5 characters.')
});

export type ProductFormValues = {
  image?: File[] | undefined;
  name: string;
  category: string;
  price: number | undefined;
  description: string;
};
