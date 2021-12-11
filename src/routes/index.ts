import express from 'express';
import { greet } from '../controllers';

const baseRouter = express.Router();

baseRouter.route('/').get(greet);

export { baseRouter };
