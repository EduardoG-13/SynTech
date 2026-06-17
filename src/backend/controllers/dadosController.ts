import { Request, Response } from 'express';
import dadosService from '../services/dadosService';

/**
 * dadosController.ts
 * Fornece dados de apoio (retiros, capatazes, categorias, tipos de movimentação)
 * para popular os formulários do front-end com dados reais do banco.
 */

// GET /api/dados/retiros - lista todos os retiros
export function listarRetiros(_req: Request, res: Response) {
  try {
    const retiros = dadosService.listarRetiros();
    return res.json(retiros);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}

// GET /api/dados/capatazes - lista usuários com perfil Capataz (com retiro)
export function listarCapatazes(_req: Request, res: Response) {
  try {
    const capatazes = dadosService.listarCapatazes();
    return res.json(capatazes);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}

// GET /api/dados/form-nova-os - retorna tudo que o formulário de Nova O.S. precisa
export function dadosFormNovaOs(_req: Request, res: Response) {
  try {
    const dados = dadosService.dadosFormNovaOs();
    return res.json(dados);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
}
