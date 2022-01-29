import { Error } from 'mongoose';
import { RequestHandler } from 'express';
import { Namespace, INamespace } from '../models/namespace';
import { ResponseError } from '../utils/errorHandler';

export const create: RequestHandler = async (req, res, next) => {
  try {
    const { body, userId } = req;

    const namespace: INamespace = await Namespace.create({
      ...body,
      user: userId,
    });

    res
      .status(201)
      .json({ namespace, message: 'El espacio fue creado satisfactoriamente' });
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e instanceof Error.ValidationError) {
      next(new ResponseError(e.message, 400));
      return;
    }
    res.status(500).json({ message: e.message });
  }
};

export const list: RequestHandler = async (req, res) => {
  try {
    const { userId } = req;
    const namespaces: INamespace[] = await Namespace.find({ user: userId });

    const message = `Se encontr${namespaces.length === 1 ? 'ó' : 'aron'} ${
      namespaces.length
    } espacio${namespaces.length === 1 ? '' : 's'}`;
    res.status(200).json({ namespaces, message });
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const {
      params: { namespaceId },
      body,
      userId,
    } = req;

    const namespace = await Namespace.findOneAndUpdate(
      { _id: namespaceId, user: userId },
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!namespace) {
      next(new ResponseError('el espacio no pudo ser actualizado', 403));
      return;
    }

    res.status(200).json({ namespace, message: 'Espacio actualizado' });
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e instanceof Error.ValidationError) {
      next(new ResponseError(e.message, 400));
      return;
    }
    res.status(500).json({ message: e.message });
  }
};

export const destroy: RequestHandler = async (req, res, next) => {
  try {
    const {
      params: { namespaceId },
      userId,
    } = req;
    const userOwnNamespace = await Namespace.findOne({
      _id: namespaceId,
      user: userId,
    });

    if (!userOwnNamespace) {
      next(new ResponseError('El espacio no pudo ser borrado', 403));
      return;
    }

    const namespaces = await Namespace.find({ user: userId });

    if (!namespaces || namespaces.length <= 1) {
      next(
        new ResponseError(
          'El espacio no pudo ser borrado. debes tener al menos un espacio',
          400
        )
      );
      return;
    }

    const namespace = await Namespace.findByIdAndDelete(namespaceId);

    res.status(200).json({ namespace, message: 'Espacio borrado' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
