import crypto, { randomUUID } from 'crypto';
import { config } from '../config/env';
import jwt, {
  JsonWebTokenError,
  SignOptions,
  TokenExpiredError,
} from 'jsonwebtoken';
import pool from '../config/database';
import z, { ZodError } from 'zod';

interface TokenMeta {
  userAgent?: string;
  ipAddress?: string;
}
export const USER_AUTH_COOKIE_NAME = 'dealio_token';
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
  await pool.query(query, values);
  return token;
}
export async function issueTokens(user: JwtPayload, meta: TokenMeta) {
  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user.userId, meta);
  return { accessToken, refreshToken };
}
