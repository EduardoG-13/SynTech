import { NextFunction, Request, Response } from 'express';

function resolverRedirectPath(path: string, req: Request) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_match, paramName) => {
    const value = req.params[paramName];
    return value ? encodeURIComponent(String(value)) : '';
  });
}

export function checkRoleRedirect(perfisPermitidos: string[], redirectPath = '/') {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req.session as any)?.usuario;
    const perfil = usuario?.perfil;

    if (perfil && perfisPermitidos.includes(perfil)) {
      return next();
    }

    return res.redirect(resolverRedirectPath(redirectPath, req));
  };
}
