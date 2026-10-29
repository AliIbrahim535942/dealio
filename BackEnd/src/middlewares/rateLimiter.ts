import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';
import { AppError } from '../utils/AppError';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

interface LimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export function createRateLimiter(options: LimiterOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    ...(options.keyGenerator && { keyGenerator: options.keyGenerator }),
    ...(options.skip && { skip: options.skip }),
    handler: (_req, _res, next) => {
      next(new AppError(options.message, 429));
    },
  });
}

// Prefer the authenticated user ID; fall back to the client IP for anonymous requests.
function getClientId(req: Request): string {
  if (req.auth?.userId) {
    return `user:${req.auth.userId}`;
  }
  return `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`;
}

// Use a normalized email when available; fall back to the client IP for invalid input.
function getEmailKey(req: Request): string {
  const email = req.body?.email;
  if (typeof email === 'string' && email.trim()) {
    return `email:${email.trim().toLowerCase()}`;
  }
  return `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`;
}

// Authentication endpoints use IP-based limits.
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

export const signUpLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many sign-up attempts, please try again later',
});

export const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: 'Too many refresh requests, please try again later',
});

// Verification and resend endpoints apply separate IP- and email-based limits.
export const verifyEmailIpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many verification attempts, please try again later',
});

export const verifyEmailAccountLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: getEmailKey,
  message: 'Too many verification attempts, please try again later',
});

export const resendCodeIpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: 'Too many requests, please try again later',
});

export const resendCodeAccountLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  keyGenerator: getEmailKey,
  message: 'Too many requests, please try again later',
});

// Apply this limiter after authentication so identified users are keyed by user ID.
export const mutationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  keyGenerator: getClientId,
  skip: (req) => SAFE_METHODS.has(req.method),
  message: 'Too many write operations, please wait and retry',
});
export const googleAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: 'Too many requests, please try again later',
});