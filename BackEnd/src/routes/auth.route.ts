import { Router } from 'express';
import { validate } from '../middlewares/validate';
import {
  localLogInSchema,
  resendCodeSchema,
  signUpSchema,
  verifyEmailSchema,
} from '../validations/auth.validations';
import { signUpController } from '../controllers/auth/signup.controller';
import { loginController } from '../controllers/auth/login.controller';
import { refreshController } from '../controllers/auth/refresh.controller';
import { logoutController } from '../controllers/auth/logout.controller';
import { meController } from '../controllers/auth/me.controller';
import { authenticate } from '../middlewares/authenticate';
import { verifyEmailController } from '../controllers/auth/verifyEmail.controller';
import { resendCodeController } from '../controllers/auth/resendCode.controller';
const router = Router();
router.post('/sign-up', validate(signUpSchema), signUpController);
router.post('/login', validate(localLogInSchema), loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.get('/me', authenticate, meController);
router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  verifyEmailController,
);
router.post('/resend-code', validate(resendCodeSchema), resendCodeController);
export default router;
