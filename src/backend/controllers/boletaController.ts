import { Request, Response } from 'express';
import boletaService from '../services/boletaService';

interface SessUsuario { id: string; perfil: string; retiro_id?: string | null; }

export function criarBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  try {
    const result = boletaService.criarBoleta(sess.id, req.body, sess.retiro_id);
    return res.status(201).json({ grupo_id: result.grupo_id, ids: result.ids, mensagem: 'Boleta registrada.' });
  } catch (error: any) {
    if (error.message.includes('obrigatóri')) {
      return res.status(400).json({ erro: error.message });
    }
    return res.status(422).json({ erro: error.message });
  }
}

export function atualizarBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const grupoId = String(req.params.grupo_id);

  try {
    const result = boletaService.atualizarBoleta(sess.id, grupoId, req.body);
    return res.json({ grupo_id: result.grupo_id, mensagem: 'Boleta atualizada.' });
  } catch (error: any) {
    if (error.message === 'Boleta não encontrada.') {
      return res.status(404).json({ erro: error.message });
    }
    return res.status(422).json({ erro: error.message });
  }
}

export function listarMinhas(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const grupos = boletaService.listarMinhasBoletas(sess.id);
  return res.json(grupos);
}

export function obterBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const grupoId = String(req.params.grupo_id);
  
  const boleta = boletaService.obterBoleta(grupoId);
  if (!boleta) {
    return res.status(404).json({ erro: 'Boleta não encontrada.' });
  }

  return res.json(boleta);
}
