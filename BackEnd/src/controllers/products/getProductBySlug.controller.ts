import type { NextFunction, Request, Response } from 'express';
import { getProductBySlug } from '../../services/product.service';

export async function getProductBySlugController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await getProductBySlug(req.params.slug as string);

    res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}