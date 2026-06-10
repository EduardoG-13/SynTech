import { Request, Response, NextFunction } from 'express';

/**
 * authView.ts
 * Middleware de proteção das rotas de view (EJS).
 *
 * - Se não houver sessão (usuário não fez login), redireciona para a tela de login (/).
 * - Aceita parâmetros para restringir o acesso por perfil.
 *
 * IMPORTANTE: o ?perfil=X da query string NÃO é confiável, é só visual.
 * A verdade do perfil vem de req.session.usuario.perfil, criado no POST /api/auth/login.
 */

export interface UsuarioSessao {
  id: string;
  nome: string;
  perfil: 'Gerente' | 'Coordenador' | 'Capataz' | 'Tecnico' | 'Infraestrutura';
  retiro_id?: string | null;
  is_admin?: boolean;  // true = Gerente ADM master (acessa /configuracoes)
}

/**
 * Middleware genérico: exige login. Opcionalmente filtra por perfis permitidos.
 *
 * Uso:
 *   app.get('/dashboard', requireLogin(['Gerente', 'Coordenador']), handler);
 *   app.get('/tarefas',  requireLogin(),                            handler);
 */
export function requireLogin(perfisPermitidos?: string[], opcoes?: { exigeAdmin?: boolean }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req.session as any)?.usuario as UsuarioSessao | undefined;

    if (!usuario) {
      // Não logado — manda pra tela de login
      return res.redirect('/');
    }

    // Se uma lista de perfis foi passada, valida
    if (perfisPermitidos && perfisPermitidos.length > 0) {
      if (!perfisPermitidos.includes(usuario.perfil)) {
        return res.status(403).render('acesso-negado', {
          perfil: usuario.perfil,
          perfilNecessario: perfisPermitidos.join(' / '),
        });
      }
    }

    // Se exigeAdmin=true, só Gerente com is_admin passa
    if (opcoes?.exigeAdmin && !usuario.is_admin) {
      return res.status(403).render('acesso-negado', {
        perfil: usuario.perfil,
        perfilNecessario: 'Gerente Administrador',
      });
    }

    (res.locals as any).usuarioLogado = usuario;
    next();
  };
}
