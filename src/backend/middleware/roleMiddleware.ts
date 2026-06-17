import { Request, Response, NextFunction } from 'express';

export function checkRoleRedirect(roles: string[], redirectUrl?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const sess = (req.session as any)?.usuario;
    if (!sess) return res.redirect('/');
    
    if (!roles.includes(sess.perfil)) {
      if (redirectUrl) {
        // Exemplo: redirectUrl pode ser dinamico se a rota possuir params
        let url = redirectUrl;
        if (req.params.id) {
            url = url.replace(':id', String(req.params.id));
        }
        return res.redirect(url);
      }
      return res.status(403).render('acesso-negado', {
        perfil: sess.perfil,
        perfilNecessario: roles.join(' ou '),
      });
    }
    next();
  };
}
