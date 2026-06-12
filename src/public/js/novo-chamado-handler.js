const CHAMADO_API_PATH = '/api/chamados';
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB
const STORAGE_KEY_CAPATAZ = 'brpec_capataz_id';
const STORAGE_KEY_RETIRO = 'brpec_retiro_id';

function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    capataz_id: params.get('capataz_id') || null,
    retiro_id: params.get('retiro_id') || null,
  };
}

function persistIdentifiers({ capataz_id, retiro_id }) {
  if (capataz_id) {
    try {
      localStorage.setItem(STORAGE_KEY_CAPATAZ, capataz_id);
    } catch (_e) {
      // Ignora se o navegador não permitir localStorage
    }
  }

  if (retiro_id) {
    try {
      localStorage.setItem(STORAGE_KEY_RETIRO, retiro_id);
    } catch (_e) {
      // Ignora se o navegador não permitir localStorage
    }
  }
}

function loadIdentifiers() {
  const params = parseQueryParams();
  try {
    return {
      capataz_id: params.capataz_id || localStorage.getItem(STORAGE_KEY_CAPATAZ) || null,
      retiro_id: params.retiro_id || localStorage.getItem(STORAGE_KEY_RETIRO) || null,
    };
  } catch (_e) {
    return {
      capataz_id: params.capataz_id,
      retiro_id: params.retiro_id,
    };
  }
}

function resetFileLabel() {
  const fileLabel = document.querySelector('.file-input-wrapper span');
  if (fileLabel) fileLabel.textContent = 'Selecionar imagem';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao ler o arquivo de imagem.'));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao converter arquivo para Base64.'));
    reader.onabort = () => reject(new Error('Leitura de arquivo abortada.'));
    reader.readAsDataURL(file);
  });
}

function buildRequestPayload({ descricao, tipo, latitude, longitude, fotoBase64, capataz_id, retiro_id, local_referencia, audio_base64 }) {
  const payload = {
    tipo,
    descricao,
    latitude: Number(latitude),
    longitude: Number(longitude),
    foto_base64: fotoBase64,
  };

  if (capataz_id) payload.capataz_id = capataz_id;
  if (retiro_id) payload.retiro_id = retiro_id;
  if (local_referencia) payload.local_referencia = local_referencia;
  if (audio_base64) payload.audio_base64 = audio_base64;

  return payload;
}

async function salvarOffline(dados) {
  if (window.brpecIndexedDb && typeof window.brpecIndexedDb.salvarFila === 'function') {
    await window.brpecIndexedDb.salvarFila('chamado', {
      url: CHAMADO_API_PATH,
      metodo: 'POST',
      dados,
      tentativas: 0,
      ultimaTentativa: new Date().toISOString(),
    });
  } else {
    throw new Error('IndexedDB ou função de salvamento offline não disponível.');
  }
}

async function enviarChamado(payload) {
  if (typeof window.fazerRequisicaoComOffline === 'function') {
    return window.fazerRequisicaoComOffline(CHAMADO_API_PATH, {
      metodo: 'POST',
      dados: payload,
      tipo: 'chamado',
    });
  }

  return {
    sucesso: false,
    offline: true,
    mensagem: 'Mecanismo offline não encontrado. Salvando localmente.',
  };
}

