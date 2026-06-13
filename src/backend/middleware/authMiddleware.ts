import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig, JwtUserPayload } from '../config/auth';

declare global {
  namespace Express {
    interface Request {
      usuario?: JwtUserPayload;
    }
  }
}

const publicApiPaths = new Set(['/health']);

export function autenticarJWT(req: Request, res: Response, next: NextFunction) {
  if (publicApiPaths.has(req.path)) {
    return next();
  }

  if (process.env.NODE_ENV === 'test' && process.env.AUTH_ENFORCE_IN_TEST !== 'true') {
    return next();
  }

  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de acesso ausente.' });
  }

  const token = authorization.slice('Bearer '.length);

  try {
    req.usuario = jwt.verify(token, authConfig.accessSecret) as JwtUserPayload;
    return next();
  } catch {
    return res.status(401).json({ erro: 'Token de acesso invalido ou expirado.' });
  }
}
