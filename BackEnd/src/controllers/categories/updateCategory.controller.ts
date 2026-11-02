import { NextFunction, Request, Response } from 'express';
import { updateCategory } from '../../services/categories.service';
import { updateCategoryBody } from '../../validations/categories.validations';

export async function updateCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const body = req.body as updateCategoryBody;
    const category = await updateCategory(id, body);

    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}