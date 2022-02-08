import { RequestHandler } from 'express';
import { Error } from 'mongoose';
import { Category } from '../models/categories';
import { Namespace } from '../models/namespace';
import { ResponseError } from '../utils/errorHandler';

export const create: RequestHandler = async (req, res, next) => {
  try {
    const {
      body,
      userId,
      params: { namespaceId },
    } = req;

    const namespace = await Namespace.findOne({
      _id: namespaceId,
      user: userId,
    });

    if (!namespace) {
      next(new ResponseError('La categoría no pudo ser creada', 403));
      return;
    }

    const category = await Category.create({
      ...body,
      namespace: namespace._id,
    });

    res.status(201).json({
      category,
      message: 'La categoría fue creada satisfactoriamente',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e instanceof Error.ValidationError) {
      next(new ResponseError(e.message, 400));
      return;
    }
    res.status(500).json({ message: 'something went wrong' });
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const {
      userId,
      params: { namespaceId },
    } = req;

    const namespace = await Namespace.findOne({
      _id: namespaceId,
      user: userId,
    });

    if (!namespace) {
      next(new ResponseError('No se pueden ver las categorías', 403));
      return;
    }

    const categories = await Category.find({ namespace: namespaceId });

    const message = `Se encontr${categories.length === 1 ? 'ó' : 'aron'} ${
      categories.length
    } categoría${categories.length === 1 ? '' : 's'}`;

    res.status(200).json({ categories, message });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).json({ message: 'something went wrong' });
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const {
      body,
      userId,
      params: { namespaceId, categoryId },
    } = req;

    if (body.namespace) {
      const namespace = await Namespace.findOne({
        _id: body.namespace,
        user: userId,
      });

      if (!namespace) {
        next(new ResponseError('La categoría no pudo ser actualizada', 403));
        return;
      }
    }

    {
      const namespace = await Namespace.findOne({
        _id: namespaceId,
        user: userId,
      });

      if (!namespace) {
        next(new ResponseError('La categoría no pudo ser actualizada', 403));
        return;
      }
    }

    const category = await Category.findOneAndUpdate(
      { _id: categoryId, namespace: namespaceId },
      body,
      { runValidators: true, new: true }
    );

    if (!category) {
      next(new ResponseError('La categoría no pudo ser actualizada', 403));
      return;
    }

    res.status(200).json({
      category,
      message: 'La categoría fue actualizada satisfactoriamente',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e instanceof Error.ValidationError) {
      next(new ResponseError(e.message, 400));
      return;
    }
    res.status(500).json({ message: 'something went wrong' });
  }
};

export const destroy: RequestHandler = async (req, res, next) => {
  try {
    const {
      userId,
      params: { categoryId, namespaceId },
    } = req;

    {
      const namespace = await Namespace.findOne({
        _id: namespaceId,
        user: userId,
      });

      if (!namespace) {
        next(new ResponseError('La categoría no pudo ser borrada', 403));
        return;
      }
    }

    const category = await Category.findOneAndDelete({
      _id: categoryId,
      namespace: namespaceId,
    });

    if (!category) {
      next(new ResponseError('La categoría no pudo ser borrada', 403));
      return;
    }

    res.status(200).json({
      category,
      message: 'La categoría fue borrada satisfactoriamente',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).json({ message: 'something went wrong' });
  }
};
