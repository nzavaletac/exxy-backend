import { Router } from 'express';
import { create, list, update, destroy } from '../controllers/namespace';
import { authHandler } from '../utils/authHandler';
import { categoryRouter } from './categories';

export const namespaceRouter = Router();

namespaceRouter.use(authHandler);
namespaceRouter.route('/').post(create).get(list);
namespaceRouter.route('/:namespaceId').put(update).delete(destroy);

namespaceRouter.use('/:namespaceId/categories', categoryRouter);
