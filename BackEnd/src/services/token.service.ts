import crypto, { randomUUID } from 'crypto';
import { config } from '../config/env';
import jwt, {
  JsonWebTokenError,
  SignOptions,
  TokenExpiredError,
} from 'jsonwebtoken';
import pool from '../config/database';
import z, { ZodError } from 'zod';
import type { PoolClient } from 'pg';

interface TokenMeta {
  userAgent?: string;
  ipAddress?: string;
}
import { AppError } from '../utils/AppError';
const INVALID_REFRESH = 'Invalid refresh token';
export const USER_AUTH_COOKIE_NAME = 'dealio_token';
import { CookieOptions } from 'express';

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: config.refreshTokenMaxAgeMs(),
    path: '/api/auth',
  };
}
export const jwtPayloadSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(['admin', 'customer']),
});
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.accessTokenExpiresIn as SignOptions['expiresIn'],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    subject: String(payload.userId),
    jwtid: randomUUID(),
  });
}

export async function createRefreshToken(
  userId: number,
  meta: TokenMeta,
  client?: PoolClient,
): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + config.refreshTokenMaxAgeMs());
  const query = `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked, user_agent, ip_address) 
  VALUES ($1,$2,$3,false,$4,$5)`;
  const values = [
    userId,
    hashToken(token),
    expiresAt,
    meta.userAgent ?? null,
    meta.ipAddress ?? null,
  ];
  await (client ?? pool).query(query, values);
  return token;
}
export async function issueTokens(user: JwtPayload, meta: TokenMeta) {
  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user.userId, meta);
  return { accessToken, refreshToken };
}
export async function rotateRefreshToken(rawToken: string, meta: TokenMeta) {
  const client = await pool.connect();
  let inTransaction = false;
  try {
    await client.query('BEGIN');
    inTransaction = true;

    // 1. Find the token and lock its row.
    const found = await client.query(
      `SELECT id, user_id, expires_at, revoked
       FROM refresh_tokens
       WHERE token_hash = $1
       FOR UPDATE`,
      [hashToken(rawToken)],
    );
    const stored = found.rows[0];
    if (!stored) {
      throw new AppError(INVALID_REFRESH, 401);
    }

    // 2. A revoked token was reused, so revoke all sessions for the user.
    if (stored.revoked) {
      await client.query(
        `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`,
        [stored.user_id],
      );
      await client.query('COMMIT');
      inTransaction = false;
      throw new AppError(INVALID_REFRESH, 401);
    }

    // 3. Reject expired tokens.
    if (new Date(stored.expires_at) < new Date()) {
      throw new AppError(INVALID_REFRESH, 401);
    }

    // 4. Confirm the user still exists and is active, then use the current role.
    const userResult = await client.query(
      `SELECT id, role, is_active FROM users WHERE id = $1`,
      [stored.user_id],
    );
    const user = userResult.rows[0];
    if (!user || !user.is_active) {
      throw new AppError(INVALID_REFRESH, 401);
    }

    // 5. Revoke the old token and issue a new one.
    await client.query(
      `UPDATE refresh_tokens SET revoked = true WHERE id = $1`,
      [stored.id],
    );
    const refreshToken = await createRefreshToken(user.id, meta, client);
    await client.query('COMMIT');
    inTransaction = false;

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role as JwtPayload['role'],
    });
    return { accessToken, refreshToken };
  } catch (error) {
    if (inTransaction) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    client.release();
  }
}
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1 AND revoked = false`,
    [hashToken(rawToken)],
  );
}
