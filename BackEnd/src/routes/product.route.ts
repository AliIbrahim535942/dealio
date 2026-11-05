import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { mutationLimiter } from '../middlewares/rateLimiter';
import { uploadMedia } from '../middlewares/uploadMedia';
import { cleanupUploads } from '../middlewares/cleanupUploads';
import { validate } from '../middlewares/validate';
import {
  createProductSchema,
  productSlugParamSchema,
} from '../validations/products.validations';
import { createProductController } from '../controllers/products/createProduct.controller';
import { getProductBySlugController } from '../controllers/products/getProductBySlug.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  //   requireAdmin,
  mutationLimiter,
  uploadMedia,
  cleanupUploads,
  validate(createProductSchema),
  createProductController,
);
router.get(
  '/:slug',
  validate(productSlugParamSchema),
  getProductBySlugController,
);
export default router;
