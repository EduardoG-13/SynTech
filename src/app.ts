import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.resolve(__dirname, 'public')));
app.use(routes);

app.use((error: Error & { statusCode?: number }, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.statusCode || 500;
  return res.status(status).json({
    error: error.message || 'Erro interno do servidor',
  });
});

export default app;
