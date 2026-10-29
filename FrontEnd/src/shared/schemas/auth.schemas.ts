import { z } from 'zod';

const email = z.string().trim().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    'Use uppercase, lowercase, a number, and a special character',
  );

export const loginSchema = z.object({
  email,
  password: z.string().max(128, 'Password must be at most 128 characters'),
});

export const signUpSchema = z.object({
  email,
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number'),
});

export const verifyEmailSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const resendCodeSchema = z.object({ email });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;
