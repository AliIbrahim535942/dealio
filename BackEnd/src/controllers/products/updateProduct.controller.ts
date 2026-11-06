import type { NextFunction, Request, Response } from 'express';
import {
  type UpdateProductInput,
} from '../../validations/products.validations';
import {updateProduct} from '../../services/product.service'
export async function updateProductController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await updateProduct(
      Number(req.params.id),
      req.body as UpdateProductInput,
    );

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}