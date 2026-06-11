import { Request, Response } from 'express';
import { v7 as uuidv7 } from 'uuid';
import db from '../config/database';

/**
 * boletaController.ts
 * Endpoint genérico de boleta — cobre todos os tipos (nascimento, óbito,
 * transferência, compra/venda, evolução, manejo).
 * Várias categorias na mesma boleta = várias rows em `movimentacoes` com
 * o mesmo `grupo_id` (UUID da boleta).
 */

interface SessUsuario { id: string; perfil: string; retiro_id?: string | null; }

function enfileirarSync(entidade: string, id: string) {
  db.prepare(
    `INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
     VALUES (?, ?, ?, 'PENDENTE', 0)`
  ).run(uuidv7(), entidade, id);
}

/**
 * POST /api/boletas
 * Body: { operacao, data, retiro, animais[{categoria,quantidade}], ... }
 * Cria 1+ rows agrupadas por grupo_id.
 */
export function criarBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const b = req.body || {};
  const operacao: string = b.operacao;
  if (!operacao) return res.status(400).json({ erro: 'operacao é obrigatória.' });

  const grupoId = uuidv7();
  const data = b.data || new Date().toISOString().slice(0, 10);
  const retiro_id = b.retiro || b.retiro_origem || sess.retiro_id;
  if (!retiro_id) return res.status(400).json({ erro: 'retiro é obrigatório.' });

  // Validação por tipo
  if (operacao === 'obito' && !b.tem_foto) {
    return res.status(422).json({ erro: 'Óbito exige foto da carcaça (RF013).' });
  }

  // Sem categorias? Manejo aceita; o resto exige
  let animais = Array.isArray(b.animais) ? b.animais : [];
  if (animais.length === 0 && ['nascimento','obito','transferencia','compravenda'].includes(operacao)) {
    return res.status(400).json({ erro: 'Informe ao menos uma categoria com quantidade.' });
  }
  if (animais.length === 0) {
    animais = [{ categoria: operacao === 'manejo' ? 'MANEJO' : 'AJUSTE', quantidade: 0 }];
  }

  const insertMov = db.prepare(`
    INSERT INTO movimentacoes (
      id, capataz_id, retiro_id, data, categoria, quantidade,
      tipo_operacao, grupo_id,
      pasto, observacoes, observacoes_audio_base64, tem_foto,
      raca, brinco, causa_morte,
      tipo_negocio, valor_financeiro,
      retiro_origem_id, retiro_destino_id, tipo_transporte, motorista, rg_cpf_motorista, placa,
      titulo,
      sincronizado, validado
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?,
      0, 0
    )
  `);

  const ids: string[] = [];
  for (const a of animais) {
    const movId = uuidv7();
    insertMov.run(
      movId, sess.id, retiro_id, data, a.categoria || '', parseInt(a.quantidade) || 0,
      operacao, grupoId,
      b.pasto || null, b.observacoes || null, b.observacoes_audio || null, b.tem_foto ? 1 : 0,
      b.raca || null, b.brinco || null, b.causa || null,
      b.tipo || null, b.valor ? parseFloat(b.valor) : null,
      b.retiro_origem || null, b.retiro_destino || null, b.transporte || null,
      b.motorista || null, b.rgcpf || null, b.placa || null,
      b.titulo || null,
    );
    ids.push(movId);
    enfileirarSync('movimentacao', movId);
  }

  return res.status(201).json({ grupo_id: grupoId, ids, mensagem: 'Boleta registrada.' });
}

/**
 * PUT /api/boletas/:grupo_id
 * Edita uma boleta (todas as rows do grupo). Só dentro da janela de 30 dias.
 */
export function atualizarBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const grupoId = String(req.params.grupo_id);
  const existentes = db.prepare(
    `SELECT * FROM movimentacoes WHERE grupo_id = ? AND capataz_id = ?`
  ).all(grupoId, sess.id) as any[];

  if (existentes.length === 0) return res.status(404).json({ erro: 'Boleta não encontrada.' });

  // Janela de 30 dias
  const criadoEm = new Date(existentes[0].criado_em);
  const dias = (Date.now() - criadoEm.getTime()) / (1000 * 60 * 60 * 24);
  if (dias > 30) {
    return res.status(422).json({ erro: 'Boleta com mais de 30 dias não pode ser editada.' });
  }
  if (existentes[0].aprovado_por_coordenador_id) {
    return res.status(422).json({ erro: 'Boleta já aprovada pelo Coordenador.' });
  }

  // Estratégia mais simples: apaga as rows do grupo e cria de novo
  db.prepare(`DELETE FROM movimentacoes WHERE grupo_id = ? AND capataz_id = ?`).run(grupoId, sess.id);

  // Reaproveita o criarBoleta (mas mantém o mesmo grupo_id pra estabilidade)
  // Aqui faz inline pra preservar grupo_id
  const b = req.body || {};
  const data = b.data || existentes[0].data;
  const retiro_id = b.retiro || b.retiro_origem || existentes[0].retiro_id;
  const operacao = b.operacao || existentes[0].tipo_operacao;
  let animais = Array.isArray(b.animais) ? b.animais : [];
  if (animais.length === 0) animais = [{ categoria: 'AJUSTE', quantidade: 0 }];

  const insertMov = db.prepare(`
    INSERT INTO movimentacoes (
      id, capataz_id, retiro_id, data, categoria, quantidade,
      tipo_operacao, grupo_id, pasto, observacoes, observacoes_audio_base64, tem_foto,
      raca, brinco, causa_morte, tipo_negocio, valor_financeiro,
      retiro_origem_id, retiro_destino_id, tipo_transporte, motorista, rg_cpf_motorista, placa,
      titulo, sincronizado, validado, criado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
  `);

  for (const a of animais) {
    const movId = uuidv7();
    insertMov.run(
      movId, sess.id, retiro_id, data, a.categoria || '', parseInt(a.quantidade) || 0,
      operacao, grupoId,
      b.pasto || null, b.observacoes || null, b.observacoes_audio || null, b.tem_foto ? 1 : 0,
      b.raca || null, b.brinco || null, b.causa || null,
      b.tipo || null, b.valor ? parseFloat(b.valor) : null,
      b.retiro_origem || null, b.retiro_destino || null, b.transporte || null,
      b.motorista || null, b.rgcpf || null, b.placa || null,
      b.titulo || null,
      existentes[0].criado_em,
    );
    enfileirarSync('movimentacao', movId);
  }

  return res.json({ grupo_id: grupoId, mensagem: 'Boleta atualizada.' });
}

