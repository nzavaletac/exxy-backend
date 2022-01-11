import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './utils/errorHandler';
import { baseRouter } from './routes';
import { userRouter } from './routes/user';

dotenv.config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV !== 'production'
      ? `.env.${process.env.NODE_ENV}`
      : '.env'
  ),
});

export const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/users', userRouter);
app.use('/', baseRouter);

app.use(errorHandler);
