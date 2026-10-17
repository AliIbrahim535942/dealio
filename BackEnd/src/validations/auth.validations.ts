import { email, z } from 'zod';

// Reusable field validators

// Email must be valid format
const emailValidator = z
  .string({ message: 'Email is required' })
  .trim()
  .email('Invalid email format');

// Name basic validation
const nameValidator = z
  .string({ message: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters');
// Password validation
const passwordValidator = z
  .string({ message: 'Password is required' })
  .min(10, 'Password must be at least 10 characters long')
  .max(128, 'Password must be at most 128 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    'Password must include uppercase, lowercase, number, and special character',
  );

// POST /api/auth/sign-up
export const signUpSchema = z.object({
  body: z.object({
    email: emailValidator,
    full_name: nameValidator,
    password: passwordValidator,
    phone: z
      .string({ message: 'Phone number is required' })
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format'),
  }),
});

export const localLogInSchema = z.object({
  body: z.object({
    email: emailValidator,
    password: z
      .string({ message: 'Password is required' })
      .max(128, 'Password must be at most 128 characters long'),
  }),
});

export type signUpBody = z.infer<typeof signUpSchema>['body'];
export type localLogInSchemaBody = z.infer<typeof localLogInSchema>['body'];
