import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AppError } from '../../utils/AppError';
import { UserToLogin } from '../../types/api.types';
import {
  issueTokens,
  refreshCookieOptions,
  USER_AUTH_COOKIE_NAME,
} from '../../services/token.service';
import { config } from '../../config/env';

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  passport.authenticate(
    'local',
    { session: false },
    async (
      err: Error | null,
      user: UserToLogin | false,
      info?: { message?: string },
    ) => {
      try {
        if (err) throw err;
        if (!user) {
          throw new AppError(info?.message ?? 'Invalid credentials', 401);
        }
        const { accessToken, refreshToken } = await issueTokens(
          { userId: user.id, role: user.role },
          { userAgent: req.headers['user-agent'], ipAddress: req.ip },
        );
        res.cookie(USER_AUTH_COOKIE_NAME, refreshToken, refreshCookieOptions());
        return res.status(200).json({
          status: 'success',
          message: 'login successful',
          data: {
            accessToken,
            user: { id: user.id, email: user.email, role: user.role },
          },
        });
      } catch (error) {
        next(error);
      }
    },
  )(req, res, next);
}
