import fs from 'fs';
import { NextFunction, Request, Response } from 'express';

export function cleanupUploads(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.on('close', () => {
    const files = req.files;
    if (!files) return;

    const list = Array.isArray(files) ? files : Object.values(files).flat();
    for (const file of list) {
      if (file.path) {
        fs.unlink(file.path, () => {}); // best-effort cleanup
      }
    }
  });
  next();
}