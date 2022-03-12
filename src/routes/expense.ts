import { Router } from 'express';
import { create, list, show, update, destroy } from '../controllers/expense';

export const expenseRouter = Router({ mergeParams: true });

expenseRouter.route('/').post(create).get(list);
expenseRouter.route('/:expenseId').get(show).put(update).delete(destroy);
