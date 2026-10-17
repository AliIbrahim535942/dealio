import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AppError } from '../../utils/AppError';
import { UserToLogin } from '../../types/api.types';

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  passport.authenticate(
    'local',
    { session: false },
    (
      err: Error | null,
      user: UserToLogin | false,
      info?: { message?: string },
    ) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return next(new AppError(info?.message ?? 'Invalid credentials', 401));
      }

      return res.status(200).json({
        status: 'success',
        message: 'login successful',
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    },
  )(req, res, next);
}
