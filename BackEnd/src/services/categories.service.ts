import { CategoryDetails, CategoryNode, PublicCategory } from '../types/api.types';

import { withTransaction } from '../utils/withTransaction';
import { PoolClient } from 'pg';
import pool from '../config/database';
import { AppError } from '../utils/AppError';
import { slugify, slugWithSuffix } from '../utils/slugify';
import { Category } from '../types/api.types';
import { createCategoryBody,updateCategoryBody } from '../validations/categories.validations';
import {
  UploadedImage,
  uploadImage,
  cleanupRemoteUploads,
  cleanupLocalUploads,
} from './cloudinary.service'; 

const MAX_SLUG_ATTEMPTS = 10;
const MAX_BASE_SLUG_LENGTH = 100; // + suffix like "-10" stays under the 120 column limit

const PUBLIC_COLUMNS = 'id, name, slug, description, image_url, parent_id';
const CATEGORY_COLUMNS = `id, name, slug, description, image_url, parent_id,
  is_active, created_at, updated_at`;

export type CreateCategoryInput = createCategoryBody & {
  image?: Express.Multer.File;
};

type PersistCategoryData = {
  name: string;
  description?: string | null;
  parent_id?: number | null;
  image_url: string | null;
};
/**
 * ينقل منتجات تصنيف محذوف لأبوه، أو يفكّ ارتباطها إذا كان root.
 * لازم تُستدعى داخل نفس transaction، وبعد الـ UPDATE اللي بيعطّل التصنيف.
 */
async function reassignProductsToParent(
  client: PoolClient,
  categoryId: number,
  parentId: number | null,
): Promise<void> {
  if (parentId !== null) {
    // ON CONFLICT: المنتج ممكن يكون أصلاً بالأب، فما بنكرر الرابط
    await client.query(
      `INSERT INTO product_categories (product_id, category_id)
       SELECT product_id, $2
       FROM product_categories
       WHERE category_id = $1
       ON CONFLICT DO NOTHING`,
      [categoryId, parentId],
    );
  }

  await client.query(
    'DELETE FROM product_categories WHERE category_id = $1',
    [categoryId],
  );
}
/**
 * Cleanup must never mask the original error, so failures are only logged.
 */
async function runCleanup(
  label: string,
  task: () => Promise<void>,
): Promise<void> {
  try {
    await task();
  } catch (error) {
    console.error(`Cleanup failed (${label}):`, error);
  }
}

/**
 * Fast pre-check (before spending a Cloudinary upload on an invalid request).
 * The authoritative, race-safe check happens again inside the transaction.
 */
async function ensureActiveParent(parentId: number): Promise<void> {
  const result = await pool.query(
    'SELECT 1 FROM categories WHERE id=$1 AND is_active = true',
    [parentId],
  );
  if (result.rows.length === 0) {
    throw new AppError('Parent category not found', 404);
  }
}

/**
 * ON CONFLICT DO NOTHING keeps the transaction healthy on slug collisions
 * (a raw unique violation would abort the whole transaction).
 */
async function insertWithUniqueSlug(
  client: PoolClient,
  data: PersistCategoryData,
): Promise<Category> {
  const baseSlug = slugify(data.name)
    .slice(0, MAX_BASE_SLUG_LENGTH)
    .replace(/-+$/, '');

  if (!baseSlug) {
    throw new AppError('Name must contain at least one Latin letter or number', 400);
  }

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const result = await client.query<Category>(
      `INSERT INTO categories (name, slug, description, image_url, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO NOTHING
       RETURNING ${CATEGORY_COLUMNS}`,
      [
        data.name,
        slugWithSuffix(baseSlug, attempt),
        data.description ?? null,
        data.image_url,
        data.parent_id ?? null,
      ],
    );

    if (result.rows[0]) return result.rows[0];
  }

  throw new AppError('Could not generate a unique slug', 409);
}


function persistCategory(data: PersistCategoryData): Promise<Category> {
  return withTransaction(async (client) => {
    if (data.parent_id != null) {
      // FOR SHARE: the parent can't be deactivated until we commit
      const parent = await client.query(
        'SELECT 1 FROM categories WHERE id=$1 AND is_active = true FOR SHARE',
        [data.parent_id],
      );
      if (parent.rows.length === 0) {
        throw new AppError('Parent category not found', 404);
      }
    }

    return insertWithUniqueSlug(client, data);
  });
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  const { image, ...data } = input;
  let uploaded: UploadedImage | undefined;

  try {
    if (data.parent_id != null) {
      await ensureActiveParent(data.parent_id);
    }

    // Upload happens BEFORE the transaction: no pool connection is held during network I/O
    if (image) {
      uploaded = await uploadImage(image);
    }

    return await persistCategory({
      ...data,
      image_url: uploaded?.url ?? null,
    });
  } catch (error) {
    if (uploaded) {
      const { publicId } = uploaded;
      await runCleanup('remote', () => cleanupRemoteUploads([publicId]));
    }
    throw error;
  } finally {
    if (image) {
      await runCleanup('local', () => cleanupLocalUploads([image]));
    }
  }
}
// Serializes operations that restructure the tree (delete now, move later)
const TREE_LOCK_KEY = 'categories:tree';

