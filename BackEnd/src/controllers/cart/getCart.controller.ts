import { NextFunction, Request, Response } from 'express';
import { getCart } from '../../services/cart.service';

export async function getCartController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cart = await getCart(req.auth!.userId);
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ status: 'success', data: cart });
  } catch (error) {
    next(error);
  }
}