import { signUpBody } from '../validations/auth.validations';
import { CustomerInfoResponse } from '../types/api.types';
import pool from '../config/database';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';
import { sendEmail } from '../utils/sendEmail';
/**
 * POST api/auth/sign-up
 * create a new customer and send verification code to the customer's email
 */
export async function createCustomer(
  info: signUpBody,
): Promise<CustomerInfoResponse> {
  try {
    const { email, full_name, password, phone } = info;
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [
      email,
    ]);
    // rowCount is typed as number | null by pg; treat null as 0 to satisfy strict checks
    if ((existing.rowCount ?? 0) > 0) {
      throw new AppError('Email already exists', 400);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationCodeTimestamp = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    const query = `INSERT INTO users (full_name, email, password,auth_provider, role,phone, is_active,is_email_verified,email_verification_code,verificationCodeTimestamp)
     VALUES ($1,$2,$3,'local','customer',$4,false,false,$5,$6)
     RETURNING id, email, full_name, role,phone`;
    const values = [
      full_name,
      email,
      hashedPassword,
      phone,
      verificationCode,
      verificationCodeTimestamp,
    ];
    const result = await pool.query(query, values);
    await sendEmail(
      email,
      'Verification Code',
      `Welcome to Dealio Platform.\n\nYour verification code is: ${verificationCode}\n\nThis code is valid for 10 minutes.`,
      'verificationEmail',
      { verificationCode, year: new Date().getFullYear() },
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
}
