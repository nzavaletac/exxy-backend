import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { Error } from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/user';
import { ResponseError } from '../utils/errorHandler';

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      next(new ResponseError('El registro no pudo ser completado', 403));
      return;
    }

    if (user.isCompleted) {
      next(
        new ResponseError(
          'Este usuario ya completó su registro previamente',
          400
        )
      );
      return;
    }

    user.password = password;
    user.isCompleted = true;

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.SECRET, {
      expiresIn: 60 * 60 * 24 * 365,
    });

    res.status(200).json({
      message: 'El registro se ha completado satisfactoriamente',
      token,
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

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.isCompleted || !user.password) {
      next(new ResponseError('Email o contraseña inválida', 400));
      return;
    }

    const isVerified = await bcrypt.compare(password, user.password);

    if (!isVerified) {
      next(new ResponseError('Email o contraseña inválida', 400));
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET, {
      expiresIn: 60 * 60 * 24 * 365,
    });

    res.status(200).json({ message: 'Ingreso exitoso', token });
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