/**
 * GET /api/boletas/minhas — lista boletas do capataz logado (agrupadas por grupo_id)
 */
export function listarMinhas(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const rows = db.prepare(`
    SELECT m.*, r.nome AS retiro_nome
    FROM movimentacoes m
    LEFT JOIN retiros r ON r.id = m.retiro_id
    WHERE m.capataz_id = ?
    ORDER BY m.criado_em DESC
  `).all(sess.id) as any[];

  // Agrupa por grupo_id (1 boleta = N rows)
  const grupos: Record<string, any> = {};
  for (const r of rows) {
    const key = r.grupo_id || r.id;
    if (!grupos[key]) {
      grupos[key] = {
        id: key, // grupo_id é o ID da boleta no front
        operacao: r.tipo_operacao,
        data: r.data,
        retiro: r.retiro_id,
        retiro_nome: r.retiro_nome,
        pasto: r.pasto,
        observacoes: r.observacoes,
        observacoes_audio: r.observacoes_audio_base64,
        tem_foto: r.tem_foto === 1,
        raca: r.raca,
        brinco: r.brinco,
        causa: r.causa_morte,
        tipo: r.tipo_negocio,
        valor: r.valor_financeiro,
        retiro_origem: r.retiro_origem_id,
        retiro_destino: r.retiro_destino_id,
        transporte: r.tipo_transporte,
        motorista: r.motorista,
        rgcpf: r.rg_cpf_motorista,
        placa: r.placa,
        titulo: r.titulo,
        criadoEm: r.criado_em,
        aprovada: !!r.aprovado_por_coordenador_id,
        animais: [],
      };
    }
    grupos[key].animais.push({ categoria: r.categoria, quantidade: r.quantidade });
  }

  return res.json(Object.values(grupos));
}

/**
 * GET /api/boletas/:grupo_id — detalhe (qualquer perfil autenticado)
 */
export function obterBoleta(req: Request, res: Response) {
  const sess = (req.session as any)?.usuario as SessUsuario | undefined;
  if (!sess) return res.status(401).json({ erro: 'Não autenticado.' });

  const grupoId = String(req.params.grupo_id);
  const rows = db.prepare(`
    SELECT m.*, r.nome AS retiro_nome, u.nome AS capataz_nome,
           ro.nome AS retiro_origem_nome, rd.nome AS retiro_destino_nome
    FROM movimentacoes m
    LEFT JOIN retiros r ON r.id = m.retiro_id
    LEFT JOIN usuarios u ON u.id = m.capataz_id
    LEFT JOIN retiros ro ON ro.id = m.retiro_origem_id
    LEFT JOIN retiros rd ON rd.id = m.retiro_destino_id
    WHERE m.grupo_id = ? OR m.id = ?
    ORDER BY m.criado_em
  `).all(grupoId, grupoId) as any[];

  if (rows.length === 0) return res.status(404).json({ erro: 'Boleta não encontrada.' });

  const first = rows[0];
  return res.json({
    id: first.grupo_id || first.id,
    operacao: first.tipo_operacao,
    data: first.data,
    retiro: first.retiro_id, retiro_nome: first.retiro_nome,
    capataz_id: first.capataz_id, capataz_nome: first.capataz_nome,
    pasto: first.pasto, observacoes: first.observacoes,
    observacoes_audio: first.observacoes_audio_base64, tem_foto: first.tem_foto === 1,
    raca: first.raca, brinco: first.brinco, causa: first.causa_morte,
    tipo: first.tipo_negocio, valor: first.valor_financeiro,
    retiro_origem: first.retiro_origem_id, retiro_origem_nome: first.retiro_origem_nome,
    retiro_destino: first.retiro_destino_id, retiro_destino_nome: first.retiro_destino_nome,
    transporte: first.tipo_transporte, motorista: first.motorista,
    rgcpf: first.rg_cpf_motorista, placa: first.placa, titulo: first.titulo,
    criadoEm: first.criado_em,
    aprovada: !!first.aprovado_por_coordenador_id,
    aprovado_em: first.aprovado_em,
    animais: rows.map(r => ({ categoria: r.categoria, quantidade: r.quantidade })),
  });
}
