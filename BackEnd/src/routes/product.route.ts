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
  productIdParamSchema,
  productSlugParamSchema,
  updateProductSchema,
} from '../validations/products.validations';
import { createProductController } from '../controllers/products/createProduct.controller';
import { getProductBySlugController } from '../controllers/products/getProductBySlug.controller';
import { listProductsController } from '../controllers/products/getAllProducts.controller';
import { updateProductController } from '../controllers/products/updateProduct.controller';
import { deleteProductController } from '../controllers/products/deleteProduct.controller';

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
router.patch(
  '/:id',
  authenticate,
  // requireAdmin,
  mutationLimiter,
  validate(updateProductSchema),
  updateProductController,
);
router.delete(
  '/:id',
  authenticate,
  // requireAdmin,
  mutationLimiter,
  validate(productIdParamSchema),
  deleteProductController,
);
export default router;
