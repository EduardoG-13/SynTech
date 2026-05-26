import exportacaoRepository from '../repositories/exportacaoRepository';
import usuarioRepository from '../repositories/usuarioRepository';

class ExportacaoService {
  /**
   * Gera o conteúdo CSV das movimentações consolidadas.
   * Valida que o solicitante é um Coordenador.
   * Registra a exportação na tabela de auditoria.
   *
   * RF015: Exportação de dados consolidados em CSV/Excel
   * RN28: A exportação deve refletir dados validados no banco central
   */
  exportarCsv(coordenador_id: string, filtros: {
    retiro_id?: string;
    data_inicio?: string;
    data_fim?: string;
  }): { csv: string; exportacao_id: string; total_registros: number } {
    // Validação de perfil
    const usuario = usuarioRepository.buscarPorId(coordenador_id);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }
    if ((usuario as any).perfil !== 'Coordenador') {
      throw new Error('ACESSO_NEGADO: Apenas usuários com perfil Coordenador podem exportar dados.');
    }

    // Consultar movimentações
    const registros = exportacaoRepository.consultarMovimentacoesConsolidadas(filtros) as any[];

    // Gerar CSV (UTF-8 BOM + delimitador ;)
    const BOM = '\uFEFF';
    const cabecalho = 'data;retiro;tipo_evento;categoria;quantidade;capataz_responsavel;criado_em';
    const linhas = registros.map((r: any) => {
      return [
        r.data || '',
        (r.retiro || '').replace(/;/g, ','),
        r.tipo_evento || '',
        r.categoria || '',
        r.quantidade ?? '',
        (r.capataz_responsavel || '').replace(/;/g, ','),
        r.criado_em || ''
      ].join(';');
    });

    const csv = BOM + cabecalho + '\n' + linhas.join('\n');

    // Registrar exportação para auditoria
    const exportacao_id = exportacaoRepository.registrarExportacao(
      coordenador_id,
      'CSV',
      filtros.retiro_id,
      filtros.data_inicio,
      filtros.data_fim
    );

    return {
      csv,
      exportacao_id,
      total_registros: registros.length
    };
  }
}

export default new ExportacaoService();
