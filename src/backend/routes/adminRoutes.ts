import { Router, Request, Response, NextFunction } from 'express';
import {
  listarRetiros, criarRetiro, atualizarRetiro, excluirRetiro,
  listarUsuarios, criarUsuario, atualizarUsuario, excluirUsuario,
} from '../controllers/adminController';

const router = Router();

/**
 * Middleware de proteção: apenas Gerente logado acessa rotas admin.
 * Usa a sessão criada no login (authController).
 */
function apenasGerente(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  if (!usuario || usuario.perfil !== 'Gerente') {
    return res.status(403).json({ erro: 'Acesso restrito ao Gerente.' });
  }
  next();
}

router.use(apenasGerente);

// Retiros
router.get('/retiros', listarRetiros);
router.post('/retiros', criarRetiro);
router.put('/retiros/:id', atualizarRetiro);
router.delete('/retiros/:id', excluirRetiro);

// Usuários
router.get('/usuarios', listarUsuarios);
router.post('/usuarios', criarUsuario);
router.put('/usuarios/:id', atualizarUsuario);
router.delete('/usuarios/:id', excluirUsuario);

export default router;
