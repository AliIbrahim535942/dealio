import { Request, Response, NextFunction } from 'express';
import { verifyEmail } from '../../services/customer.service';

export async function verifyEmailController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, code } = req.body;
    await verifyEmail(email, code);
    return res.status(200).json({
      status: 'success',
      message: 'email verified successfully',
    });
  } catch (error) {
    next(error);
  }
}