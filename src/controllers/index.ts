import { Request, Response } from 'express';

export function greet(_req: Request, res: Response) {
  res.status(200).json({ message: 'App working correctly' });
}
