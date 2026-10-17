import { Router } from 'express';
import { validate } from '../middlewares/validate';
import {localLogInSchema, signUpSchema} from '../validations/auth.validations';
import { signUpController } from '../controllers/auth/signup.controller';
import { loginController } from '../controllers/auth/login.controller';
const router = Router();
router.post('/sign-up', validate(signUpSchema), signUpController);
router.post('/login',validate(localLogInSchema),loginController)
export default router;
