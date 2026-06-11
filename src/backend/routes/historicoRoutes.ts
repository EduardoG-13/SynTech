import { Router, Request, Response, NextFunction } from 'express';
import { listarBoletas, listarChamados } from '../controllers/historicoController';

const router = Router();

function exigeLogin(req: Request, res: Response, next: NextFunction) {
  const u = (req.session as any)?.usuario;
  if (!u) return res.status(401).json({ erro: 'Não autenticado.' });
  next();
}

router.use(exigeLogin);
router.get('/boletas', listarBoletas);
router.get('/chamados', listarChamados);

export default router;
