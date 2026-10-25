import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';
import { findUserById } from '../../services/customer.service';

export async function meController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.auth) {
      throw new AppError('Authentication required', 401);
    }

    const user = await findUserById(req.auth.userId);
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      status: 'success',
      message: 'user fetched successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}