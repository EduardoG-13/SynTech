const OBITO_API_PATH = '/api/eventos/obitos';
const NASCIMENTO_API_PATH = '/api/eventos/nascimentos';
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
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
    } catch (_e) {}
  }
  if (retiro_id) {
    try {
      localStorage.setItem(STORAGE_KEY_RETIRO, retiro_id);
    } catch (_e) {}
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
    return { capataz_id: params.capataz_id, retiro_id: params.retiro_id };
  }
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

function setSubmitLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Aguarde...' : 'Registrar Boleta';
}

async function salvarOffline(tipo, dados) {
  if (window.brpecIndexedDb && typeof window.brpecIndexedDb.salvarFila === 'function') {
    return window.brpecIndexedDb.salvarFila(tipo, {
      url: tipo === 'obito' ? OBITO_API_PATH : NASCIMENTO_API_PATH,
      metodo: 'POST',
      dados,
      tentativas: 0,
      ultimaTentativa: new Date().toISOString(),
    });
  }
  throw new Error('IndexedDB não disponível para armazenamento offline.');
}

async function enviarParaApi(path, payload) {
  if (typeof window.fazerRequisicaoComOffline === 'function') {
    return window.fazerRequisicaoComOffline(path, {
      metodo: 'POST',
      dados: payload,
      tipo: path === OBITO_API_PATH ? 'obito' : 'nascimento',
    });
  }
  // fallback: fetch direto
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.erro || `Erro ${response.status}`);
  }
  return { sucesso: true, dados: await response.json() };
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-nova-boleta');
  if (!form) return;

  const ids = loadIdentifiers();
  persistIdentifiers(ids);

  const tipoBoleta = document.getElementById('tipo-boleta');
  const morteFields = document.getElementById('morte-fields');
  const quantidadeWrap = document.getElementById('quantidade-wrap');

  // Atualizar visibilidade dos campos condicionais ao tipo
  function atualizarCamposVisiveis() {
    const isMorte = tipoBoleta?.value === 'morte';

    if (morteFields) {
      morteFields.classList.toggle('hidden', !isMorte);
    }

    const causaMorte = document.getElementById('causa-morte');
    const fotoMorte = document.getElementById('foto-morte');
    if (causaMorte) causaMorte.required = isMorte;
    if (fotoMorte) fotoMorte.required = isMorte;

    // quantidade só faz sentido para nascimento (óbito = 1 por chip)
    if (quantidadeWrap) {
      quantidadeWrap.classList.toggle('hidden', isMorte);
    }
    const quantidadeInput = document.getElementById('quantidade-boleta');
    if (quantidadeInput) quantidadeInput.required = !isMorte;
  }

  if (tipoBoleta) {
    tipoBoleta.addEventListener('change', atualizarCamposVisiveis);
    atualizarCamposVisiveis();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const tipo = tipoBoleta?.value || '';

    if (!tipo) {
      alert('Selecione o tipo de boleta (Nascimento ou Morte).');
      return;
    }

    const data = document.getElementById('data-boleta')?.value || '';
    const chipId = document.getElementById('chip-id')?.value.trim() || '';
    const categoria = document.getElementById('categoria-boleta')?.value || '';

    if (!data) {
      alert('Informe a data do evento.');
      return;
    }

    if (!categoria) {
      alert('Selecione a categoria do animal.');
      return;
    }

    if (tipo === 'morte') {
      // RN07: foto e causa são obrigatórios para óbito
      const fotoInput = document.getElementById('foto-morte');
      const causaMorte = document.getElementById('causa-morte')?.value || '';

      if (!causaMorte) {
        alert('A causa da morte é obrigatória para registrar um óbito.');
        return;
      }

      if (!fotoInput?.files?.length) {
        alert('É obrigatório anexar uma foto para registrar um óbito.');
        return;
      }

      const fotoFile = fotoInput.files[0];

      if (!fotoFile.type.startsWith('image/')) {
        alert('O arquivo selecionado deve ser uma imagem.');
        return;
      }

      if (fotoFile.size > MAX_IMAGE_BYTES) {
        alert('A imagem é muito grande. Use um arquivo menor que 6 MB.');
        return;
      }

      let fotoBase64;
      try {
        fotoBase64 = await readFileAsDataUrl(fotoFile);
      } catch (err) {
        console.error('[Boletas] Erro ao converter imagem:', err);
        alert('Não foi possível converter a imagem. Tente novamente.');
        return;
      }

      const payload = {
        capataz_id: ids.capataz_id,
        retiro_id: ids.retiro_id,
        data,
        categoria,
        quantidade: 1,
        identificacao_animal: chipId,
        causa_morte: causaMorte,
        foto_base64: fotoBase64,
      };

      setSubmitLoading(submitBtn, true);

      let resultado;
      try {
        resultado = await enviarParaApi(OBITO_API_PATH, payload);
      } catch (err) {
        console.error('[Boletas] Falha ao enviar óbito:', err);
        resultado = { sucesso: false, offline: !navigator.onLine, mensagem: err.message };
      }

      setSubmitLoading(submitBtn, false);
      await tratarResultado(resultado, 'obito', payload, form);

    } else if (tipo === 'nascimento') {
      const quantidadeVal = document.getElementById('quantidade-boleta')?.value || '1';
      const quantidade = parseInt(quantidadeVal, 10);

      if (!quantidade || quantidade < 1) {
        alert('Informe uma quantidade válida de nascimentos (mínimo 1).');
        return;
      }

      const payload = {
        capataz_id: ids.capataz_id,
        retiro_id: ids.retiro_id,
        data,
        categoria,
        quantidade,
      };

      setSubmitLoading(submitBtn, true);

      let resultado;
      try {
        resultado = await enviarParaApi(NASCIMENTO_API_PATH, payload);
      } catch (err) {
        console.error('[Boletas] Falha ao enviar nascimento:', err);
        resultado = { sucesso: false, offline: !navigator.onLine, mensagem: err.message };
      }

      setSubmitLoading(submitBtn, false);
      await tratarResultado(resultado, 'nascimento', payload, form);
    }
  });
});

async function tratarResultado(resultado, tipo, payload, form) {
  if (resultado.sucesso) {
    alert('Boleta registrada com sucesso!');
    form.reset();
    // Disparar evento para que outros scripts possam reagir
    document.dispatchEvent(new CustomEvent('boletaRegistrada', { detail: { tipo, payload } }));
    return;
  }

  if (resultado.offline) {
    try {
      await salvarOffline(tipo, payload);
      alert('Sem conexão. Boleta salva localmente e será sincronizada quando a conexão retornar.');
      form.reset();
    } catch (err) {
      console.error('[Boletas] Erro ao salvar offline:', err);
      alert('Não foi possível salvar a boleta localmente. Tente novamente.');
    }
    return;
  }

  // Online mas houve erro na API
  const mensagem = resultado.mensagem || 'Erro desconhecido.';
  console.error('[Boletas] Erro na API:', mensagem);
  alert(`Não foi possível registrar a boleta: ${mensagem}`);
}
