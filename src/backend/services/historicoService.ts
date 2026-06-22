import historicoRepository from '../repositories/historicoRepository';

interface SessUsuario {
  id: string;
  perfil: string;
  retiro_id?: string | null;
  categoria?: string;
}

export class HistoricoService {
  private retirosVisiveis(sess: SessUsuario): string[] | null {
    if (sess.perfil === 'Gerente') return null;
    if (sess.perfil === 'Coordenador') {
      return historicoRepository.obterRetirosDoCoordenador(sess.id);
    }
    if (sess.perfil === 'Capataz' && sess.retiro_id) return [sess.retiro_id];
    if (sess.perfil === 'Infraestrutura') return null;
    return [];
  }

  public listarBoletas(sess: SessUsuario, filtros: any) {
    if (sess.perfil === 'Infraestrutura') return [];

    const permitidos = this.retirosVisiveis(sess);
    const rows = historicoRepository.listarBoletas(permitidos, sess.perfil, sess.id, filtros);

    const grupos: Record<string, any> = {};
    for (const r of rows) {
      const key = r.grupo_id || r.id;
      if (!grupos[key]) {
        grupos[key] = {
          id: key,
          operacao: r.tipo_operacao,
          data: r.data,
          retiro_nome: r.retiro_nome,
          capataz_nome: r.capataz_nome,
          aprovada: !!r.aprovado_por_coordenador_id,
          criadoEm: r.criado_em,
          animais: [],
        };
      }
      grupos[key].animais.push({ categoria: r.categoria, quantidade: r.quantidade });
    }
    return Object.values(grupos);
  }

  public listarChamados(sess: SessUsuario, filtros: any) {
    const permitidos = this.retirosVisiveis(sess);
    return historicoRepository.listarChamados(permitidos, sess.perfil, sess.retiro_id, sess.categoria, filtros);
  }
}

export default new HistoricoService();
