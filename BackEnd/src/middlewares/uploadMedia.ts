import multer from 'multer';
import { Request, RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import fs from 'fs';
import path from 'path';

/**
 * Use disk storage to avoid loading large uploads fully into memory
 */
const uploadDir = path.resolve(process.cwd(), 'tmp/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

/**
 * Allowed mime types
 */
const allowedImageTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * File filter for security
 */
function fileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (file.fieldname === 'images') {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new AppError('Invalid image type. Only jpg, jpeg, png, webp allowed', 400),
      );
    }
  }

  cb(null, true);
}

/**
 * Multer configuration
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const handler = upload.fields([{ name: 'images', maxCount: 3 }]);

/**
 * Middleware: same name as before, but converts multer errors to AppError (400)
 */
export const uploadMedia: RequestHandler = (req, res, next) => {
  handler(req, res, (error?: unknown) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Image is too large (max 5MB)'
          : error.code === 'LIMIT_UNEXPECTED_FILE'
            ? 'Too many images or unexpected file field'
            : 'Invalid file upload';
      return next(new AppError(message, 400));
    }
    next(error);
  });
};