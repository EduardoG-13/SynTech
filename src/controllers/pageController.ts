import path from 'path';
import { Request, Response } from 'express';

export const index = (_req: Request, res: Response): void => {
  res.type('html').sendFile(path.resolve(__dirname, '../views/index.ejs'));
};
