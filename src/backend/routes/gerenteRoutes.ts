import { Router, Request, Response, NextFunction } from 'express';
import { listarFechamentos, fecharMes, reabrirMes, exportarPlanilhaOficial } from '../controllers/gerenteController';

const router = Router();

function apenasGerente(req: Request, res: Response, next: NextFunction) {
  const u = (req.session as any)?.usuario;
  if (!u) return res.status(401).json({ erro: 'Não autenticado.' });
  if (u.perfil !== 'Gerente') return res.status(403).json({ erro: 'Acesso restrito ao Gerente.' });
  next();
}

router.use(apenasGerente);

router.get('/fechamentos', listarFechamentos);
router.post('/fechamento', fecharMes);
router.delete('/fechamento/:mes', reabrirMes);
router.get('/planilha-oficial', exportarPlanilhaOficial);

export default router;
