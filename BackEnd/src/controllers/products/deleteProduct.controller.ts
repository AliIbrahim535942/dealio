import type { NextFunction, Request, Response } from 'express';
import { deleteProduct } from '../../services/product.service';

export async function deleteProductController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteProduct(Number(req.params.id));

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}