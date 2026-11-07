import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { getCartController } from '../controllers/cart/getCart.controller';

const router = Router();

router.get('/', authenticate, getCartController);

export default router;