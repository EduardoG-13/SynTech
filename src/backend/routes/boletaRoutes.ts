import { Router, Request, Response, NextFunction } from 'express';
import { criarBoleta, atualizarBoleta, listarMinhas, obterBoleta } from '../controllers/boletaController';

const router = Router();

function exigeLogin(req: Request, res: Response, next: NextFunction) {
  const u = (req.session as any)?.usuario;
  if (!u) return res.status(401).json({ erro: 'Não autenticado.' });
  next();
}

router.use(exigeLogin);

router.get('/minhas', listarMinhas);
router.get('/:grupo_id', obterBoleta);
router.post('/', criarBoleta);
router.put('/:grupo_id', atualizarBoleta);

export default router;
