import type { NextFunction, Request, Response } from 'express';
import {
  listProducts,

} from '../../services/product.service';
import {ListProductsQuery} from '../../validations/products.validations'
export async function listProductsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // validate كتب القيم المحوّلة (page/limit أرقام) على req.query
    const { items, meta } = await listProducts(
      req.query as unknown as ListProductsQuery,
    );

    res.status(200).json({ status: 'success', data: items, meta });
  } catch (error) {
    next(error);
  }
}