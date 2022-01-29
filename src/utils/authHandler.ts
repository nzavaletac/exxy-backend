import { RequestHandler } from 'express';
import jwt, { UserIdJwtPayload } from 'jsonwebtoken';
import { ResponseError } from './errorHandler';

export const authHandler: RequestHandler = (req, _res, next) => {
  const {
    headers: { authorization },
  } = req;

  if (!authorization) {
    next(new ResponseError('Su sesión expiró', 401));
    return;
  }

  const [, token] = authorization.split(' ');

  if (!token) {
    next(new ResponseError('Su sesión expiró', 401));
    return;
  }

  const { userId } = <UserIdJwtPayload>jwt.verify(token, process.env.SECRET);
  req.userId = userId;

  next();
};
