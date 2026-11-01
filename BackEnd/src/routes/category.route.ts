import { uploadMedia } from '../middlewares/uploadMedia'; 
import { cleanupUploads } from '../middlewares/cleanupUploads';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { mutationLimiter } from '../middlewares/rateLimiter';
import { createCategorySchema } from '../validations/categories.validations';
import { validate } from '../middlewares/validate';
import { Router } from 'express';
import { createCategoryController } from '../controllers/categories/createCategory.controller';

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
export default router