import db from '../config/database';
import supabasePool from '../config/supabasePool';

class CloudSyncRepository {
  public obterSincronizacoesPendentes(maxTentativas = 10) {
    return db.prepare(`
      SELECT * FROM sincronizacoes
      WHERE status_envio IN ('PENDENTE', 'ERRO') AND tentativas < ?
      ORDER BY
        CASE entidade_tipo
          WHEN 'retiro'       THEN 0
          WHEN 'usuario'      THEN 1
          WHEN 'evidencia'    THEN 2
          WHEN 'tarefa'       THEN 3
          WHEN 'movimentacao' THEN 4
          WHEN 'alerta'       THEN 5
          ELSE 9
        END ASC,
        criada_em ASC
    `).all(maxTentativas) as any[];
  }

  public async verificarConexaoSupabase() {
    await supabasePool.query('SELECT 1');
  }

  public obterTarefaLocal(id: string) {
    return db.prepare('SELECT * FROM tarefas WHERE id = ?').get(id) as any;
  }

  public async inserirTarefaSupabase(tarefa: any) {
    await supabasePool.query(`
      INSERT INTO tarefas (id, titulo, descricao, status, data_execucao, retiro_id, capataz_id, gerente_id, criada_em, concluida_em, sincronizada)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descricao = EXCLUDED.descricao,
        status = EXCLUDED.status,
        data_execucao = EXCLUDED.data_execucao,
        retiro_id = EXCLUDED.retiro_id,
        capataz_id = EXCLUDED.capataz_id,
        gerente_id = EXCLUDED.gerente_id,
        concluida_em = EXCLUDED.concluida_em,
        sincronizada = true
    `, [
      tarefa.id, tarefa.titulo, tarefa.descricao, tarefa.status, tarefa.data_execucao,
      tarefa.retiro_id, tarefa.capataz_id, tarefa.gerente_id, tarefa.criada_em, tarefa.concluida_em
    ]);
  }

  public marcarTarefaLocalSincronizada(id: string) {
    db.prepare('UPDATE tarefas SET sincronizada = 1 WHERE id = ?').run(id);
  }

  public obterAlertaLocal(id: string) {
    return db.prepare('SELECT * FROM alertas WHERE id = ?').get(id) as any;
  }

  public async inserirAlertaSupabase(alerta: any) {
    await supabasePool.query(`
      INSERT INTO alertas (id, tipo, descricao, status, capataz_id, retiro_id, latitude, longitude, criado_em, sincronizado, foto_id, tecnico_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        tipo = EXCLUDED.tipo,
        descricao = EXCLUDED.descricao,
        status = EXCLUDED.status,
        capataz_id = EXCLUDED.capataz_id,
        retiro_id = EXCLUDED.retiro_id,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        sincronizado = true,
        foto_id = EXCLUDED.foto_id,
        tecnico_id = EXCLUDED.tecnico_id
    `, [
      alerta.id, alerta.tipo, alerta.descricao, alerta.status, alerta.capataz_id,
      alerta.retiro_id, alerta.latitude, alerta.longitude, alerta.criado_em,
      alerta.foto_id, alerta.tecnico_id
    ]);
  }

  public marcarAlertaLocalSincronizado(id: string) {
    db.prepare('UPDATE alertas SET sincronizado = 1 WHERE id = ?').run(id);
  }

  public obterMovimentacaoLocal(id: string) {
    return db.prepare('SELECT * FROM movimentacoes WHERE id = ?').get(id) as any;
  }

  public obterNascimentoLocal(movId: string) {
    return db.prepare('SELECT * FROM nascimentos WHERE movimentacao_id = ?').get(movId) as any;
  }

  public obterObitoLocal(movId: string) {
    return db.prepare('SELECT * FROM obitos WHERE movimentacao_id = ?').get(movId) as any;
  }

  public obterTransferenciaLocal(movId: string) {
    return db.prepare('SELECT * FROM transferencias WHERE movimentacao_id = ?').get(movId) as any;
  }

  public obterCompraVendaLocal(movId: string) {
    return db.prepare('SELECT * FROM compravendas WHERE movimentacao_id = ?').get(movId) as any;
  }

