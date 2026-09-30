//error handler replaces handling all errors the main module
// Here we have two type of Errors Operational (AppError) and Programming 
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const shouldLog = nodeEnv !== 'test';
  const exposeStack = nodeEnv === 'development';

  // Operational error
  if (err instanceof AppError) {
    if (shouldLog) {
      console.error(`[${req.method} ${req.originalUrl}]`, err);
    }

    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      ...(exposeStack && { stack: err.stack }),
    });

    return;
  }

  // Programming / unexpected error
  if (shouldLog) {
    console.error(
      `[${req.method} ${req.originalUrl}] Unexpected error:`,
      err,
    );
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(exposeStack && { stack: err.stack }),
  });
}