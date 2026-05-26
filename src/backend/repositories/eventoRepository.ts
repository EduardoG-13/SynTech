import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

class EventoRepository {
  criarNascimento(evento) {
    const mov_id = uuidv4();
    const nas_id = uuidv4();
    
    // Inicia transação
    db.exec('BEGIN TRANSACTION');
    try {
      const stmtMov = db.prepare(`
        INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmtMov.run(
        mov_id,
        evento.capataz_id,
        evento.retiro_id,
        evento.data,
        evento.categoria,
        evento.quantidade,
        1 // online server
      );

      const stmtNas = db.prepare(`
        INSERT INTO nascimentos (id, movimentacao_id)
        VALUES (?, ?)
      `);
      stmtNas.run(nas_id, mov_id);

      db.exec('COMMIT');
      return this.buscarMovimentacaoPorId(mov_id);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Registra um óbito animal com transação atômica.
   * Insere em: movimentacoes → evidencias (foto) → obitos.
   *
   * RF009: Registro de óbito offline
   * RF013: Validação de campos obrigatórios
   */
  criarObito(evento: {
    capataz_id: string;
    retiro_id: string;
    data: string;
    categoria: string;
    quantidade: number;
    identificacao_animal: string;
    causa_morte: string;
    foto_base64: string;
    geolocalizacao?: string;
  }) {
    const mov_id = uuidv4();
    const obito_id = uuidv4();
    const foto_id = uuidv4();

    db.exec('BEGIN TRANSACTION');
    try {
      // 1. Inserir movimentação base
      const stmtMov = db.prepare(`
        INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `);
      stmtMov.run(mov_id, evento.capataz_id, evento.retiro_id, evento.data, evento.categoria, evento.quantidade);

      // 2. Inserir evidência (foto obrigatória)
      const stmtFoto = db.prepare(`
        INSERT INTO evidencias (id, movimentacao_id, tipo, arquivo_base64, geolocalizacao, sincronizada)
        VALUES (?, ?, 'FOTO', ?, ?, 1)
      `);
      stmtFoto.run(foto_id, mov_id, evento.foto_base64, evento.geolocalizacao || null);

      // 3. Inserir registro de óbito
      const stmtObito = db.prepare(`
        INSERT INTO obitos (id, movimentacao_id, identificacao_animal, causa_morte, foto_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmtObito.run(obito_id, mov_id, evento.identificacao_animal, evento.causa_morte, foto_id);

      db.exec('COMMIT');

      return {
        movimentacao_id: mov_id,
        obito_id,
        foto_id,
        ...this.buscarMovimentacaoPorId(mov_id)
      };
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Lista todos os eventos zootécnicos com paginação e filtros.
   * Realiza LEFT JOIN em todas as subtabelas para classificar o tipo.
   *
   * RF014: Disponibilizar registros no painel do Coordenador
   * US11: Visualizar movimentações organizadas por retiro e tipo
   */
  listarTodos(filtros: {
    retiro_id?: string;
    categoria?: string;
    data_inicio?: string;
    data_fim?: string;
    tipo?: string;
    pagina?: number;
    limite?: number;
  }) {
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 20;
    const offset = (pagina - 1) * limite;

    let sqlBase = `
      FROM movimentacoes m
      LEFT JOIN retiros r ON r.id = m.retiro_id
      LEFT JOIN usuarios u ON u.id = m.capataz_id
      LEFT JOIN nascimentos n ON n.movimentacao_id = m.id
      LEFT JOIN obitos o ON o.movimentacao_id = m.id
      LEFT JOIN transferencias tr ON tr.movimentacao_id = m.id
      LEFT JOIN compravendas cv ON cv.movimentacao_id = m.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filtros.retiro_id) {
      sqlBase += ' AND m.retiro_id = ?';
      params.push(filtros.retiro_id);
    }
    if (filtros.categoria) {
      sqlBase += ' AND m.categoria = ?';
      params.push(filtros.categoria);
    }
    if (filtros.data_inicio) {
      sqlBase += ' AND date(m.data) >= date(?)';
      params.push(filtros.data_inicio);
    }
    if (filtros.data_fim) {
      sqlBase += ' AND date(m.data) <= date(?)';
      params.push(filtros.data_fim);
    }
    if (filtros.tipo) {
      const tipoUpper = filtros.tipo.toUpperCase();
      if (tipoUpper === 'NASCIMENTO') sqlBase += ' AND n.id IS NOT NULL';
      else if (tipoUpper === 'OBITO') sqlBase += ' AND o.id IS NOT NULL';
      else if (tipoUpper === 'TRANSFERENCIA') sqlBase += ' AND tr.id IS NOT NULL';
      else if (tipoUpper === 'COMPRAVENDA') sqlBase += ' AND cv.id IS NOT NULL';
    }

    // Contagem total
    const stmtCount = db.prepare(`SELECT COUNT(*) AS total ${sqlBase}`);
    const totalResult = stmtCount.get(...params) as any;
    const total = totalResult?.total || 0;

    // Consulta paginada
    const sqlSelect = `
      SELECT
        m.id,
        m.data,
        m.categoria,
        m.quantidade,
        m.capataz_id,
        u.nome AS capataz_nome,
        m.retiro_id,
        r.nome AS retiro_nome,
        m.sincronizado,
        m.validado,
        m.criado_em,
        CASE
          WHEN n.id IS NOT NULL THEN 'NASCIMENTO'
          WHEN o.id IS NOT NULL THEN 'OBITO'
          WHEN tr.id IS NOT NULL THEN 'TRANSFERENCIA'
          WHEN cv.id IS NOT NULL THEN 'COMPRAVENDA'
          ELSE 'OUTRO'
        END AS tipo_evento,
        o.identificacao_animal,
        o.causa_morte,
        tr.retiro_origem_id,
        tr.retiro_destino_id,
        cv.tipo_negocio,
        cv.valor_financeiro
      ${sqlBase}
      ORDER BY m.data DESC, m.criado_em DESC
      LIMIT ? OFFSET ?
    `;

    const paramsComPaginacao = [...params, limite, offset];
    const stmtSelect = db.prepare(sqlSelect);
    const registros = stmtSelect.all(...paramsComPaginacao);

    return {
      registros,
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: Math.ceil(total / limite)
      }
    };
  }

  buscarMovimentacaoPorId(id) {
    const stmt = db.prepare('SELECT * FROM movimentacoes WHERE id = ?');
    return stmt.get(id);
  }
}

export default new EventoRepository();


