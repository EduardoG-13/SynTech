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

  // 1) Tenta o JWT (Bearer) se presente
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length);
    try {
      req.usuario = jwt.verify(token, authConfig.accessSecret) as JwtUserPayload;
      return next();
    } catch {
      // token inválido/expirado: tenta a sessão abaixo antes de barrar
    }
  }

  // 2) Fallback de SESSÃO (cookie) — o app é session-first; toda tela cria sessão no login.
  //    Isso faz as páginas (tarefas, boletas, dashboard) funcionarem sem depender do Bearer.
  const sessUsuario = (req.session as any)?.usuario;
  if (sessUsuario) {
    req.usuario = sessUsuario as JwtUserPayload;
    return next();
  }

  return res.status(401).json({ erro: 'Token de acesso ausente.' });
}
