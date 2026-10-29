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
import {
  googleAuthLimiter,
  loginLimiter,
  refreshLimiter,
  resendCodeAccountLimiter,
  resendCodeIpLimiter,
  signUpLimiter,
  verifyEmailAccountLimiter,
  verifyEmailIpLimiter,
} from '../middlewares/rateLimiter';
import { requireAdmin } from '../middlewares/requireAdmin';
import { googleAuthController, googleCallbackController } from '../controllers/auth/google.controller';
const router = Router();
router.post(
  '/sign-up',
  signUpLimiter,
  validate(signUpSchema),
  signUpController,
);
router.post(
  '/login',
  loginLimiter,
  validate(localLogInSchema),
  loginController,
);
router.post('/refresh', refreshLimiter, refreshController);
router.post('/logout', logoutController);
router.get('/me', authenticate, meController);
router.post(
  '/verify-email',
  verifyEmailIpLimiter,
  verifyEmailAccountLimiter,
  validate(verifyEmailSchema),
  verifyEmailController,
);
router.post(
  '/resend-code',
  resendCodeIpLimiter,
  resendCodeAccountLimiter,
  validate(resendCodeSchema),
  resendCodeController,
);
router.get('/google', googleAuthLimiter, googleAuthController);
router.get('/google/callback', googleAuthLimiter, googleCallbackController);
export default router;
