import { Request, Response, NextFunction } from 'express';
import {
  revokeRefreshToken,
  refreshCookieOptions,
  USER_AUTH_COOKIE_NAME,
} from '../../services/token.service';

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.[USER_AUTH_COOKIE_NAME];
    if (typeof token === 'string' && token) {
      await revokeRefreshToken(token);
    }

    const { maxAge, ...clearOptions } = refreshCookieOptions();
    res.clearCookie(USER_AUTH_COOKIE_NAME, clearOptions);

    return res.status(200).json({
      status: 'success',
      message: 'logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}
