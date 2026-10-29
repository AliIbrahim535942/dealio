import crypto from 'crypto';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { config } from '../../config/env';
import {
  createRefreshToken,
  refreshCookieOptions,
  USER_AUTH_COOKIE_NAME,
} from '../../services/token.service';

const OAUTH_STATE_COOKIE = 'oauth_state';

function stateCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.app.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/api/auth/google',
  };
}

function isValidState(fromCookie: unknown, fromQuery: unknown): boolean {
  if (
    typeof fromCookie !== 'string' ||
    typeof fromQuery !== 'string' ||
    !fromCookie ||
    fromCookie.length !== fromQuery.length
  ) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(fromCookie),
    Buffer.from(fromQuery),
  );
}

// Start the OAuth flow by generating a one-time state value and redirecting
// the user to Google for authentication.
export function googleAuthController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie(OAUTH_STATE_COOKIE, state, {
    ...stateCookieOptions(),
    maxAge: 10 * 60 * 1000,
  });
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
    state,
  })(req, res, next);
}

// Handle Google's callback, validate the state value to prevent CSRF attacks,
// and issue the application's refresh-token cookie after successful login.
export function googleCallbackController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const fail = (code: string) =>
    res.redirect(`${config.app.frontendUrl}/login?error=${code}`);

  const cookieState = req.cookies?.[OAUTH_STATE_COOKIE];
  res.clearCookie(OAUTH_STATE_COOKIE, stateCookieOptions());
  if (!isValidState(cookieState, req.query.state)) {
    return fail('invalid_state');
  }

  passport.authenticate(
    'google',
    { session: false },
    async (err: Error | null, user: { id: number } | false) => {
      try {
        if (err || !user) {
          if (err) console.error('[Google OAuth] auth failed:', err);
          return fail('google_auth_failed');
        }

        const refreshToken = await createRefreshToken(user.id, {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        });

        res.cookie(USER_AUTH_COOKIE_NAME, refreshToken, refreshCookieOptions());
        res.setHeader('Cache-Control', 'no-store');
        return res.redirect(`${config.app.frontendUrl}/auth/callback`);
      } catch (error) {
        console.error('[Google OAuth] token issuing failed:', error);
        return fail('google_auth_failed');
      }
    },
  )(req, res, next);
}
