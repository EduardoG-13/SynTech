import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';
import db from '../config/database';

/**
 * adminController.ts
 * CRUD administrativo (perfil Gerente): retiros e usuários.
 * Grava no SQLite local e enfileira em `sincronizacoes` para subir ao Supabase.
 */

function enfileirarSync(entidadeTipo: string, entidadeId: string) {
  db.prepare(
    `INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
     VALUES (?, ?, ?, 'PENDENTE', 0)`
  ).run(uuidv7(), entidadeTipo, entidadeId);
}

// ==================== RETIROS ====================

export function listarRetiros(_req: Request, res: Response) {
  const retiros = db.prepare(`
    SELECT r.id, r.nome, r.numero, r.localizacao, r.coordenador_id, r.capataz_id,
           c.nome AS coordenador_nome,
           cap.nome AS capataz_nome
    FROM retiros r
    LEFT JOIN usuarios c   ON c.id = r.coordenador_id
    LEFT JOIN usuarios cap ON cap.id = r.capataz_id
    ORDER BY r.nome
  `).all();
  return res.json(retiros);
}

export function criarRetiro(req: Request, res: Response) {
  const { nome, numero, localizacao, coordenador_id, capataz_id } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome do retiro é obrigatório.' });

  const id = uuidv7();
  db.prepare(
    `INSERT INTO retiros (id, nome, numero, localizacao, coordenador_id, capataz_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, nome, numero || null, localizacao || nome, coordenador_id || null, capataz_id || null);

  enfileirarSync('retiro', id);
  return res.status(201).json({ id, mensagem: 'Retiro criado com sucesso.' });
}

export function atualizarRetiro(req: Request, res: Response) {
  const id = String(req.params.id);
  const { nome, numero, localizacao, coordenador_id, capataz_id } = req.body;

  const existe = db.prepare('SELECT id FROM retiros WHERE id = ?').get(id);
  if (!existe) return res.status(404).json({ erro: 'Retiro não encontrado.' });

  db.prepare(
    `UPDATE retiros SET nome = ?, numero = ?, localizacao = ?, coordenador_id = ?, capataz_id = ?
     WHERE id = ?`
  ).run(nome, numero || null, localizacao || nome, coordenador_id || null, capataz_id || null, id);

  enfileirarSync('retiro', id);
  return res.json({ mensagem: 'Retiro atualizado com sucesso.' });
}

export function excluirRetiro(req: Request, res: Response) {
  const id = String(req.params.id);
  const existe = db.prepare('SELECT id FROM retiros WHERE id = ?').get(id);
  if (!existe) return res.status(404).json({ erro: 'Retiro não encontrado.' });

  db.prepare('DELETE FROM retiros WHERE id = ?').run(id);
  return res.json({ mensagem: 'Retiro excluído com sucesso.' });
}

// ==================== USUÁRIOS ====================

export function listarUsuarios(req: Request, res: Response) {
  const perfil = req.query.perfil ? String(req.query.perfil) : undefined;
  let rows;
  if (perfil) {
    rows = db.prepare(
      'SELECT id, nome, perfil, retiro_id FROM usuarios WHERE perfil = ? ORDER BY nome'
    ).all(perfil);
  } else {
    rows = db.prepare(
      'SELECT id, nome, perfil, retiro_id FROM usuarios ORDER BY perfil, nome'
    ).all();
  }
  return res.json(rows);
}

export function criarUsuario(req: Request, res: Response) {
  const { nome, senha, perfil, retiro_id } = req.body;
  if (!nome || !senha || !perfil) {
    return res.status(400).json({ erro: 'Nome, senha e perfil são obrigatórios.' });
  }
  const perfisValidos = ['Gerente', 'Coordenador', 'Capataz', 'Tecnico'];
  if (!perfisValidos.includes(perfil)) {
    return res.status(400).json({ erro: 'Perfil inválido.' });
  }

  // Nome de login único
  const jaExiste = db.prepare('SELECT id FROM usuarios WHERE nome = ? AND perfil = ?').get(nome, perfil);
  if (jaExiste) return res.status(409).json({ erro: 'Já existe um usuário com esse nome e perfil.' });

  const id = uuidv7();
  const senhaHash = bcrypt.hashSync(senha, 10);
  db.prepare(
    `INSERT INTO usuarios (id, nome, senha, perfil, retiro_id) VALUES (?, ?, ?, ?, ?)`
  ).run(id, nome, senhaHash, perfil, retiro_id || null);

  enfileirarSync('usuario', id);
  return res.status(201).json({ id, mensagem: 'Usuário criado com sucesso.' });
}

export function atualizarUsuario(req: Request, res: Response) {
  const id = String(req.params.id);
  const { nome, senha, perfil, retiro_id } = req.body;

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as any;
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  // Se senha foi informada, gera novo hash; senão mantém a atual
  const senhaFinal = senha ? bcrypt.hashSync(senha, 10) : usuario.senha;

  db.prepare(
    `UPDATE usuarios SET nome = ?, senha = ?, perfil = ?, retiro_id = ? WHERE id = ?`
  ).run(nome || usuario.nome, senhaFinal, perfil || usuario.perfil, retiro_id || null, id);

  enfileirarSync('usuario', id);
  return res.json({ mensagem: 'Usuário atualizado com sucesso.' });
}

export function excluirUsuario(req: Request, res: Response) {
  const id = String(req.params.id);
  const usuario = db.prepare('SELECT perfil FROM usuarios WHERE id = ?').get(id) as any;
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  // Não permite excluir o único Gerente
  if (usuario.perfil === 'Gerente') {
    const totalGerentes = db.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE perfil = 'Gerente'").get() as any;
    if (totalGerentes.n <= 1) {
      return res.status(422).json({ erro: 'Não é possível excluir o único Gerente do sistema.' });
    }
  }

  db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
  return res.json({ mensagem: 'Usuário excluído com sucesso.' });
}
