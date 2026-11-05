import { z } from 'zod';
import { slugify } from '../utils/slugify';

const MAX_PAGE_SIZE = 50;
const MAX_CATEGORIES_PER_PRODUCT = 10;

// DECIMAL(10,2): up to eight integer digits and two decimal digits. Keep it as a string; do not convert it to a float.
const priceString = z
  .string()
  .trim()
  .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Invalid price format')
  .refine((v) => Number(v) > 0, 'Price must be greater than zero');

const positiveInt = z.coerce.number().int().positive();

// Multipart fields may arrive as a string or string[], so normalize both forms to an array.
const idList = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : [v]).map(Number))
  .pipe(
    z.array(z.number().int().positive()).min(1).max(MAX_CATEGORIES_PER_PRODUCT),
  )
  .refine((ids) => new Set(ids).size === ids.length, 'Duplicate category ids');
const slugParam = z
  .string()
  .trim()
  .min(1)
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');

export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .refine(
        (v) => slugify(v).length > 0,
        'Name must contain latin letters or numbers',
      ),
    description: z.string().trim().max(5000).optional(),
    price: priceString,
    stock_quantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
    sku: z.string().trim().min(1).max(100).optional(),
    category_ids: idList,
  }),
});

export const productSlugParamSchema = z.object({
  params: z.object({ slug: slugParam }),
});

export const productIdParamSchema = z.object({
  params: z.object({ id: positiveInt }),
});

export const listProductsSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
      category: slugParam.optional(),
      q: z.string().trim().min(2).max(100).optional(),
      min_price: priceString.optional(),
      max_price: priceString.optional(),
      sort: z
        .enum(['newest', 'price_asc', 'price_desc', 'name_asc'])
        .default('newest'),
    })
    .refine(
      (q) =>
        !q.min_price ||
        !q.max_price ||
        Number(q.min_price) <= Number(q.max_price),
      { message: 'min_price must not exceed max_price', path: ['min_price'] },
    ),
});
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
