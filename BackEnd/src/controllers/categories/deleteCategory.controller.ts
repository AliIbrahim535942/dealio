import { NextFunction, Request, Response } from 'express';
import { deleteCategory } from '../../services/categories.service';

export async function deleteCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const { category, reparentedChildren } = await deleteCategory(id);

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully',
      data: { category, reparented_children: reparentedChildren },
    });
  } catch (error) {
    next(error);
  }
}