/**
 * Handler para formulário de Resolver Chamado (chamado-resolver.ejs)
 * Intercepta submit e salva offline se necessário
 */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('form-resolver-chamado');
  const btnSalvar = document.getElementById('btn-salvar-resolucao');

  if (!form || !btnSalvar) {
    console.log('[Resolver Chamado] Formulário não encontrado');
    return;
  }

  btnSalvar.addEventListener('click', async (event) => {
    event.preventDefault();

    try {
      // Coletar dados do formulário
      const descricaoSolucao = document.getElementById('descricao-solucao')?.value || '';
      const dataConclusao = document.getElementById('data-conclusao')?.value || '';
      const chamadoId = document.getElementById('chamado-id')?.value || '';

      // Validar campos obrigatórios
      if (!descricaoSolucao || !dataConclusao) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      // Processar foto se existir
      let fotoBase64 = null;
      const fotoPreview = document.getElementById('preview-foto-resolucao');
      if (fotoPreview && fotoPreview.src) {
        fotoBase64 = fotoPreview.src;
      }

      // Preparar payload
      const payload = {
        chamadoId,
        descricaoSolucao,
        dataConclusao,
        fotoBase64,
        temFoto: !!fotoBase64,
        timestamp: new Date().toISOString(),
      };

      // Fazer requisição com tratamento offline
      const resultado = await window.fazerRequisicaoComOffline(
        `/api/chamados/${chamadoId}/resolver`,
        {
          metodo: 'PUT',
          dados: payload,
          tipo: 'chamado',
        }
      );

      // Feedback ao usuário
      if (resultado.sucesso) {
        alert(' Resolução do chamado registrada com sucesso!');
        window.history.back();
      } else if (resultado.offline) {
        alert(
          ' ' +
            resultado.mensagem +
            '\n\nSua resolução será sincronizada automaticamente quando houver conexão.'
        );
        window.history.back();
      } else {
        alert(' Erro: ' + resultado.mensagem);
      }
    } catch (erro) {
      console.error('[Resolver Chamado] Erro ao processar formulário:', erro);
      alert('Erro inesperado ao processar o formulário');
    }
  });

  // Handler para upload de foto
  const inputFoto = document.getElementById('input-foto-resolucao');
  if (inputFoto) {
    inputFoto.addEventListener('change', (event) => {
      const arquivo = event.target.files?.[0];
      if (!arquivo) return;

      // Validar tamanho (máx 10MB)
      if (arquivo.size > 10 * 1024 * 1024) {
        alert('A foto deve ter no máximo 10MB');
        return;
      }

      // Converter para Base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('preview-foto-resolucao');
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(arquivo);
    });
  }

  // Atualizar contador de caracteres
  const textarea = document.getElementById('descricao-solucao');
  const counter = document.getElementById('char-count');
  if (textarea && counter) {
    textarea.addEventListener('input', () => {
      counter.textContent = textarea.value.length;
    });
  }
});
