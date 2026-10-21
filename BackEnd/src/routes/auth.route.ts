import { Router } from 'express';
import { validate } from '../middlewares/validate';
import {
  localLogInSchema,
  signUpSchema,
} from '../validations/auth.validations';
import { signUpController } from '../controllers/auth/signup.controller';
import { loginController } from '../controllers/auth/login.controller';
import { refreshController } from '../controllers/auth/refresh.controller';
import { logoutController } from '../controllers/auth/logout.controller';
const router = Router();
router.post('/sign-up', validate(signUpSchema), signUpController);
router.post('/login', validate(localLogInSchema), loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
export default router;
