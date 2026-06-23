import { Request, Response } from 'express';
import auditoriaService from '../services/auditoriaService';

export function listarAuditoria(req: Request, res: Response) {
  const limite = Number(req.query.limite || 200);
  const registros = auditoriaService.listar(limite);
  return res.json(registros);
}
