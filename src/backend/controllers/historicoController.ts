import { Request, Response } from 'express';
import historicoService from '../services/historicoService';

interface SessUsuario { id: string; perfil: string; retiro_id?: string | null; categoria?: string; }

// GET /api/historico/boletas
export function listarBoletas(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const grupos = historicoService.listarBoletas(sess, req.query);
    return res.json(grupos);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}

// GET /api/historico/chamados
export function listarChamados(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const rows = historicoService.listarChamados(sess, req.query);
    return res.json(rows);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}