function updateHiddenIds({ capataz_id, retiro_id }) {
  const capatazInput = document.getElementById('capataz_id');
  const retiroInput = document.getElementById('retiro_id');

  if (capatazInput && capataz_id) capatazInput.value = capataz_id;
  if (retiroInput && retiro_id) retiroInput.value = retiro_id;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-novo-chamado');
  const fileInput = document.getElementById('foto');
  const fileLabel = document.querySelector('.file-input-wrapper span');

  if (!form) return;

  const storedIdentifiers = loadIdentifiers();
  persistIdentifiers(storedIdentifiers);
  updateHiddenIds(storedIdentifiers);

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        if (fileLabel) fileLabel.textContent = `${fileInput.files[0].name}`;
      } else {
        resetFileLabel();
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const descricao = document.getElementById('descricao')?.value.trim() || '';
    const latitude = document.getElementById('latitude')?.value.trim() || '';
    const longitude = document.getElementById('longitude')?.value.trim() || '';
    const tipo = document.getElementById('tipo-ocorrencia')?.value || '';
    const capatazId = document.getElementById('capataz_id')?.value || storedIdentifiers.capataz_id || '';
    const retiroId = document.getElementById('retiro_id')?.value || storedIdentifiers.retiro_id || '';

    if (!tipo) {
      alert('Escolha o tipo de ocorrência.');
      return;
    }

    if (descricao.length < 10) {
      alert('A descrição deve conter ao menos 10 caracteres.');
      return;
    }

    if (!latitude || !longitude) {
      alert('Preencha as coordenadas GPS.');
      return;
    }

    if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
      alert('As coordenadas GPS devem ser números válidos.');
      return;
    }

    // Foto agora é OPCIONAL
    let fotoBase64 = '';
    if (fileInput?.files?.length) {
      const fotoFile = fileInput.files[0];
      if (!fotoFile.type.startsWith('image/')) {
        alert('O arquivo selecionado deve ser uma imagem.');
        return;
      }
      if (fotoFile.size > MAX_IMAGE_BYTES) {
        alert('A imagem selecionada é muito grande. Use um arquivo menor que 6 MB.');
        return;
      }
      try {
        fotoBase64 = await readFileAsDataUrl(fotoFile);
      } catch (erro) {
        console.error('Erro ao converter imagem para Base64:', erro);
        alert('Não foi possível converter a imagem. Tente novamente.');
        return;
      }
    }

    const localRef = document.getElementById('local-referencia')?.value || '';
    const audioBase64 = (typeof window.__audioChamadoBase64 === 'function')
      ? window.__audioChamadoBase64()
      : '';

    const payload = buildRequestPayload({
      descricao,
      tipo,
      latitude,
      longitude,
      fotoBase64,
      capataz_id: capatazId,
      retiro_id: retiroId,
      local_referencia: localRef,
      audio_base64: audioBase64,
    });

    let resultado;

    try {
      resultado = await enviarChamado(payload);
    } catch (erro) {
      console.error('Falha ao enviar chamado:', erro);
      resultado = { sucesso: false, offline: true, mensagem: erro.message || 'Erro de rede' };
    }

    function irParaSucesso(textoMsg) {
      // Guarda resumo do chamado pra tela /sucesso exibir
      try {
        var resumo = {
          operacao: 'chamado',
          data: new Date().toISOString().slice(0, 10),
          retiro: payload.retiro_id || '',
          observacoes: payload.descricao,
          tem_foto: !!payload.foto_base64,
          tipo: payload.tipo,
          criadoEm: new Date().toISOString(),
        };
        localStorage.setItem('brpec_ultimo_registro', JSON.stringify(resumo));
      } catch (_) {}
      // Mostra mensagem rápida e redireciona
      var msgEl = document.getElementById('novo-msg');
      if (msgEl) {
        msgEl.textContent = textoMsg;
        msgEl.className = 'form-msg sucesso';
        msgEl.style.display = 'block';
      }
      setTimeout(function() { window.location.href = '/sucesso'; }, 800);
    }

    if (resultado.sucesso) {
      irParaSucesso('✅ Chamado enviado com sucesso!');
      return;
    }

    if (resultado.offline) {
      try {
        await salvarOffline(payload);
        irParaSucesso('✅ Chamado salvo localmente. Será sincronizado quando voltar a conexão.');
      } catch (erro) {
        console.error('Erro ao salvar chamado localmente:', erro);
        alert('Ocorreu um erro ao salvar o chamado localmente. Tente novamente.');
      }
      return;
    }

    if (resultado.mensagem && resultado.mensagem.toLowerCase().includes('network')) {
      try {
        await salvarOffline(payload);
        irParaSucesso('✅ Chamado salvo localmente. Será sincronizado quando voltar a conexão.');
        return;
      } catch (erro) {
        console.error('Erro ao salvar chamado localmente após falha de rede:', erro);
      }
    }

    alert(`Não foi possível enviar o chamado: ${resultado.mensagem || 'erro desconhecido'}`);
  });
});
