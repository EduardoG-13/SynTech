import { Request, Response } from 'express';
import db from '../config/database';

/**
 * dadosController.ts
 * Fornece dados de apoio (retiros, capatazes, categorias, tipos de movimentação)
 * para popular os formulários do front-end com dados reais do banco.
 */

// GET /api/dados/retiros - lista todos os retiros
export function listarRetiros(_req: Request, res: Response) {
  const retiros = db.prepare('SELECT id, nome, localizacao FROM retiros ORDER BY nome').all();
  return res.json(retiros);
}

// GET /api/dados/capatazes - lista usuários com perfil Capataz (com retiro)
export function listarCapatazes(_req: Request, res: Response) {
  const capatazes = db.prepare(
    `SELECT id, nome, retiro_id FROM usuarios WHERE perfil = 'Capataz' ORDER BY nome`
  ).all();
  return res.json(capatazes);
}

// GET /api/dados/form-nova-os - retorna tudo que o formulário de Nova O.S. precisa
export function dadosFormNovaOs(_req: Request, res: Response) {
  const retiros = db.prepare('SELECT id, nome FROM retiros ORDER BY nome').all();
  const capatazes = db.prepare(
    `SELECT id, nome, retiro_id FROM usuarios WHERE perfil = 'Capataz' ORDER BY nome`
  ).all();

  // Dados de domínio (planilha oficial BRPec)
  const categorias = [
    'Bezerra 0 a 7 meses', 'Bezerro 0 a 7 meses',
    'Novilha 8 a 12 meses', 'Garrote 8 a 12 meses',
    'Novilha 13 a 24 meses', 'Garrote 13 a 24 meses',
    'Novilha 25 a 36 meses', 'Boi 25 a 36 meses', 'Touro 25 a 36 meses',
    'Vaca acima 36 meses', 'Boi acima 36 meses', 'Touro acima 36 meses',
  ];

  const tiposMorte = [
    'Acidente', 'Atolado', 'Cobra', 'Def. nutricional', 'Desconhecida',
    'Desidratação', 'Doenças', 'Fraqueza', 'Hipotermia', 'Intoxicação',
    'Morte Subita', 'Onça', 'Parto', 'Raio',
  ];

  const operacoes = [
    { valor: 'nascimento', label: '🐄 Nascimento' },
    { valor: 'obito', label: '⚰️ Óbito / Morte' },
    { valor: 'transferencia', label: '🔄 Transferência entre retiros' },
    { valor: 'compravenda', label: '💰 Compra / Venda' },
    { valor: 'evolucao', label: '📈 Evolução de rebanho' },
    { valor: 'manejo', label: '🛠️ Manejo geral (vacinação, etc.)' },
  ];

  return res.json({ retiros, capatazes, categorias, tiposMorte, operacoes });
}
