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
      'SELECT id, nome, perfil, retiro_id, is_admin FROM usuarios WHERE perfil = ? ORDER BY nome'
    ).all(perfil);
  } else {
    rows = db.prepare(
      'SELECT id, nome, perfil, retiro_id, is_admin FROM usuarios ORDER BY perfil, nome'
    ).all();
  }
  return res.json(rows);
}

export function criarUsuario(req: Request, res: Response) {
  const { nome, senha, perfil, retiro_id, is_admin } = req.body;
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

  // is_admin só é válido para perfil Gerente — demais, força 0
  const adminFlag = (perfil === 'Gerente' && (is_admin === true || is_admin === 1 || is_admin === '1')) ? 1 : 0;

  const id = uuidv7();
  const senhaHash = bcrypt.hashSync(senha, 10);
  db.prepare(
    `INSERT INTO usuarios (id, nome, senha, perfil, retiro_id, is_admin) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, nome, senhaHash, perfil, retiro_id || null, adminFlag);

  enfileirarSync('usuario', id);
  return res.status(201).json({ id, mensagem: 'Usuário criado com sucesso.' });
}

export function atualizarUsuario(req: Request, res: Response) {
  const id = String(req.params.id);
  const { nome, senha, perfil, retiro_id, is_admin } = req.body;

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as any;
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const senhaFinal = senha ? bcrypt.hashSync(senha, 10) : usuario.senha;
  const perfilFinal = perfil || usuario.perfil;

  // is_admin só é válido para perfil Gerente
  let adminFlag = usuario.is_admin;
  if (typeof is_admin !== 'undefined') {
    adminFlag = (perfilFinal === 'Gerente' && (is_admin === true || is_admin === 1 || is_admin === '1')) ? 1 : 0;
  }

  // Não permite remover is_admin do único Gerente ADM (não bloquear o sistema)
  if (usuario.is_admin === 1 && adminFlag === 0) {
    const totalAdmins = db.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE perfil = 'Gerente' AND is_admin = 1").get() as any;
    if (totalAdmins.n <= 1) {
      return res.status(422).json({ erro: 'Não é possível remover o privilégio de administrador do único Gerente ADM.' });
    }
  }

  db.prepare(
    `UPDATE usuarios SET nome = ?, senha = ?, perfil = ?, retiro_id = ?, is_admin = ? WHERE id = ?`
  ).run(nome || usuario.nome, senhaFinal, perfilFinal, retiro_id || null, adminFlag, id);

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

// ==================== EXCLUSÃO DE REGISTROS (admin only) ====================

/**
 * DELETE /api/admin/boletas/:grupo_id
 * Apaga todas as rows da boleta (mesmo grupo_id) e enfileira sync de exclusão.
 * Só Gerente ADM (gateado no router).
 */
export function excluirBoleta(req: Request, res: Response) {
  const idOuGrupo = String(req.params.grupo_id);
  const rows = db.prepare(
    `SELECT id FROM movimentacoes WHERE id = ? OR grupo_id = ?`
  ).all(idOuGrupo, idOuGrupo) as { id: string }[];

  if (rows.length === 0) return res.status(404).json({ erro: 'Boleta não encontrada.' });

  const deleteStmt = db.prepare('DELETE FROM movimentacoes WHERE id = ?');
  for (const r of rows) {
    deleteStmt.run(r.id);
    enfileirarSync('movimentacao_excluida', r.id);
  }
  return res.json({ mensagem: 'Boleta excluída com sucesso.', linhas_apagadas: rows.length });
}

/**
 * DELETE /api/admin/chamados/:id
 * Apaga um chamado (alerta) específico.
 */
export function excluirChamado(req: Request, res: Response) {
  const id = String(req.params.id);
  const existe = db.prepare('SELECT id FROM alertas WHERE id = ?').get(id);
  if (!existe) return res.status(404).json({ erro: 'Chamado não encontrado.' });

  db.prepare('DELETE FROM alertas WHERE id = ?').run(id);
  enfileirarSync('chamado_excluido', id);
  return res.json({ mensagem: 'Chamado excluído com sucesso.' });
}

/**
 * DELETE /api/admin/tarefas/:id
 * Apaga uma ordem de serviço / tarefa.
 */
export function excluirTarefa(req: Request, res: Response) {
  const id = String(req.params.id);
  const tab = db.prepare('SELECT id FROM tarefas WHERE id = ?').get(id) as any;
  if (!tab) return res.status(404).json({ erro: 'Tarefa não encontrada.' });

  db.prepare('DELETE FROM tarefas WHERE id = ?').run(id);
  enfileirarSync('tarefa_excluida', id);
  return res.json({ mensagem: 'Tarefa excluída com sucesso.' });
}
