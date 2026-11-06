import type { PoolClient } from 'pg';
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
import { CreateProductInput,UpdateProductInput } from '../validations/products.validations';
import {
  ProductPublic,
  Product,
  ProductImage,
  ProductWithDetails,
} from '../types/api.types';
import type { ListProductsQuery } from '../validations/products.validations';
import { ProductListItem, ProductListResult } from '../types/api.types';

const MAX_BASE_SLUG_LENGTH = 200;
const MAX_SLUG_ATTEMPTS = 10;

const PRODUCT_COLUMNS =
  'id, name, slug, description, price, stock_quantity, sku, created_at';

const ACTIVE_CATEGORIES_SQL =
  'SELECT id FROM categories WHERE id = ANY($1::int[]) AND is_active = true';

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

export async function getProductBySlug(slug: string): Promise<ProductPublic> {
  // Use one query without N+1 queries; categories and images are returned through JSON subqueries.
  const result = await pool.query<ProductPublic>(
    `SELECT p.id, p.name, p.slug, p.description, p.price, p.stock_quantity,
       COALESCE((
         SELECT json_agg(
                  json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
                  ORDER BY c.name
                )
         FROM product_categories pc
         JOIN categories c ON c.id = pc.category_id
         WHERE pc.product_id = p.id AND c.is_active = true
       ), '[]'::json) AS categories,
       COALESCE((
         SELECT json_agg(
                  json_build_object(
                    'id', i.id,
                    'image_url', i.image_url,
                    'is_primary', i.is_primary,
                    'display_order', i.display_order
                  )
                  ORDER BY i.display_order, i.id
                )
         FROM product_images i
         WHERE i.product_id = p.id
       ), '[]'::json) AS images
     FROM products p
     WHERE p.slug = $1 AND p.is_active = true`,
    [slug],
  );

  if (!result.rows[0]) throw new AppError('Product not found', 404);
  return result.rows[0];
}

// whitelist ثابتة: مدخل المستخدم ما بيوصل للـ SQL. id للـ tie-breaker عشان الـ pagination يبقى ثابت
const SORT_SQL: Record<ListProductsQuery['sort'], string> = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id DESC',
  name_asc: 'p.name ASC, p.id ASC',
};

// بدون escape بيصير % و _ و \ من المستخدم wildcards
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export async function listProducts(
  query: ListProductsQuery,
): Promise<ProductListResult> {
  const params: unknown[] = [];
  const bind = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  const conditions: string[] = ['p.is_active = true'];
  let cte = '';

  if (query.category) {
    // UNION (مش UNION ALL) بيوقف الـ recursion لو صار حلقة بالشجرة
    cte = `WITH RECURSIVE subtree AS (
      SELECT id FROM categories WHERE slug = ${bind(query.category)} AND is_active = true
      UNION
      SELECT c.id FROM categories c
      JOIN subtree s ON c.parent_id = s.id
      WHERE c.is_active = true
    )`;
    // EXISTS مش JOIN: المنتج بأكثر من تصنيف ما لازم يتكرر
    conditions.push(
      `EXISTS (
         SELECT 1 FROM product_categories pc
         WHERE pc.product_id = p.id
           AND pc.category_id IN (SELECT id FROM subtree)
       )`,
    );
  }

  if (query.q) {
    const pattern = bind(`%${escapeLike(query.q)}%`);
    conditions.push(
      `(p.name ILIKE ${pattern} OR p.description ILIKE ${pattern})`,
    );
  }

  if (query.min_price)
    conditions.push(`p.price >= ${bind(query.min_price)}::numeric`);
  if (query.max_price)
    conditions.push(`p.price <= ${bind(query.max_price)}::numeric`);

  const where = conditions.join(' AND ');

  // الـ count ما بيحتاج limit/offset، فبناخد نسخة من الـ params قبلهم
  // (pg بيرفض لو عدد الـ params أكتر من الـ placeholders المستخدمة)
  const filterParams = [...params];
  const limitRef = bind(query.limit);
  const offsetRef = bind((query.page - 1) * query.limit);

  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: string }>(
      `${cte} SELECT COUNT(*) AS total FROM products p WHERE ${where}`,
      filterParams,
    ),
    pool.query<ProductListItem>(
      `${cte}
       SELECT p.id, p.name, p.slug, p.price, p.stock_quantity,
         (SELECT i.image_url FROM product_images i
          WHERE i.product_id = p.id
          ORDER BY i.is_primary DESC, i.display_order, i.id
          LIMIT 1) AS primary_image
       FROM products p
       WHERE ${where}
       ORDER BY ${SORT_SQL[query.sort]}
       LIMIT ${limitRef} OFFSET ${offsetRef}`,
      params,
    ),
  ]);

  const total = Number(countResult.rows[0].total);

  return {
    items: dataResult.rows,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      total_pages: Math.ceil(total / query.limit),
    },
  };
}

export async function updateProduct(
  id: number,
  data: UpdateProductInput,
): Promise<Product> {
  const sets: string[] = [];
  const params: unknown[] = [];
  // أسماء الأعمدة literals ثابتة هون، والقيم كلها parameters
  const set = (column: string, value: unknown): void => {
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  };

  if (data.name !== undefined) set('name', data.name);
  if (data.description !== undefined) set('description', data.description || null);
  if (data.price !== undefined) set('price', data.price);
  if (data.stock_quantity !== undefined) set('stock_quantity', data.stock_quantity);
  if (data.sku !== undefined) set('sku', data.sku);

  params.push(id);

  try {
    // UPDATE واحد atomic، والمنتج المعطّل بيرجع 404
    const result = await pool.query<Product>(
      `UPDATE products
       SET ${sets.join(', ')}, updated_at = now()
       WHERE id = $${params.length} AND is_active = true
       RETURNING ${PRODUCT_COLUMNS}`,
      params,
    );

    if (!result.rows[0]) throw new AppError('Product not found', 404);
    return result.rows[0];
  } catch (error) {
    throw mapProductError(error); // sku مكرر ← 409
  }
}
export async function deleteProduct(id: number): Promise<void> {
  // UPDATE واحد atomic. الشرط is_active = true بيخلي الحذف المكرر 404 (نفس سلوك التصنيفات)
  const result = await pool.query(
    `UPDATE products
     SET is_active = false, updated_at = now()
     WHERE id = $1 AND is_active = true`,
    [id],
  );

  if (result.rowCount === 0) throw new AppError('Product not found', 404);
}