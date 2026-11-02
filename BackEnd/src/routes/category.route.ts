import { updateCategoryController } from '../controllers/categories/updateCategory.controller';
import { getCategoryBySlugController } from '../controllers/categories/getCategoryBySlug.controller';
import { getCategoryTreeController } from '../controllers/categories/getCategories.controller';
import { uploadMedia } from '../middlewares/uploadMedia';
import { cleanupUploads } from '../middlewares/cleanupUploads';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { mutationLimiter } from '../middlewares/rateLimiter';
import {
  categoryIdParamSchema,
  createCategorySchema,
  categorySlugParamSchema,updateCategorySchema
} from '../validations/categories.validations';
import { validate } from '../middlewares/validate';
import { Router } from 'express';
import { createCategoryController } from '../controllers/categories/createCategory.controller';
import { deleteCategoryController } from '../controllers/categories/deleteCategory.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  // requireAdmin,
  mutationLimiter,
  uploadMedia,
  cleanupUploads,
  validate(createCategorySchema),
  createCategoryController,
);
router.delete(
  '/:id',
  authenticate,
  // requireAdmin,
  mutationLimiter,
  validate(categoryIdParamSchema),
  deleteCategoryController,
);

router.get('/', getCategoryTreeController);
router.get(
  '/:slug',
  validate(categorySlugParamSchema),
  getCategoryBySlugController,
);

router.patch(
  '/:id',
  authenticate,
  // requireAdmin,
  mutationLimiter,
  validate(updateCategorySchema),
  updateCategoryController,
);
export default router;
