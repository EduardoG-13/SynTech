import { Router, Request, Response, NextFunction } from 'express';
import {
  listarBoletasPendentes,
  aprovarBoleta,
  exportarCsv,
  exportarBoletaPdf,
} from '../controllers/coordenadorController';

const router = Router();

function apenasCoordenador(req: Request, res: Response, next: NextFunction) {
  const usuario = (req.session as any)?.usuario;
  if (!usuario) return res.status(401).json({ erro: 'Não autenticado.' });
  if (usuario.perfil !== 'Coordenador' && usuario.perfil !== 'Gerente') {
    return res.status(403).json({ erro: 'Acesso restrito a Coordenador / Gerente.' });
  }
  next();
}

router.use(apenasCoordenador);

router.get('/boletas-pendentes', listarBoletasPendentes);
router.post('/boletas/:id/aprovar', aprovarBoleta);
router.get('/exportar', exportarCsv);
router.get('/boleta/:grupo_id/pdf', exportarBoletaPdf);

export default router;
