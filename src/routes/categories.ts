import { Router } from 'express';
import { create, list, update, destroy } from '../controllers/categories';

export const categoryRouter = Router({ mergeParams: true });

categoryRouter.route('/').post(create).get(list);
categoryRouter.route('/:categoryId').put(update).delete(destroy);
