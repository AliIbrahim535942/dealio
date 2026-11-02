import { z } from 'zod';
import { slugify } from '../utils/slugify';

export const createCategorySchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Name is required')
        .max(100)
        .refine(
          (value) => slugify(value).length > 0,
          'Name must contain at least one Latin letter or number',
        ),
      description: z.string().trim().max(2000).optional(),
      parent_id: z.preprocess(
        (value) =>
          value === undefined || value === '' || value === 'null'
            ? null
            : Number(value),
        z.number().int().positive().nullable(),
      ),
    })
    .strict(),
});
export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive().max(2147483647),
  }),
});

export type createCategoryBody = z.infer<typeof createCategorySchema>['body'];
