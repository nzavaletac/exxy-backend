import { Error } from 'mongoose';
import { RequestHandler } from 'express';
import { Expense } from '../models/expense';
import { Namespace } from '../models/namespace';
import { Category } from '../models/categories';
import { ResponseError } from '../utils/errorHandler';

export const create: RequestHandler = async (req, res, next) => {
  try {
    const {
      body,
      params: { namespaceId, categoryId },
      userId,
    } = req;

    const namespace = await Namespace.findOne({
      _id: namespaceId,
      user: userId,
    });

    if (!namespace) {
      next(new ResponseError('El gasto no pudo ser creado', 403));
      return;
    }

    const category = await Category.findOne({
      _id: categoryId,
      namespace: namespaceId,
    });

    if (!category) {
      next(new ResponseError('El gasto no pudo ser creado', 403));
      return;
    }

    const expense = await Expense.create({ ...body, category: categoryId });

    res
      .status(201)
      .json({ message: 'El gasto fue creado satisfactoriamente', expense });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e instanceof Error.ValidationError) {
      next(new ResponseError(e.message, 400));
      return;
    }
    res.status(500).json({ message: e.message });
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const {
      params: { namespaceId, categoryId },
      userId,
    } = req;

    const namespace = await Namespace.findOne({
      _id: namespaceId,
      user: userId,
    });

    if (!namespace) {
      next(new ResponseError('No se pueden ver los gastos', 403));
      return;
    }

    const category = await Category.findOne({
      _id: categoryId,
      namespace: namespaceId,
    });

    if (!category) {
      next(new ResponseError('No se pueden ver los gastos', 403));
      return;
    }

    const expenses = await Expense.find({ category: categoryId });

    res.status(200).json({
      message: `Se encontr${expenses.length === 1 ? 'ó' : 'aron'} ${
        expenses.length
      } gasto${expenses.length === 1 ? '' : 's'}`,
      expenses,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const show: RequestHandler = async (req, res, next) => {
  try {
    const {
      params: { namespaceId, categoryId, expenseId },
      userId,
    } = req;

    const namespace = await Namespace.findOne({
      _id: namespaceId,
      user: userId,
    });

    if (!namespace) {
      next(new ResponseError('No se puede ver el gasto', 403));
      return;
    }

    const category = await Category.findOne({
      _id: categoryId,
      namespace: namespaceId,
    });

    if (!category) {
      next(new ResponseError('No se puede ver el gasto', 403));
      return;
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      category: categoryId,
    });

    if (!expense) {
      next(new ResponseError('No se puede ver el gasto', 403));
      return;
    }

    res.status(200).json({ message: 'Se encontró 1 gasto', expense });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const {
      params: { namespaceId, expenseId, categoryId },
      body,
      userId,
    } = req;

    const namespace = await Namespace.findOne({
      _id: namespaceId,
      user: userId,
    });

    if (!namespace) {
      next(new ResponseError('El gasto no pudo ser actualizado', 403));
      return;
    }

    const category = await Category.findOne({
      _id: categoryId,
      namespace: namespaceId,
    });

    if (!category) {
      next(new ResponseError('El gasto no pudo ser actualizado', 403));
      return;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: expenseId, category: categoryId },
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!expense) {
      next(new ResponseError('El gasto no pudo ser actualizado', 403));
      return;
    }

    res.status(200).json({
      expense,
      message: 'El gasto fue actualizado satisfactoriamente',
    });
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
      params: { namespaceId, expenseId, categoryId },
      userId,
    } = req;

    const namespace = await Namespace.findOne({
      _id: namespaceId,
      user: userId,
    });

    if (!namespace) {
      next(new ResponseError('El gasto no pudo ser eliminado', 403));
      return;
    }

    const category = await Category.findOne({
      _id: categoryId,
      namespace: namespaceId,
    });

    if (!category) {
      next(new ResponseError('El gasto no pudo ser eliminado', 403));
      return;
    }

    const expense = await Expense.findOneAndDelete({
      _id: expenseId,
      category: categoryId,
    });

    if (!expense) {
      next(new ResponseError('El gasto no pudo ser eliminado', 403));
      return;
    }

    res.status(200).json({
      expense,
      message: 'El gasto fue eliminado satisfactoriamente',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
