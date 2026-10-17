import { Request, Response, NextFunction } from 'express';
import { signUpBody } from '../../validations/auth.validations';
import { createCustomer } from '../../services/customer.service';

/**
 * POST /api/auth/sign-up
 */
export async function signUpController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, full_name, password, phone } = req.body as signUpBody;

    const user = await createCustomer({ email, full_name, password, phone });
    res.status(201).json({
      status: 'success',
      message: 'new customer created successfully',
      data: {
        name: user.full_name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}
