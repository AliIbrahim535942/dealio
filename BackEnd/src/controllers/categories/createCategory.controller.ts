import { NextFunction, Request, Response } from 'express';
import { createCategory } from '../../services/categories.service';
import { createCategoryBody } from '../../validations/categories.validations';
import { AppError } from '../../utils/AppError';

export async function createCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as createCategoryBody;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const images = files?.images ?? [];

    if (images.length > 1) {
      throw new AppError('A category accepts only one image', 400);
    }

    const category = await createCategory({ ...body, image: images[0] });

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}