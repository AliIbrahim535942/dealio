import { Request, Response, NextFunction } from 'express';
import { resendVerificationCode } from '../../services/customer.service';

export async function resendCodeController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await resendVerificationCode(req.body.email);
    return res.status(200).json({
      status: 'success',
      message:
        'If the account exists and is not verified, a new code has been sent',
    });
  } catch (error) {
    next(error);
  }
}