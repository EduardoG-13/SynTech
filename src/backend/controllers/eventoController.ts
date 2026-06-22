import eventoService from '../services/eventoService';
import { AppError } from '../utils/AppError';

class EventoController {
  async registrarNascimento(req, res, next): Promise<void> {
    try {
      const { data, retiro_id, categoria, quantidade, capataz_id } = req.body;

      if (!data || !retiro_id || !categoria || !quantidade || !capataz_id) {
        throw new AppError(400, 'Campos obrigatórios não preenchidos: data, retiro_id, categoria, quantidade, capataz_id');
      }
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
    } catch (erro: any) {
      if (erro instanceof AppError) return next(erro);
      if (erro.message?.includes('RN27') || erro.message?.includes('RF013')) {
        return next(new AppError(422, erro.message));
      }
      next(erro);
    }
  }

  async registrarObito(req, res, next): Promise<void> {
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

      const camposGeraisFaltantes: string[] = [];

      if (!capataz_id) camposGeraisFaltantes.push('capataz_id');
      if (!retiro_id) camposGeraisFaltantes.push('retiro_id');
      if (!data) camposGeraisFaltantes.push('data');
      if (!categoria) camposGeraisFaltantes.push('categoria');
      if (!quantidade) camposGeraisFaltantes.push('quantidade');

      if (camposGeraisFaltantes.length > 0) {
        throw new AppError(400, 'Campos obrigatórios não preenchidos: ' + camposGeraisFaltantes.join(', '));
      }

      const camposRF013Faltantes: string[] = [];
      if (!identificacao_animal) camposRF013Faltantes.push('identificacao_animal');
      if (!causa_morte) camposRF013Faltantes.push('causa_morte');
      if (!foto_base64) camposRF013Faltantes.push('foto_base64');

      if (camposRF013Faltantes.length > 0) {
        throw new AppError(422, 'Campos obrigatórios não preenchidos: ' + camposRF013Faltantes.join(', '));
      }
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
      if (erro instanceof AppError) return next(erro);
      // Mensagens de validação amigáveis voltam direto pro usuário
      if (erro.message && (
        erro.message.includes('obrigatório') ||
        erro.message.includes('obrigatória') ||
        erro.message.includes('Informe') ||
        erro.message.includes('Selecione') ||
        erro.message.includes('foto da carcaça')
      )) {
        return next(new AppError(422, erro.message));
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
