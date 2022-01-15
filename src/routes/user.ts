import { register, login } from '../controllers/user';
import { Router } from 'express';

export const userRouter = Router();

userRouter.route('/register').post(register);
userRouter.route('/login').post(login);
