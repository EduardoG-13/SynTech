import eventoService from '../services/eventoService';

class EventoController {
  registrarNascimento(req, res) {
    try {
      const { data, retiro_id, categoria, quantidade, capataz_id } = req.body;

      if (!data || !retiro_id || !categoria || !quantidade || !capataz_id) {
        return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos: data, retiro_id, categoria, quantidade, capataz_id' });
      }

      const nascimento = eventoService.registrarNascimento({
        data,
        retiro_id,
        categoria,
        quantidade,
        capataz_id
      });

      return res.status(201).json({ id: nascimento.id, mensagem: 'Registro de nascimento criado com sucesso', registro: nascimento });
    } catch (erro) {
      return res.status(500).json({ erro: 'Erro ao criar registro', detalhe: erro.message });
    }
  }

  /**
   * POST /api/eventos-zootecnicos/obitos
   * Registra um óbito animal com foto obrigatória.
   *
   * RF009, RF013: Campos obrigatórios validados na camada controller e service.
   */
  registrarObito(req, res) {
    try {
      const {
        capataz_id,
        retiro_id,
        data,
        categoria,
        quantidade,
        identificacao_animal,
        causa_morte,
        foto_base64,
        geolocalizacao
      } = req.body;

      // Validação de campos obrigatórios na camada controller (RF013)
      const camposFaltantes: string[] = [];
      if (!capataz_id) camposFaltantes.push('capataz_id');
      if (!retiro_id) camposFaltantes.push('retiro_id');
      if (!data) camposFaltantes.push('data');
      if (!categoria) camposFaltantes.push('categoria');
      if (!quantidade) camposFaltantes.push('quantidade');
      if (!identificacao_animal) camposFaltantes.push('identificacao_animal');
      if (!causa_morte) camposFaltantes.push('causa_morte');
      if (!foto_base64) camposFaltantes.push('foto_base64');

      if (camposFaltantes.length > 0) {
        return res.status(400).json({
          erro: 'Campos obrigatórios não preenchidos',
          campos_faltantes: camposFaltantes
        });
      }

      const obito = eventoService.registrarObito({
        capataz_id,
        retiro_id,
        data,
        categoria,
        quantidade,
        identificacao_animal,
        causa_morte,
        foto_base64,
        geolocalizacao
      });

      return res.status(201).json({
        mensagem: 'Registro de óbito criado com sucesso',
        registro: obito
      });
    } catch (erro) {
      if (erro.message.includes('RF013')) {
        return res.status(422).json({ erro: erro.message });
      }
      return res.status(500).json({ erro: 'Erro ao registrar óbito', detalhe: erro.message });
    }
  }

  /**
   * GET /api/eventos-zootecnicos
   * Lista todos os eventos zootécnicos com paginação e filtros.
   *
   * RF014, US11: Consulta histórica completa para o Coordenador.
   */
  listarEventos(req, res) {
    try {
      const {
        retiro_id,
        categoria,
        data_inicio,
        data_fim,
        tipo,
        pagina,
        limite
      } = req.query;

      const resultado = eventoService.listarEventos({
        retiro_id: retiro_id as string | undefined,
        categoria: categoria as string | undefined,
        data_inicio: data_inicio as string | undefined,
        data_fim: data_fim as string | undefined,
        tipo: tipo as string | undefined,
        pagina: pagina ? parseInt(pagina as string, 10) : undefined,
        limite: limite ? parseInt(limite as string, 10) : undefined
      });

      return res.status(200).json(resultado);
    } catch (erro) {
      return res.status(500).json({ erro: 'Erro ao listar eventos zootécnicos', detalhe: erro.message });
    }
  }
}

export default new EventoController();



