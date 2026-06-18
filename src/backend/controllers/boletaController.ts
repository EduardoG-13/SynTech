import { Request, Response } from 'express';
import boletaService from '../services/boletaService';

interface SessUsuario { id: string; perfil: string; retiro_id?: string | null; }

export function criarBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const { grupo_id, ids } = boletaService.criarBoleta(sess, req.body || {});
    return res.status(201).json({ grupo_id, ids, mensagem: 'Boleta registrada.' });
  } catch (err: any) {
    const status = err.status || 400;
    return res.status(status).json({ erro: err.message });
  }
}

export function atualizarBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const grupoId = String(req.params.grupo_id);
  
  try {
    const { grupo_id } = boletaService.atualizarBoleta(sess, grupoId, req.body || {});
    return res.json({ grupo_id, mensagem: 'Boleta atualizada.' });
  } catch (err: any) {
    const status = err.status || 400;
    return res.status(status).json({ erro: err.message });
  }
}

export function listarMinhas(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const grupos = boletaService.listarMinhas(sess);
  return res.json(grupos);
}

export function obterBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const grupoId = String(req.params.grupo_id);

  try {
    const boleta = boletaService.obterBoleta(sess, grupoId);
    return res.json(boleta);
  } catch (err: any) {
    const status = err.status || 400;
    return res.status(status).json({ erro: err.message });
  }
}
