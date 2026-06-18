import { v7 as uuidv7 } from 'uuid';
import boletaRepository from '../repositories/boletaRepository';

class BoletaService {
  private enfileirarSync(entidade: string, id: string) {
    boletaRepository.enfileirarSync(entidade, id, uuidv7());
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
    const fotoBase64 = b.foto_base64 || null;
    const ids: string[] = [];
    const agora = new Date().toISOString();
    
    boletaRepository.iniciarTransacao();
    try {
      for (const a of animais) {
        const movId = uuidv7();
        const params = [
          movId, capataz_id, retiro_id, data, a.categoria || '', parseInt(a.quantidade) || 0,
          operacao, grupoId,
          b.pasto || null, b.observacoes || null, b.observacoes_audio || null, b.tem_foto ? 1 : 0, fotoBase64,
          b.raca || null, b.brinco || null, b.causa || null,
          b.tipo || null, b.valor ? parseFloat(b.valor) : null,
          b.retiro_origem || null, b.retiro_destino || null, b.transporte || null,
          b.motorista || null, b.rgcpf || null, b.placa || null,
          b.titulo || null,
          agora
        ];
        boletaRepository.inserirMovimentacao(params);
        ids.push(movId);
        this.enfileirarSync('movimentacao', movId);
      }
      boletaRepository.commit();
    } catch (e) {
      boletaRepository.rollback();
      throw e;
    }

    return { grupo_id: grupoId, ids };
  }

  atualizarBoleta(capataz_id: string, grupoId: string, b: any) {
    const existentes = boletaRepository.buscarBoleta(grupoId, capataz_id);

    if (existentes.length === 0) throw new Error('Boleta não encontrada.');

    const criadoEmStr = existentes[0].criado_em;
    const criadoEm = new Date(criadoEmStr + (criadoEmStr.endsWith('Z') ? '' : 'Z'));
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

    const fotoBase64 = b.foto_base64 || existentes[0].foto_base64 || null;

    boletaRepository.iniciarTransacao();
    try {
      boletaRepository.excluirBoleta(grupoId, capataz_id);

      for (const a of animais) {
        const movId = uuidv7();
        const params = [
          movId, capataz_id, retiro_id, data, a.categoria || '', parseInt(a.quantidade) || 0,
          operacao, grupoId,
          b.pasto || null, b.observacoes || null, b.observacoes_audio || null, b.tem_foto ? 1 : 0, fotoBase64,
          b.raca || null, b.brinco || null, b.causa || null,
          b.tipo || null, b.valor ? parseFloat(b.valor) : null,
          b.retiro_origem || null, b.retiro_destino || null, b.transporte || null,
          b.motorista || null, b.rgcpf || null, b.placa || null,
          b.titulo || null,
          existentes[0].criado_em
        ];
        boletaRepository.inserirMovimentacao(params);
        this.enfileirarSync('movimentacao', movId);
      }
      boletaRepository.commit();
    } catch (e) {
      boletaRepository.rollback();
      throw e;
    }

    return { grupo_id: grupoId };
  }

  listarMinhasBoletas(capataz_id: string) {
    const rows = boletaRepository.listarMinhasBoletas(capataz_id);

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

  obterBoleta(grupoId: string) {
    const rows = boletaRepository.detalharBoleta(grupoId);

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
}

export default new BoletaService();
