import cloudinary from '../config/cloudinary';
import streamifier from 'streamifier';
import { AppError } from '../utils/AppError';
import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import fsPromises from 'fs/promises';
export type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

/**
 * Upload single image to cloudinary
 */
export function uploadImage(file: Express.Multer.File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'dealio/images',
        resource_type: 'image',
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined,
      ) => {
        if (error || !result) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    if (file.buffer) {
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
      return;
    }

    if (!file.path) {
      reject(new AppError('No file buffer or path available for upload', 400));
      return;
    }

    fs.createReadStream(file.path).on('error', reject).pipe(uploadStream);
  });
}
/**
 * Upload multiple images to cloudinary
 */
export async function uploadImages(
  files: Express.Multer.File[],
): Promise<UploadedImage[]> {
  console.info(`[Cloudinary] Starting upload for ${files.length} image(s)`);

  const uploads = files.map(async (file, index) => {
    console.info(
      `[Cloudinary] Uploading image ${index + 1}/${files.length}: name="${file.originalname}", type="${file.mimetype}", size=${file.size} bytes`,
    );
    try {
      const uploaded = await uploadImage(file);
      console.info(
        `[Cloudinary] Upload success: name="${file.originalname}", public_id="${uploaded.publicId}", url="${uploaded.url}"`,
      );
      return uploaded;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Cloudinary error';
      console.error(
        `[Cloudinary] Upload failed: name="${file.originalname}", error="${message}"`,
      );
      throw error;
    }
  });

  const results = await Promise.all(uploads);

  console.info(`[Cloudinary] Completed upload for ${results.length} image(s)`);

  return results;
}

/**
 * Delete image from cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new AppError('Failed to delete image from cloudinary', 500);
  }
}
/**
 * Delete multiple images from cloudinary
 */
export async function deleteImages(publicIds: string[]): Promise<void> {
  if (!publicIds.length) return;

  const deletions = publicIds.map((id) => deleteImage(id));

  await Promise.all(deletions);
}
export async function cleanupRemoteUploads(
  cloudinaryPublicIds: string[],
): Promise<void> {
  if (cloudinaryPublicIds.length > 0) {
    try {
      await deleteImages(cloudinaryPublicIds);
    } catch (error) {
      console.warn(
        `[UploadCleanup] Cloudinary cleanup failed for ids=${cloudinaryPublicIds.join(',')}`,
        error,
      );
    }
  }
}
export async function cleanupLocalUploads(
  files: Express.Multer.File[],
): Promise<void> {
  const paths = files
    .map((file) => file.path)
    .filter((pathValue): pathValue is string => Boolean(pathValue));

  await Promise.all(
    paths.map(async (filePath) => {
      try {
        await fsPromises.unlink(filePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(
            `[UploadCleanup] Failed deleting temp file "${filePath}"`,
            error,
          );
        }
      }
    }),
  );
}
