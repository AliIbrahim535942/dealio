import { signUpBody } from '../validations/auth.validations';
import {
  CustomerInfoResponse,
  UserProfile,
  UserToLogin,
} from '../types/api.types';
import pool from '../config/database';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';
import { sendEmail } from '../utils/sendEmail';
import crypto from 'crypto';
const INVALID_CODE = 'Invalid or expired verification code';

/**
 * POST api/auth/sign-up
 * create a new customer and send verification code to the customer's email
 */
export async function createCustomer(
  info: signUpBody,
): Promise<CustomerInfoResponse> {
  const { email, full_name, password, phone } = info;
  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [
    email,
  ]);
  // rowCount is typed as number | null by pg; treat null as 0 to satisfy strict checks
  if ((existing.rowCount ?? 0) > 0) {
    throw new AppError('Email already exists', 400);
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const email_verification_code = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();
  const verification_code_timestamp = new Date(Date.now() + CODE_TTL_MS); // 10 minutes expiry
  const query = `INSERT INTO users (full_name, email, password,auth_provider, role,phone, is_active,is_email_verified,email_verification_code,verification_code_timestamp)
     VALUES ($1,$2,$3,'local','customer',$4,true,false,$5,$6)
     RETURNING id, email, full_name, role,phone`;
  const values = [
    full_name,
    email,
    hashedPassword,
    phone,
    email_verification_code,
    verification_code_timestamp,
  ];
  const result = await pool.query(query, values);
  await sendEmail(
    email,
    'Verification Code',
    `Welcome to Dealio Platform.\n\nYour verification code is: ${email_verification_code}\n\nThis code is valid for 10 minutes.`,
    'verificationEmail',
    { email_verification_code, year: new Date().getFullYear() },
  );

  return result.rows[0];
}

export async function findUserByEmail(
  email: string,
): Promise<UserToLogin | null> {
  const query = `SELECT id, email, password, role, is_active, is_email_verified FROM users WHERE email=$1`;
  const result = await pool.query(query, [email]);
  const user = result.rows[0] ?? null;
  return user;
}

export async function findUserById(id: number): Promise<UserProfile | null> {
  const query = `
    SELECT id, full_name, email, role, phone, auth_provider, is_email_verified, created_at
    FROM users
    WHERE id = $1 AND is_active = true
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] ?? null;
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  const result = await pool.query(
    `SELECT id, email_verification_code, verification_code_timestamp, is_email_verified
     FROM users
     WHERE email = $1 AND is_active = true`,
    [email],
  );
  const user = result.rows[0];

  if (
    !user ||
    user.is_email_verified ||
    !user.email_verification_code ||
    !user.verification_code_timestamp
  ) {
    throw new AppError(INVALID_CODE, 400);
  }

  const isMatch = user.email_verification_code === code;
  const isExpired = new Date(user.verification_code_timestamp) < new Date();

  if (!isMatch || isExpired) {
    throw new AppError(INVALID_CODE, 400);
  }

  const update = await pool.query(
    `UPDATE users
     SET is_email_verified = true,
         email_verification_code = NULL,
         verification_code_timestamp = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND email_verification_code = $2`,
    [user.id, code],
  );
  if (update.rowCount === 0) {
    throw new AppError(INVALID_CODE, 400);
  }
}
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS =  60 * 1000;

export async function resendVerificationCode(email: string): Promise<void> {
  const result = await pool.query(
    `SELECT id, full_name, is_email_verified, verification_code_timestamp
     FROM users
     WHERE email = $1 AND is_active = true`,
    [email],
  );
  const user = result.rows[0];

  if (!user || user.is_email_verified) {
    return;
  }
  if (user.verification_code_timestamp) {
    const sentAt =
      new Date(user.verification_code_timestamp).getTime() - CODE_TTL_MS;
    if (Date.now() - sentAt < RESEND_COOLDOWN_MS) {
      return;
    }
  }
  const email_verification_code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await pool.query(
    `UPDATE users
     SET email_verification_code = $1,
         verification_code_timestamp = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND is_email_verified = false`,
    [email_verification_code, expiresAt, user.id],
  );
  await sendEmail(
    email,
    'Verification Code',
    `Welcome to Dealio Platform.\n\nYour verification code is: ${email_verification_code}\n\nThis code is valid for 10 minutes.`,
    'verificationEmail',
    { email_verification_code, year: new Date().getFullYear() },
  );
}
