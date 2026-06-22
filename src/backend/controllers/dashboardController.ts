import { Request, Response } from 'express';
import dashboardService from '../services/dashboardService';

interface SessUsuario { id: string; perfil: string; }

// GET /api/dashboard/resumo
export function obterResumo(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const filtroData = typeof req.query.data === 'string' && req.query.data ? req.query.data : null;

  try {
    const resumo = dashboardService.obterResumo(sess, filtroData);
    return res.json(resumo);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}

// GET /api/dashboard/retiros
export function listarRetirosDashboard(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const retiros = dashboardService.listarRetirosDashboard(sess);
    return res.json(retiros);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}
