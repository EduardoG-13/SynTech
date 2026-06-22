import { Router, Request, Response, NextFunction } from 'express';
import {
  listarRetiros, criarRetiro, atualizarRetiro, excluirRetiro,
  listarUsuarios, criarUsuario, atualizarUsuario, excluirUsuario,
  excluirBoleta, excluirChamado, excluirTarefa,
} from '../controllers/adminController';

const router = Router();

/**
 * Middleware de proteção: apenas Gerente ADMINISTRADOR (is_admin=1) acessa rotas admin.
 * Gerente comum (is_admin=0) é bloqueado.
 */
function apenasGerenteAdmin(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  if (!usuario || usuario.perfil !== 'Gerente') {
    return res.status(403).json({ erro: 'Acesso restrito ao Gerente.' });
  }
  if (!usuario.is_admin) {
    return res.status(403).json({ erro: 'Acesso restrito ao Gerente Administrador.' });
  }
  next();
}

router.use(apenasGerenteAdmin);

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

// Exclusão de registros — só Gerente ADM
router.delete('/boletas/:grupo_id', excluirBoleta);
router.delete('/chamados/:id', excluirChamado);
router.delete('/tarefas/:id', excluirTarefa);

export default router;
