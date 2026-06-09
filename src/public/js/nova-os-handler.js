/**
 * Handler para formulário de Nova Ordem de Serviço (nova-os.ejs)
 * Intercepta submit e salva offline se necessário
 */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('form-nova-os');

  if (!form) {
    console.log('[Nova OS] Formulário não encontrado');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      // Coletar dados do formulário
      const equipe = document.querySelector('.pill.active')?.dataset.equipe || '';
      const operacao = document.getElementById('os-operacao')?.value || '';
      const retiro = document.getElementById('os-retiro')?.value || '';
      const responsavel = document.getElementById('os-responsavel')?.value || '';
      const prioridade =
        document.querySelector('input[name="prioridade"]:checked')?.value || 'media';
      const prazo = document.getElementById('os-prazo')?.value || '';
      const descricao = document.getElementById('os-descricao')?.value || '';

      // Validar campos obrigatórios
      if (!operacao || !retiro || !responsavel) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      // Preparar payload
      const payload = {
        equipe,
        operacao,
        retiro,
        responsavel,
        prioridade,
        prazo,
        descricao,
        timestamp: new Date().toISOString(),
      };

      // Fazer requisição com tratamento offline
      const resultado = await window.fazerRequisicaoComOffline(
        '/api/tarefas',
        {
          metodo: 'POST',
          dados: payload,
          tipo: operacao === 'movimentacao' ? 'tarefa' : 'chamado',
        }
      );

      // Feedback ao usuário
      if (resultado.sucesso) {
        alert(
          '✅ Ordem de Serviço enviada com sucesso!'
        );
        form.reset();
        window.history.back();
      } else if (resultado.offline) {
        alert(
          '📱 ' +
            resultado.mensagem +
            '\n\nSua ordem será sincronizada automaticamente quando houver conexão.'
        );
        form.reset();
        window.history.back();
      } else {
        alert('❌ Erro: ' + resultado.mensagem);
      }
    } catch (erro) {
      console.error('[Nova OS] Erro ao processar formulário:', erro);
      alert('Erro inesperado ao processar o formulário');
    }
  });

  // Permitir seleção de equipe
  document.querySelectorAll('.pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
});
