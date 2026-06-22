import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import boletaService from '../services/boletaService';

interface SessUsuario { id: string; perfil: string; retiro_id?: string | null; }

export function criarBoleta(req: Request, res: Response, next: NextFunction) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return next(new AppError(401, 'Não autenticado.'));

  try {
    const result = boletaService.criarBoleta(sess.id, req.body, sess.retiro_id);
    return res.status(201).json({ grupo_id: result.grupo_id, ids: result.ids, mensagem: 'Boleta registrada.' });
  } catch (error: any) {
    if (error.message.includes('obrigatóri')) {
      return next(new AppError(400, error.message));
    }
    return next(new AppError(422, error.message));
  }
}

export function atualizarBoleta(req: Request, res: Response, next: NextFunction) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return next(new AppError(401, 'Não autenticado.'));

  const grupoId = String(req.params.grupo_id);

  try {
    const result = boletaService.atualizarBoleta(sess.id, grupoId, req.body);
    return res.json({ grupo_id: result.grupo_id, mensagem: 'Boleta atualizada.' });
  } catch (error: any) {
    if (error.message === 'Boleta não encontrada.') {
      return next(new AppError(404, error.message));
    }
    return next(new AppError(422, error.message));
  }
}

export function listarMinhas(req: Request, res: Response, next: NextFunction) {
  try {
    const sess = (req.session as any)?.usuario as SessUsuario | undefined;
    if (!sess) throw new AppError(401, 'Não autenticado.');

    const grupos = boletaService.listarMinhasBoletas(sess.id);
    return res.json(grupos);
  } catch (error: any) {
    next(error);
  }
}

export function obterBoleta(req: Request, res: Response, next: NextFunction) {
  try {
    const sess = (req.session as any)?.usuario as SessUsuario | undefined;
    if (!sess) throw new AppError(401, 'Não autenticado.');

    const grupoId = String(req.params.grupo_id);
    
    const boleta = boletaService.obterBoleta(grupoId);
    if (!boleta) {
      throw new AppError(404, 'Boleta não encontrada.');
    }

    return res.json(boleta);
  } catch (error: any) {
    next(error);
  }
}
