import db from '../config/database';
import { v7 as uuidv7 } from 'uuid';

class SincronizacaoRepository {
  /**
   * Registra uma entrada na tabela de sincronizações.
   */
  registrar(entidade_tipo: string, entidade_id: string, status_envio: string) {
    const id = uuidv7();
    const stmt = db.prepare(`
      INSERT INTO sincronizacoes (id, entidade_tipo, entidade_id, status_envio, tentativas, ultima_tentativa)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `);
    stmt.run(id, entidade_tipo, entidade_id, status_envio);
    return id;
  }

  /**
   * Insere uma tarefa recebida via sincronização em lote.
   */
  inserirTarefa(tarefa: any) {
    const id = tarefa.id || uuidv7();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO tarefas (id, titulo, descricao, status, data_execucao, retiro_id, capataz_id, gerente_id, criada_em, concluida_em, sincronizada)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(
      id,
      tarefa.titulo,
      tarefa.descricao || null,
      tarefa.status || 'PENDENTE',
      tarefa.data_execucao,
      tarefa.retiro_id,
      tarefa.capataz_id,
      tarefa.gerente_id,
      tarefa.criada_em || new Date().toISOString(),
      tarefa.concluida_em || null
    );
    return id;
  }

  /**
   * Insere um alerta recebido via sincronização em lote.
   */
  inserirAlerta(alerta: any) {
    const id = alerta.id || uuidv7();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO alertas (id, tipo, descricao, status, capataz_id, retiro_id, latitude, longitude, criado_em, sincronizado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(
      id,
      alerta.tipo,
      alerta.descricao || null,
      alerta.status || 'ABERTO',
      alerta.capataz_id,
      alerta.retiro_id,
      alerta.latitude,
      alerta.longitude,
      alerta.criado_em || new Date().toISOString()
    );
    return id;
  }

  /**
   * Insere uma movimentação genérica recebida via sincronização em lote.
   */
  inserirMovimentacao(mov: any) {
    const id = mov.id || uuidv7();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado, validado, coordenador_id, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `);
    stmt.run(
      id,
      mov.capataz_id,
      mov.retiro_id,
      mov.data,
      mov.categoria,
      mov.quantidade,
      mov.validado || 0,
      mov.coordenador_id || null,
      mov.criado_em || new Date().toISOString()
    );
    return id;
  }

  /**
   * Insere uma evidência recebida via sincronização em lote.
   */
  inserirEvidencia(ev: any) {
    const id = ev.id || uuidv7();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO evidencias (id, tarefa_id, alerta_id, movimentacao_id, tipo, arquivo_base64, url_arquivo, geolocalizacao, duracao_segundos, conteudo, tamanho_bytes, criada_em, sincronizada)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(
      id,
      ev.tarefa_id || null,
      ev.alerta_id || null,
      ev.movimentacao_id || null,
      ev.tipo,
      ev.arquivo_base64 || null,
      ev.url_arquivo || null,
      ev.geolocalizacao || null,
      ev.duracao_segundos || null,
      ev.conteudo || null,
      ev.tamanho_bytes || null,
      ev.criada_em || new Date().toISOString()
    );
    return id;
  }
}

export default new SincronizacaoRepository();
