import supabasePool from '../config/supabasePool';
import { v7 as uuidv7 } from 'uuid';

class SincronizacaoRepository {
  async registrar(
    entidade_tipo: string,
    entidade_id: string,
    status_envio: string
  ): Promise<string> {
    const id = uuidv7();

    await supabasePool.query(
      `
      INSERT INTO sincronizacoes (
        id,
        entidade_tipo,
        entidade_id,
        status_envio,
        tentativas,
        ultima_tentativa
      )
      VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
      `,
      [id, entidade_tipo, entidade_id, status_envio]
    );

    return id;
  }

  async inserirTarefa(tarefa: any): Promise<string> {
    const id = tarefa.id || uuidv7();

    await supabasePool.query(
      `
      INSERT INTO tarefas (
        id,
        titulo,
        descricao,
        status,
        data_execucao,
        retiro_id,
        capataz_id,
        gerente_id,
        criada_em,
        concluida_em,
        sincronizada
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
      ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descricao = EXCLUDED.descricao,
        status = EXCLUDED.status,
        data_execucao = EXCLUDED.data_execucao,
        retiro_id = EXCLUDED.retiro_id,
        capataz_id = EXCLUDED.capataz_id,
        gerente_id = EXCLUDED.gerente_id,
        concluida_em = EXCLUDED.concluida_em,
        sincronizada = 1
      `,
      [
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
      ]
    );

    return id;
  }

  async inserirAlerta(alerta: any): Promise<string> {
    const id = alerta.id || uuidv7();

    await supabasePool.query(
      `
      INSERT INTO alertas (
        id,
        tipo,
        descricao,
        status,
        capataz_id,
        retiro_id,
        latitude,
        longitude,
        criado_em,
        sincronizado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
      ON CONFLICT (id) DO UPDATE SET
        tipo = EXCLUDED.tipo,
        descricao = EXCLUDED.descricao,
        status = EXCLUDED.status,
        capataz_id = EXCLUDED.capataz_id,
        retiro_id = EXCLUDED.retiro_id,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        sincronizado = 1
      `,
      [
        id,
        alerta.tipo,
        alerta.descricao || null,
        alerta.status || 'ABERTO',
        alerta.capataz_id,
        alerta.retiro_id,
        alerta.latitude,
        alerta.longitude,
        alerta.criado_em || new Date().toISOString()
      ]
    );

    return id;
  }

  async inserirMovimentacao(mov: any): Promise<string> {
    const id = mov.id || uuidv7();

    await supabasePool.query(
      `
      INSERT INTO movimentacoes (
        id,
        capataz_id,
        retiro_id,
        data,
        categoria,
        quantidade,
        sincronizado,
        validado,
        coordenador_id,
        criado_em
      )
      VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        capataz_id = EXCLUDED.capataz_id,
        retiro_id = EXCLUDED.retiro_id,
        data = EXCLUDED.data,
        categoria = EXCLUDED.categoria,
        quantidade = EXCLUDED.quantidade,
        sincronizado = 1,
        validado = EXCLUDED.validado,
        coordenador_id = EXCLUDED.coordenador_id
      `,
      [
        id,
        mov.capataz_id,
        mov.retiro_id,
        mov.data,
        mov.categoria,
        mov.quantidade,
        mov.validado || 0,
        mov.coordenador_id || null,
        mov.criado_em || new Date().toISOString()
      ]
    );

    return id;
  }

  async inserirEvidencia(ev: any): Promise<string> {
    const id = ev.id || uuidv7();

    await supabasePool.query(
      `
      INSERT INTO evidencias (
        id,
        tarefa_id,
        alerta_id,
        movimentacao_id,
        tipo,
        arquivo_base64,
        url_arquivo,
        geolocalizacao,
        duracao_segundos,
        conteudo,
        tamanho_bytes,
        criada_em,
        sincronizada
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)
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
        sincronizada = 1
      `,
      [
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
      ]
    );

    return id;
  }

