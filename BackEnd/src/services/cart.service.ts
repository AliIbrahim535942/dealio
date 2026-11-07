import pool from '../config/database';

import {Cart} from '../types/api.types'
export async function getCart(userId: number): Promise<Cart> {
  const result = await pool.query(
    `SELECT
       p.id AS product_id,
       p.name,
       p.slug,
       p.price,
       p.stock_quantity,
       ci.quantity,
       (p.price * ci.quantity) AS line_total,
       (p.is_active AND p.stock_quantity >= ci.quantity) AS available,
       (
         SELECT pi.image_url
         FROM product_images pi
         WHERE pi.product_id = p.id
         ORDER BY pi.is_primary DESC, pi.display_order ASC
         LIMIT 1
       ) AS primary_image,
       SUM(
         CASE WHEN p.is_active AND p.stock_quantity >= ci.quantity
              THEN p.price * ci.quantity ELSE 0 END
       ) OVER () AS subtotal
     FROM cart c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     WHERE c.user_id = $1
     ORDER BY ci.created_at ASC, ci.id ASC`,
    [userId],
  );

  const rows = result.rows;

  return {
    items: rows.map(({ subtotal, ...item }) => item),
    subtotal: rows[0]?.subtotal ?? '0.00',
  };
}