export async function deleteCategory(
  id: number,
): Promise<{ category: Category; reparentedChildren: number }> {
  return withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      TREE_LOCK_KEY,
    ]);

    const target = await client.query<{ parent_id: number | null }>(
      'SELECT parent_id FROM categories WHERE id=$1 AND is_active = true FOR UPDATE',
      [id],
    );
    if (target.rows.length === 0) {
      throw new AppError('Category not found', 404);
    }
    const { parent_id } = target.rows[0];

    // Children inherit the deleted category's parent (NULL when it was a root)
    const moved = await client.query(
      'UPDATE categories SET parent_id=$1, updated_at=now() WHERE parent_id=$2',
      [parent_id, id],
    );

    const deleted = await client.query<Category>(
      `UPDATE categories SET is_active = false, updated_at = now()
       WHERE id=$1
       RETURNING ${CATEGORY_COLUMNS}`,
      [id],
    );

    // منتجات التصنيف المحذوف بتنتقل لأبوه (أو بتنفك إذا root)
    await reassignProductsToParent(client, id, parent_id);

    return {
      category: deleted.rows[0],
      reparentedChildren: moved.rowCount ?? 0,
    };
  });
}


/**
 * One recursive query for the whole tree (no N+1).
 * `path` guards against infinite recursion if a cycle ever existed.
 */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const result = await pool.query<PublicCategory>(
    `WITH RECURSIVE tree AS (
       SELECT ${PUBLIC_COLUMNS}, 0 AS depth, ARRAY[id] AS path
       FROM categories
       WHERE parent_id IS NULL AND is_active = true
       UNION ALL
       SELECT c.id, c.name, c.slug, c.description, c.image_url, c.parent_id,
              t.depth + 1, t.path || c.id
       FROM categories c
       JOIN tree t ON c.parent_id = t.id
       WHERE c.is_active = true AND NOT (c.id = ANY(t.path))
     )
     SELECT ${PUBLIC_COLUMNS} FROM tree ORDER BY depth, name`,
  );

  // Rows are ordered by depth, so a parent is always registered before its children
  const nodes = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const row of result.rows) {
    const node: CategoryNode = { ...row, children: [] };
    nodes.set(node.id, node);

    if (row.parent_id === null) {
      roots.push(node);
    } else {
      nodes.get(row.parent_id)?.children.push(node);
    }
  }

  return roots;
}

async function getAncestors(
  parentId: number,
): Promise<CategoryDetails['ancestors']> {
  const result = await pool.query<CategoryDetails['ancestors'][number]>(
    `WITH RECURSIVE ancestors AS (
       SELECT id, name, slug, parent_id, 1 AS level, ARRAY[id] AS path
       FROM categories
       WHERE id = $1
       UNION ALL
       SELECT c.id, c.name, c.slug, c.parent_id, a.level + 1, a.path || c.id
       FROM categories c
       JOIN ancestors a ON c.id = a.parent_id
       WHERE NOT (c.id = ANY(a.path))
     )
     SELECT id, name, slug FROM ancestors ORDER BY level DESC`,
    [parentId],
  );
  return result.rows; // root first, direct parent last
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDetails> {
  const found = await pool.query<PublicCategory>(
    `SELECT ${PUBLIC_COLUMNS} FROM categories WHERE slug=$1 AND is_active = true`,
    [slug],
  );
  const category = found.rows[0];
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const [children, ancestors] = await Promise.all([
    pool.query<PublicCategory>(
      `SELECT ${PUBLIC_COLUMNS} FROM categories
       WHERE parent_id=$1 AND is_active = true
       ORDER BY name`,
      [category.id],
    ),
    category.parent_id === null
      ? Promise.resolve([])
      : getAncestors(category.parent_id),
  ]);

  return { ...category, ancestors, children: children.rows };
}
export async function updateCategory(
  id: number,
  input: updateCategoryBody,
): Promise<Category> {
  const hasDescription = input.description !== undefined;

  // Single atomic statement: absent fields keep their current value
  const result = await pool.query<Category>(
    `UPDATE categories
     SET name = COALESCE($2::varchar, name),
         description = CASE WHEN $3::boolean THEN $4::text ELSE description END,
         updated_at = now()
     WHERE id = $1 AND is_active = true
     RETURNING ${CATEGORY_COLUMNS}`,
    [id, input.name ?? null, hasDescription, input.description ?? null],
  );

  if (result.rows.length === 0) {
    throw new AppError('Category not found', 404);
  }
  return result.rows[0];
}