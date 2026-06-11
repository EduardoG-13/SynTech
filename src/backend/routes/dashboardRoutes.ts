import { Router, Request, Response, NextFunction } from 'express';
import { obterResumo, listarRetirosDashboard } from '../controllers/dashboardController';

const router = Router();

function exigeGerenteOuCoordenador(req: Request, res: Response, next: NextFunction) {
  const u = (req.session as any)?.usuario;
  if (!u) return res.status(401).json({ erro: 'Não autenticado.' });
  if (!['Gerente', 'Coordenador'].includes(u.perfil)) {
    return res.status(403).json({ erro: 'Acesso restrito.' });
  }
  next();
}

router.use(exigeGerenteOuCoordenador);
router.get('/resumo', obterResumo);
router.get('/retiros', listarRetirosDashboard);

export default router;
