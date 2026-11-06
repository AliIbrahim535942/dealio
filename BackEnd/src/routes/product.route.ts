import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { mutationLimiter } from '../middlewares/rateLimiter';
import { uploadMedia } from '../middlewares/uploadMedia';
import { cleanupUploads } from '../middlewares/cleanupUploads';
import { validate } from '../middlewares/validate';
import {
  createProductSchema,
  listProductsSchema,
  productSlugParamSchema,
} from '../validations/products.validations';
import { createProductController } from '../controllers/products/createProduct.controller';
import { getProductBySlugController } from '../controllers/products/getProductBySlug.controller';
import { listProductsController } from '../controllers/products/getAllProducts.controller';

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
router.get('/', validate(listProductsSchema), listProductsController);
export default router;
