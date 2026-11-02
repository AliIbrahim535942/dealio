import { NextFunction, Request, Response } from 'express';
import {
  getCategoryBySlug,
} from '../../services/categories.service';

export async function getCategoryBySlugController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await getCategoryBySlug(String(req.params.slug));
    res.status(200).json({ status: 'success', data: { category } });
  } catch (error) {
    next(error);
  }
}