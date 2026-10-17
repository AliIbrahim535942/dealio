import { Router } from 'express';
import { validate } from '../middlewares/validate';
import {signUpSchema} from '../validations/auth.validations';
import { signUpController } from '../controllers/auth/signup.controller';
const router = Router();
router.post('/sign-up', validate(signUpSchema), signUpController);

export default router;
