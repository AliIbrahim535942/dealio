import type { PoolClient } from 'pg';
import type { z } from 'zod';
import pool from '../config/database';
import { AppError } from '../utils/AppError';
import { slugify, slugWithSuffix } from '../utils/slugify';
import { withTransaction } from '../utils/withTransaction';
import {
  uploadImages,
  cleanupRemoteUploads,
  cleanupLocalUploads,
  type UploadedImage,
} from './cloudinary.service';
import type { createProductSchema } from '../validations/products.validations';

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];

const MAX_BASE_SLUG_LENGTH = 200;
const MAX_SLUG_ATTEMPTS = 10;

const PRODUCT_COLUMNS =
  'id, name, slug, description, price, stock_quantity, sku, created_at';

const ACTIVE_CATEGORIES_SQL =
  'SELECT id FROM categories WHERE id = ANY($1::int[]) AND is_active = true';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string; // DECIMAL values remain strings.
  stock_quantity: number;
  sku: string | null;
  created_at: Date;
}

interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductWithDetails extends Product {
  category_ids: number[];
  images: ProductImage[];
}

/**
 * ON CONFLICT DO NOTHING applies only to the slug. A SKU conflict (23505 on
 * another constraint) aborts the transaction, so mapProductError converts it
 * to a 409 after the rollback.
 */
async function insertWithUniqueSlug(
  client: PoolClient,
  data: CreateProductInput,
): Promise<Product> {
  const baseSlug = slugify(data.name)
    .slice(0, MAX_BASE_SLUG_LENGTH)
    .replace(/-+$/, '');

  if (!baseSlug) {
    throw new AppError(
      'Name must contain at least one Latin letter or number',
      400,
    );
  }

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const result = await client.query<Product>(
      `INSERT INTO products (name, slug, description, price, stock_quantity, sku)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING
       RETURNING ${PRODUCT_COLUMNS}`,
      [
        data.name,
        slugWithSuffix(baseSlug, attempt),
        data.description ?? null,
        data.price,
        data.stock_quantity,
        data.sku ?? null,
      ],
    );

    if (result.rows[0]) return result.rows[0];
  }

  throw new AppError('Could not generate a unique slug', 409);
}

function mapProductError(error: unknown): unknown {
  const pgError = error as { code?: string; constraint?: string };
  if (pgError?.code === '23505' && pgError.constraint === 'products_sku_key') {
    return new AppError('SKU already exists', 409);
  }
  return error;
}

export async function createProduct(
  data: CreateProductInput,
  files: Express.Multer.File[],
): Promise<ProductWithDetails> {
  let uploaded: UploadedImage[] = [];

  try {
    // Validate categories before network I/O so images are not uploaded for a request that will return 404.
    const early = await pool.query(ACTIVE_CATEGORIES_SQL, [data.category_ids]);
    if (early.rows.length !== data.category_ids.length) {
      throw new AppError('One or more categories not found', 404);
    }

    // Upload before BEGIN so no database connection is held during network I/O.
    uploaded = await uploadImages(files);

    return await withTransaction(async (client) => {
      // Use a shared lock so this operation is serialized with deleteCategory, which updates the same rows.
      const locked = await client.query(
        `${ACTIVE_CATEGORIES_SQL} ORDER BY id FOR SHARE`,
        [data.category_ids],
      );
      if (locked.rows.length !== data.category_ids.length) {
        throw new AppError('One or more categories not found', 404);
      }

      const product = await insertWithUniqueSlug(client, data);

      await client.query(
        `INSERT INTO product_categories (product_id, category_id)
         SELECT $1, UNNEST($2::int[])`,
        [product.id, data.category_ids],
      );

      let images: ProductImage[] = [];
      if (uploaded.length > 0) {
        const result = await client.query<ProductImage>(
          `INSERT INTO product_images
             (product_id, image_url, image_public_id, is_primary, display_order)
           SELECT $1, u.url, u.public_id, u.ord = 0, u.ord
           FROM UNNEST($2::text[], $3::text[], $4::int[]) AS u(url, public_id, ord)
           RETURNING id, image_url, is_primary, display_order`,
          [
            product.id,
            uploaded.map((i) => i.url),
            uploaded.map((i) => i.publicId),
            uploaded.map((_, index) => index),
          ],
        );
        images = result.rows.sort((a, b) => a.display_order - b.display_order);
      }

      return { ...product, category_ids: data.category_ids, images };
    });
  } catch (error) {
    // Cleanup failures must not hide the original error; cleanupRemoteUploads logs and absorbs its own errors.
    await cleanupRemoteUploads(uploaded.map((i) => i.publicId));
    throw mapProductError(error);
  } finally {
    await cleanupLocalUploads(files);
  }
}
