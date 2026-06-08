import eventoService from '../services/eventoService';

class EventoController {
  async registrarNascimento(req, res, next): Promise<void> {
    const { data, retiro_id, categoria, quantidade, capataz_id } = req.body;

    if (!data || !retiro_id || !categoria || !quantidade || !capataz_id) {
      res.status(400).json({
        erro: 'Campos obrigatórios não preenchidos: data, retiro_id, categoria, quantidade, capataz_id'
      });
      return;
    }

    try {
      const nascimento = await eventoService.registrarNascimento({
        data,
        retiro_id,
        categoria,
        quantidade,
        capataz_id
      });

      res.status(201).json({
        id: nascimento.id,
        mensagem: 'Registro de nascimento criado com sucesso',
        registro: nascimento
      });
    } catch (erro) {
      next(erro);
    }
  }

  async registrarObito(req, res, next): Promise<void> {
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
      res.status(400).json({
        erro: 'Campos obrigatórios não preenchidos',
        campos_faltantes: camposFaltantes
      });
      return;
    }

    try {
      const obito = await eventoService.registrarObito({
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

      res.status(201).json({
        mensagem: 'Registro de óbito criado com sucesso',
        registro: obito
      });
    } catch (erro: any) {
      if (erro.message.includes('RF013')) {
        res.status(422).json({ erro: erro.message });
        return;
      }

      next(erro);
    }
  }

  async listarEventos(req, res, next): Promise<void> {
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

      const resultado = await eventoService.listarEventos({
        retiro_id: retiro_id as string | undefined,
        categoria: categoria as string | undefined,
        data_inicio: data_inicio as string | undefined,
        data_fim: data_fim as string | undefined,
        tipo: tipo as string | undefined,
        pagina: pagina ? parseInt(pagina as string, 10) : undefined,
        limite: limite ? parseInt(limite as string, 10) : undefined
      });

      res.status(200).json(resultado);
    } catch (erro) {
      next(erro);
    }
  }
}

export default new EventoController();
