import { v7 as uuidv7 } from 'uuid';
import db from '../config/database';

class BoletaService {
  private enfileirarSync(entidade: string, id: string) {
    db.prepare(
      `INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas)
       VALUES (?, ?, ?, 'PENDENTE', 0)`
    ).run(uuidv7(), entidade, id);
  }

  criarBoleta(capataz_id: string, b: any, fallbackRetiroId?: string | null) {
    const operacao: string = b.operacao;
    if (!operacao) throw new Error('operacao é obrigatória.');

    const retiro_id = b.retiro || b.retiro_origem || fallbackRetiroId;
    if (!retiro_id) throw new Error('retiro é obrigatório.');

    // Validação por tipo
    if (operacao === 'obito' && !b.tem_foto) {
      throw new Error('Para registrar óbito é obrigatório anexar a foto da carcaça.');
    }

    let animais = Array.isArray(b.animais) ? b.animais : [];
    if (animais.length === 0 && ['nascimento','obito','transferencia','compravenda'].includes(operacao)) {
      throw new Error('Informe ao menos uma categoria com quantidade.');
    }
    if (animais.length === 0) {
      animais = [{ categoria: operacao === 'manejo' ? 'MANEJO' : 'AJUSTE', quantidade: 0 }];
    }

    const grupoId = uuidv7();
    const data = b.data || new Date().toISOString().slice(0, 10);

    const insertMov = db.prepare(`
      INSERT INTO movimentacoes (
        id, capataz_id, retiro_id, data, categoria, quantidade,
        tipo_operacao, grupo_id,
        pasto, observacoes, observacoes_audio_base64, tem_foto, foto_base64,
        raca, brinco, causa_morte,
        tipo_negocio, valor_financeiro,
        retiro_origem_id, retiro_destino_id, tipo_transporte, motorista, rg_cpf_motorista, placa,
        titulo,
        sincronizado, validado
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?,
        0, 0
      )
    `);

    const fotoBase64 = b.foto_base64 || null;
    const ids: string[] = [];

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const a of animais) {
        const movId = uuidv7();
        insertMov.run(
          movId, capataz_id, retiro_id, data, a.categoria || '', parseInt(a.quantidade) || 0,
          operacao, grupoId,
          b.pasto || null, b.observacoes || null, b.observacoes_audio || null, b.tem_foto ? 1 : 0, fotoBase64,
          b.raca || null, b.brinco || null, b.causa || null,
          b.tipo || null, b.valor ? parseFloat(b.valor) : null,
          b.retiro_origem || null, b.retiro_destino || null, b.transporte || null,
          b.motorista || null, b.rgcpf || null, b.placa || null,
          b.titulo || null,
        );
        ids.push(movId);
        this.enfileirarSync('movimentacao', movId);
      }
      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }

    return { grupo_id: grupoId, ids };
  }

  atualizarBoleta(capataz_id: string, grupoId: string, b: any) {
    const existentes = db.prepare(
      `SELECT * FROM movimentacoes WHERE grupo_id = ? AND capataz_id = ?`
    ).all(grupoId, capataz_id) as any[];

    if (existentes.length === 0) throw new Error('Boleta não encontrada.');

    const criadoEm = new Date(existentes[0].criado_em);
    const dias = (Date.now() - criadoEm.getTime()) / (1000 * 60 * 60 * 24);
    if (dias > 30) {
      throw new Error('Boleta com mais de 30 dias não pode ser editada.');
    }
    if (existentes[0].aprovado_por_coordenador_id) {
      throw new Error('Boleta já aprovada pelo Coordenador.');
    }

    const data = b.data || existentes[0].data;
    const retiro_id = b.retiro || b.retiro_origem || existentes[0].retiro_id;
    const operacao = b.operacao || existentes[0].tipo_operacao;
    let animais = Array.isArray(b.animais) ? b.animais : [];
    if (animais.length === 0) animais = [{ categoria: 'AJUSTE', quantidade: 0 }];

    const insertMov = db.prepare(`
      INSERT INTO movimentacoes (
        id, capataz_id, retiro_id, data, categoria, quantidade,
        tipo_operacao, grupo_id, pasto, observacoes, observacoes_audio_base64, tem_foto, foto_base64,
        raca, brinco, causa_morte, tipo_negocio, valor_financeiro,
        retiro_origem_id, retiro_destino_id, tipo_transporte, motorista, rg_cpf_motorista, placa,
        titulo, sincronizado, validado, criado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
    `);

    const fotoBase64 = b.foto_base64 || existentes[0].foto_base64 || null;

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`DELETE FROM movimentacoes WHERE grupo_id = ? AND capataz_id = ?`).run(grupoId, capataz_id);

      for (const a of animais) {
        const movId = uuidv7();
        insertMov.run(
          movId, capataz_id, retiro_id, data, a.categoria || '', parseInt(a.quantidade) || 0,
          operacao, grupoId,
          b.pasto || null, b.observacoes || null, b.observacoes_audio || null, b.tem_foto ? 1 : 0, fotoBase64,
          b.raca || null, b.brinco || null, b.causa || null,
          b.tipo || null, b.valor ? parseFloat(b.valor) : null,
          b.retiro_origem || null, b.retiro_destino || null, b.transporte || null,
          b.motorista || null, b.rgcpf || null, b.placa || null,
          b.titulo || null,
          existentes[0].criado_em,
        );
        this.enfileirarSync('movimentacao', movId);
      }
      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }

    return { grupo_id: grupoId };
  }

  obterBoleta(grupoId: string) {
    const rows = db.prepare(`
      SELECT m.*,
             r.nome  AS retiro_nome,
             u.nome  AS capataz_nome,
             ro.nome AS retiro_origem_nome,
             rd.nome AS retiro_destino_nome,
             c.nome  AS aprovado_por_nome
      FROM movimentacoes m
      LEFT JOIN retiros  r  ON r.id  = m.retiro_id
      LEFT JOIN usuarios u  ON u.id  = m.capataz_id
      LEFT JOIN retiros  ro ON ro.id = m.retiro_origem_id
      LEFT JOIN retiros  rd ON rd.id = m.retiro_destino_id
      LEFT JOIN usuarios c  ON c.id  = m.aprovado_por_coordenador_id
      WHERE m.grupo_id = ? OR m.id = ?
      ORDER BY m.criado_em
    `).all(grupoId, grupoId) as any[];

    if (rows.length === 0) return null;

    const first = rows[0];
    return {
      id: first.grupo_id || first.id,
      operacao: first.tipo_operacao,
      data: first.data,
      retiro: first.retiro_id, retiro_nome: first.retiro_nome,
      capataz_id: first.capataz_id, capataz_nome: first.capataz_nome,
      pasto: first.pasto, observacoes: first.observacoes,
      observacoes_audio: first.observacoes_audio_base64,
      tem_foto: first.tem_foto === 1,
      foto_base64: first.foto_base64 || null,
      raca: first.raca, brinco: first.brinco, causa: first.causa_morte,
      tipo: first.tipo_negocio, valor: first.valor_financeiro,
      retiro_origem: first.retiro_origem_id, retiro_origem_nome: first.retiro_origem_nome,
      retiro_destino: first.retiro_destino_id, retiro_destino_nome: first.retiro_destino_nome,
      transporte: first.tipo_transporte, motorista: first.motorista,
      rgcpf: first.rg_cpf_motorista, placa: first.placa, titulo: first.titulo,
      criadoEm: first.criado_em,
      sincronizado: !!first.sincronizado,
      aprovada: !!first.aprovado_por_coordenador_id,
      aprovado_em: first.aprovado_em,
      aprovado_por_nome: first.aprovado_por_nome || null,
      animais: rows.map(r => ({ categoria: r.categoria, quantidade: r.quantidade })),
    };
  }

  listarMinhasBoletas(capataz_id: string) {
    const rows = db.prepare(`
      SELECT m.*, r.nome AS retiro_nome
      FROM movimentacoes m
      LEFT JOIN retiros r ON r.id = m.retiro_id
      WHERE m.capataz_id = ?
      ORDER BY m.criado_em DESC
    `).all(capataz_id) as any[];

    const grupos: Record<string, any> = {};
    for (const r of rows) {
      const key = r.grupo_id || r.id;
      if (!grupos[key]) {
        grupos[key] = {
          id: key,
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

    return Object.values(grupos);
  }
}

export default new BoletaService();
