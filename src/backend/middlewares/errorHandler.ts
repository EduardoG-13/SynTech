import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  // Logs do erro interno para monitoramento, apenas se não for teste puro calado
  if (process.env.NODE_ENV !== 'test') {
    console.error('Erro Interno do Servidor:', err);
  }

  // Retorna uma mensagem genérica para erros não tratados (500)
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}
