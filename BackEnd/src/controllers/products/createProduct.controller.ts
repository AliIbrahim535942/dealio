import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { createProduct } from '../../services/product.service';
import {  type CreateProductInput} from '../../validations/products.validations'
const MAX_PRODUCT_IMAGES = 3;

// uploadMedia may assign req.files as an array (.array) or an object (.fields), so support both shapes.
function getUploadedImages(req: Request): Express.Multer.File[] {
  const files = req.files;
  if (!files) return [];
  return Array.isArray(files) ? files : (files['images'] ?? []);
}

export async function createProductController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const images = getUploadedImages(req);

    if (images.length > MAX_PRODUCT_IMAGES || images.length < 1) {
      throw new AppError(
        `A product can have at most ${MAX_PRODUCT_IMAGES} images and at least 1`,
        400,
      );
    }

    const product = await createProduct(req.body as CreateProductInput, images);

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}
