import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    return next(new AppError('Authentication required', 401));
  }
  if (req.auth.role !== 'admin') {
    return next(new AppError('Forbidden', 403));
  }
  return next();
}