  async processarLote(registros: any[]): Promise<void> {
    const client = await supabasePool.connect();

    try {
      await client.query('BEGIN');

      for (const registro of registros) {
        if (registro.entidade_tipo === 'TAREFA') {
          await client.query(
            `
            INSERT INTO tarefas (
              id, titulo, descricao, status, data_execucao,
              retiro_id, capataz_id, gerente_id, criada_em, concluida_em, sincronizada
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
            ON CONFLICT (id) DO UPDATE SET
              titulo = EXCLUDED.titulo,
              descricao = EXCLUDED.descricao,
              status = EXCLUDED.status,
              data_execucao = EXCLUDED.data_execucao,
              retiro_id = EXCLUDED.retiro_id,
              capataz_id = EXCLUDED.capataz_id,
              gerente_id = EXCLUDED.gerente_id,
              concluida_em = EXCLUDED.concluida_em,
              sincronizada = 1
            `,
            [
              registro.id || uuidv7(),
              registro.titulo,
              registro.descricao || null,
              registro.status || 'PENDENTE',
              registro.data_execucao,
              registro.retiro_id,
              registro.capataz_id,
              registro.gerente_id,
              registro.criada_em || new Date().toISOString(),
              registro.concluida_em || null
            ]
          );
        }

        if (registro.entidade_tipo === 'ALERTA') {
          await client.query(
            `
            INSERT INTO alertas (
              id, tipo, descricao, status, capataz_id,
              retiro_id, latitude, longitude, criado_em, sincronizado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
            ON CONFLICT (id) DO UPDATE SET
              tipo = EXCLUDED.tipo,
              descricao = EXCLUDED.descricao,
              status = EXCLUDED.status,
              capataz_id = EXCLUDED.capataz_id,
              retiro_id = EXCLUDED.retiro_id,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              sincronizado = 1
            `,
            [
              registro.id || uuidv7(),
              registro.tipo,
              registro.descricao || null,
              registro.status || 'ABERTO',
              registro.capataz_id,
              registro.retiro_id,
              registro.latitude,
              registro.longitude,
              registro.criado_em || new Date().toISOString()
            ]
          );
        }

        if (registro.entidade_tipo === 'MOVIMENTACAO') {
          await client.query(
            `
            INSERT INTO movimentacoes (
              id, capataz_id, retiro_id, data, categoria,
              quantidade, sincronizado, validado, coordenador_id, criado_em
            )
            VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              capataz_id = EXCLUDED.capataz_id,
              retiro_id = EXCLUDED.retiro_id,
              data = EXCLUDED.data,
              categoria = EXCLUDED.categoria,
              quantidade = EXCLUDED.quantidade,
              sincronizado = 1,
              validado = EXCLUDED.validado,
              coordenador_id = EXCLUDED.coordenador_id
            `,
            [
              registro.id || uuidv7(),
              registro.capataz_id,
              registro.retiro_id,
              registro.data,
              registro.categoria,
              registro.quantidade,
              registro.validado || 0,
              registro.coordenador_id || null,
              registro.criado_em || new Date().toISOString()
            ]
          );
        }

        if (registro.entidade_tipo === 'EVIDENCIA') {
          await client.query(
            `
            INSERT INTO evidencias (
              id, tarefa_id, alerta_id, movimentacao_id, tipo,
              arquivo_base64, url_arquivo, geolocalizacao,
              duracao_segundos, conteudo, tamanho_bytes, criada_em, sincronizada
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)
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
              sincronizada = 1
            `,
            [
              registro.id || uuidv7(),
              registro.tarefa_id || null,
              registro.alerta_id || null,
              registro.movimentacao_id || null,
              registro.tipo,
              registro.arquivo_base64 || null,
              registro.url_arquivo || null,
              registro.geolocalizacao || null,
              registro.duracao_segundos || null,
              registro.conteudo || null,
              registro.tamanho_bytes || null,
              registro.criada_em || new Date().toISOString()
            ]
          );
        }

        await client.query(
          `
          INSERT INTO sincronizacoes (
            id,
            entidade_tipo,
            entidade_id,
            status_envio,
            tentativas,
            ultima_tentativa
          )
          VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
          `,
          [
            uuidv7(),
            registro.entidade_tipo,
            registro.id,
            'SINCRONIZADO'
          ]
        );
      }

      await client.query('COMMIT');
    } catch (erro) {
      await client.query('ROLLBACK');
      throw erro;
    } finally {
      client.release();
    }
  }
}

export default new SincronizacaoRepository();