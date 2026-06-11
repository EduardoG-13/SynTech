import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database';

export function login(req: Request, res: Response) {
  const { usuario, senha, perfil } = req.body;

  if (!usuario || !senha || !perfil) {
    return res.status(400).json({ sucesso: false, erro: 'Campos obrigatórios não preenchidos.' });
  }

  const row = db.prepare('SELECT * FROM usuarios WHERE nome = ? AND perfil = ?').get(usuario, perfil) as any;

  if (!row) {
    return res.status(401).json({ sucesso: false, erro: 'Usuário não encontrado.' });
  }

  const senhaValida = bcrypt.compareSync(senha, row.senha);

  if (!senhaValida) {
    return res.status(401).json({ sucesso: false, erro: 'Senha incorreta.' });
  }

  (req.session as any).usuario = {
    id: row.id,
    nome: row.nome,
    perfil: row.perfil,
    retiro_id: row.retiro_id,
    is_admin: row.is_admin === 1 || row.is_admin === true,
  };

  return res.json({ sucesso: true, perfil: row.perfil, is_admin: row.is_admin === 1 });
}

export function logout(req: Request, res: Response) {
  req.session.destroy(() => {
    res.json({ sucesso: true });
  });
}

// GET /api/auth/me — retorna a sessão atual (ou null), usado pra evitar redirect loop no login
export function me(req: Request, res: Response) {
  const usuario = (req.session as any)?.usuario;
  return res.json({ usuario: usuario || null });
}

/**
 * Login simples do Capataz: ele só escolhe o retiro (sem senha por enquanto).
 * Cria sessão com perfil Capataz + retiro escolhido.
 *
 * TODO (segurança): substituir por leitura de QR code colocado no retiro,
 * onde o token assinado garante que a sessão só nasce daquele dispositivo
 * autorizado. Por ora, basta o registro do retiro no servidor.
 */
export function loginCapataz(req: Request, res: Response) {
  const { retiro_id } = req.body;
  if (!retiro_id) {
    return res.status(400).json({ sucesso: false, erro: 'retiro_id obrigatório' });
  }

  // Busca o capataz responsável pelo retiro (regra: 1 capataz por retiro hoje)
  const row = db.prepare(
    `SELECT u.id, u.nome, u.perfil, u.retiro_id
     FROM usuarios u
     WHERE u.perfil = 'Capataz' AND u.retiro_id = ?`
  ).get(retiro_id) as any;

  if (!row) {
    return res.status(404).json({ sucesso: false, erro: 'Nenhum capataz vinculado a este retiro.' });
  }

  (req.session as any).usuario = {
    id: row.id,
    nome: row.nome,
    perfil: row.perfil,
    retiro_id: row.retiro_id,
  };

  return res.json({ sucesso: true, perfil: row.perfil, retiro_id: row.retiro_id });
}

/**
 * Login simples da Infraestrutura: escolhe categoria (hidráulica/elétrica/cerca).
 * Cria sessão com perfil Infraestrutura.
 */
export function loginInfraestrutura(req: Request, res: Response) {
  const { categoria } = req.body;
  if (!categoria) {
    return res.status(400).json({ sucesso: false, erro: 'categoria obrigatória' });
  }

  (req.session as any).usuario = {
    id: 'tecnico-' + categoria,
    nome: 'Técnico ' + categoria,
    perfil: 'Infraestrutura',
    retiro_id: null,
    categoria: categoria,
  };

  return res.json({ sucesso: true, perfil: 'Infraestrutura', categoria });
}
