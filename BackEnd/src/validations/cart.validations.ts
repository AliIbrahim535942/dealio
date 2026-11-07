import { z } from 'zod';

const MAX_ITEM_QUANTITY = 10;

const productIdValidator = z.coerce
  .number()
  .int('Invalid product id')
  .positive('Invalid product id');

const quantityValidator = z
  .number()
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(MAX_ITEM_QUANTITY, `Quantity cannot exceed ${MAX_ITEM_QUANTITY}`);

export const addCartItemSchema = z.object({
  body: z
    .object({
      product_id: z.number().int().positive(),
      quantity: quantityValidator.default(1),
    })
    .strict(),
});

export const updateCartItemSchema = z.object({
  params: z.object({ productId: productIdValidator }),
  body: z.object({ quantity: quantityValidator }).strict(),
});

export const cartItemParamSchema = z.object({
  params: z.object({ productId: productIdValidator }),
});

export type AddCartItemBody = z.infer<typeof addCartItemSchema>['body'];
export type UpdateCartItemBody = z.infer<typeof updateCartItemSchema>['body'];