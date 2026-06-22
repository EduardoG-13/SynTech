import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/**
 * Middleware para validar a presença de campos no req.body, req.query ou req.params.
 * Lança um erro 400 (Bad Request) caso algum dos campos falte.
 */
export function validateFields(
  fields: string[],
  source: 'body' | 'query' | 'params' = 'body',
  customMessage?: string
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = req[source];
    
    for (const field of fields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        const message = customMessage || `Campos obrigatórios não preenchidos`;
        return next(new AppError(400, message));
      }
    }
    
    next();
  };
}
