import { NextFunction, Request, Response } from 'express';
import { getCategoryTree } from '../../services/categories.service';

export async function getCategoryTreeController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await getCategoryTree();
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (error) {
    next(error);
  }
}
