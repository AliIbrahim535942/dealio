import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError';
import {
  rotateRefreshToken,
  refreshCookieOptions,
  USER_AUTH_COOKIE_NAME,
} from '../../services/token.service';

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.[USER_AUTH_COOKIE_NAME];
    if (!token || typeof token !== 'string') {
      throw new AppError('Invalid refresh token', 401);
    }

    const { accessToken, refreshToken } = await rotateRefreshToken(token, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.cookie(USER_AUTH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).json({
      status: 'success',
      message: 'token refreshed',
      data: { accessToken },
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      res.clearCookie(USER_AUTH_COOKIE_NAME, { path: '/api/auth' });
    }
    next(error);
  }
}