  public async inserirMovimentacaoCompletaSupabase(mov: any, nas: any, ob: any, tr: any, cv: any) {
    const client = await supabasePool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        INSERT INTO movimentacoes (id, capataz_id, retiro_id, data, categoria, quantidade, sincronizado, validado, coordenador_id, criado_em)
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          capataz_id = EXCLUDED.capataz_id,
          retiro_id = EXCLUDED.retiro_id,
          data = EXCLUDED.data,
          categoria = EXCLUDED.categoria,
          quantidade = EXCLUDED.quantidade,
          sincronizado = true,
          validado = EXCLUDED.validado,
          coordenador_id = EXCLUDED.coordenador_id
      `, [
        mov.id, mov.capataz_id, mov.retiro_id, mov.data, mov.categoria, mov.quantidade,
        mov.validado === 1 || mov.validado === true || mov.validado === 'true',
        mov.coordenador_id || null, mov.criado_em
      ]);

      if (nas) {
        await client.query(`
          INSERT INTO nascimentos (id, movimentacao_id)
          VALUES ($1, $2)
          ON CONFLICT (id) DO NOTHING
        `, [nas.id, nas.movimentacao_id]);
      }

      if (ob) {
        await client.query(`
          INSERT INTO obitos (id, movimentacao_id, identificacao_animal, causa_morte, foto_id)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            identificacao_animal = EXCLUDED.identificacao_animal,
            causa_morte = EXCLUDED.causa_morte,
            foto_id = EXCLUDED.foto_id
        `, [ob.id, ob.movimentacao_id, ob.identificacao_animal, ob.causa_morte, ob.foto_id]);
      }

      if (tr) {
        await client.query(`
          INSERT INTO transferencias (id, movimentacao_id, retiro_origem_id, retiro_destino_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET
            retiro_origem_id = EXCLUDED.retiro_origem_id,
            retiro_destino_id = EXCLUDED.retiro_destino_id
        `, [tr.id, tr.movimentacao_id, tr.retiro_origem_id, tr.retiro_destino_id]);
      }

      if (cv) {
        await client.query(`
          INSERT INTO compravendas (id, movimentacao_id, tipo_negocio, valor_financeiro)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET
            tipo_negocio = EXCLUDED.tipo_negocio,
            valor_financeiro = EXCLUDED.valor_financeiro
        `, [cv.id, cv.movimentacao_id, cv.tipo_negocio, cv.valor_financeiro]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public marcarMovimentacaoLocalSincronizada(id: string) {
    db.prepare('UPDATE movimentacoes SET sincronizado = 1 WHERE id = ?').run(id);
  }

  public obterEvidenciaLocal(id: string) {
    return db.prepare('SELECT * FROM evidencias WHERE id = ?').get(id) as any;
  }

  public async inserirEvidenciaSupabase(ev: any) {
    await supabasePool.query(`
      INSERT INTO evidencias (id, tarefa_id, alerta_id, movimentacao_id, tipo, arquivo_base64, url_arquivo, geolocalizacao, duracao_segundos, conteudo, tamanho_bytes, criada_em, sincronizada)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      ON CONFLICT (id) DO UPDATE SET
        tarefa_id = EXCLUDED.tarefa_id,
        alerta_id = EXCLUDED.alerta_id,
        movimentacao_id = EXCLUDED.movimentacao_id,
        tipo = EXCLUDED.tipo,
        arquivo_base64 = EXCLUDED.arquivo_base64,
        url_arquivo = EXCLUDED.url_arquivo,
        geolocalizacao = EXCLUDED.geolocalizacao,
        duracao_segundos = EXCLUDED.duracao_segundos,
        conteudo = EXCLUDED.conteudo,
        tamanho_bytes = EXCLUDED.tamanho_bytes,
        sincronizada = true
    `, [
      ev.id, ev.tarefa_id, ev.alerta_id, ev.movimentacao_id, ev.tipo, ev.arquivo_base64,
      ev.url_arquivo, ev.geolocalizacao, ev.duracao_segundos, ev.conteudo, ev.tamanho_bytes, ev.criada_em
    ]);
  }

  public marcarEvidenciaLocalSincronizada(id: string) {
    db.prepare('UPDATE evidencias SET sincronizada = 1 WHERE id = ?').run(id);
  }

  public obterRetiroLocal(id: string) {
    return db.prepare('SELECT * FROM retiros WHERE id = ?').get(id) as any;
  }

  public async inserirRetiroSupabase(r: any) {
    await supabasePool.query(`
      INSERT INTO retiros (id, nome, numero, localizacao, coordenador_id, capataz_id, criado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        numero = EXCLUDED.numero,
        localizacao = EXCLUDED.localizacao,
        coordenador_id = EXCLUDED.coordenador_id,
        capataz_id = EXCLUDED.capataz_id
    `, [r.id, r.nome, r.numero, r.localizacao, r.coordenador_id, r.capataz_id, r.criado_em]);
  }

  public obterUsuarioLocal(id: string) {
    return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as any;
  }

  public async inserirUsuarioSupabase(u: any) {
    await supabasePool.query(`
      INSERT INTO usuarios (id, nome, senha, perfil, retiro_id, is_admin, criado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        senha = EXCLUDED.senha,
        perfil = EXCLUDED.perfil,
        retiro_id = EXCLUDED.retiro_id,
        is_admin = EXCLUDED.is_admin
    `, [u.id, u.nome, u.senha, u.perfil, u.retiro_id, u.is_admin || 0, u.criado_em]);
  }

  public marcarSincronizacaoSucesso(id: string) {
    db.prepare(`
      UPDATE sincronizacoes
      SET status_envio = 'SINCRONIZADO',
          tentativas = tentativas + 1,
          ultima_tentativa = datetime('now')
      WHERE id = ?
    `).run(id);
  }

  public marcarSincronizacaoErro(id: string) {
    db.prepare(`
      UPDATE sincronizacoes
      SET status_envio = 'ERRO',
          tentativas = tentativas + 1,
          ultima_tentativa = datetime('now')
      WHERE id = ?
    `).run(id);
  }
}

export default new CloudSyncRepository();
