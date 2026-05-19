import eventoService from '../services/eventoService';

class EventoController {
  registrarNascimento(req, res) {
    try {
      const { data, retiro_id, categoria, quantidade, capataz_id } = req.body;

      const nascimento = eventoService.registrarNascimento({
        data,
        retiro_id,
        categoria,
        quantidade,
        capataz_id
      });

      return res.status(201).json({ id: nascimento.id, mensagem: 'Registro de nascimento criado com sucesso', registro: nascimento });
    } catch (erro) {
      if (erro.message.includes('obrigatórios')) {
        return res.status(400).json({ erro: erro.message });
      }
      return res.status(500).json({ erro: 'Erro ao criar registro', detalhe: erro.message });
    }
  }
}

export default new EventoController();


