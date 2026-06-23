// capturarCoordenadas: leitura da Geolocation API com cache local e checagem prévia
// de permissão. Pede ao usuário apenas se ainda não autorizou; depois disso, captura
// silenciosa em todas as próximas vezes. Última localização válida fica salva no
// dispositivo (localStorage) para uso imediato e fallback offline.

const STORAGE_KEY_AUTORIZADO = 'brpec_gps_autorizado';
const STORAGE_KEY_ULTIMA_POS = 'brpec_gps_ultima_pos';

function setGpsStatus(message) {
  const statusElement = document.getElementById('gps-status');
  if (statusElement) statusElement.textContent = message;
}

function preencherInputs(lat, lon) {
  const latInput = document.getElementById('latitude');
  const lonInput = document.getElementById('longitude');
  if (latInput) latInput.value = lat;
  if (lonInput) lonInput.value = lon;
}

function salvarUltimaPos(lat, lon) {
  try {
    localStorage.setItem(STORAGE_KEY_ULTIMA_POS, JSON.stringify({
      lat: lat,
      lon: lon,
      timestamp: Date.now(),
    }));
    localStorage.setItem(STORAGE_KEY_AUTORIZADO, 'true');
  } catch (e) {
    /* localStorage indisponível (modo anônimo) — ignorar */
  }
}

function lerUltimaPos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ULTIMA_POS);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function jaAutorizado() {
  try {
    return localStorage.getItem(STORAGE_KEY_AUTORIZADO) === 'true';
  } catch (e) {
    return false;
  }
}

function disparaGeolocation() {
  const onSuccess = (pos) => {
    const lat = pos.coords.latitude?.toString() ?? '';
    const lon = pos.coords.longitude?.toString() ?? '';

    preencherInputs(lat, lon);
    salvarUltimaPos(lat, lon);

    const latFmt = parseFloat(lat).toFixed(6);
    const lonFmt = parseFloat(lon).toFixed(6);
    setGpsStatus(` GPS capturado: ${latFmt}, ${lonFmt}`);
  };

  const onError = (err) => {
    console.warn('Erro obtendo posição:', err);
    if (err && err.code === 1) {
      // Permissão negada — limpa flag local pra perguntar de novo na próxima sessão
      try { localStorage.removeItem(STORAGE_KEY_AUTORIZADO); } catch (e) {}
      setGpsStatus(' Permissão de localização negada. Habilite o GPS para abrir o chamado.');
    } else if (err && err.code === 3) {
      setGpsStatus('O GPS demorou para responder. Toque em "Registrar" novamente para tentar de novo.');
    } else {
      setGpsStatus(' Falha ao capturar coordenadas. Verifique se o GPS do dispositivo está ativo.');
    }
  };

  const options = {
    enableHighAccuracy: true,
    timeout: 30000,    // 30s — primeira leitura sem A-GPS (offline) pode demorar
    maximumAge: 0,
  };

  navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
}

function capturarCoordenadas() {
  if (!navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== 'function') {
    console.warn('Geolocation não suportado pelo navegador.');
    setGpsStatus('Não foi possível capturar as coordenadas: recurso indisponível.');
    return;
  }

  // Já capturado antes? Pré-preenche com a última leitura para o usuário não esperar
  const ultima = lerUltimaPos();
  if (ultima && ultima.lat && ultima.lon) {
    preencherInputs(ultima.lat, ultima.lon);
    const latFmt = parseFloat(ultima.lat).toFixed(6);
    const lonFmt = parseFloat(ultima.lon).toFixed(6);
    setGpsStatus(` Última posição: ${latFmt}, ${lonFmt} (atualizando...)`);
  } else {
    setGpsStatus(' Capturando localização...');
  }

  // Usa Permissions API quando disponível para evitar prompt repetido
  if (navigator.permissions && typeof navigator.permissions.query === 'function') {
    navigator.permissions.query({ name: 'geolocation' })
      .then((res) => {
        if (res.state === 'granted' || res.state === 'prompt' || jaAutorizado()) {
          // granted = autorizado em sessão anterior (sem prompt)
          // prompt  = primeira vez (vai aparecer o prompt do browser)
          // jaAutorizado = guardamos manualmente no localStorage como reforço
          disparaGeolocation();
        } else if (res.state === 'denied') {
          setGpsStatus(' Acesso ao GPS bloqueado nas permissões do navegador. Reative para usar o app.');
        }
      })
      .catch(() => {
        // Browser sem Permissions API → tenta direto
        disparaGeolocation();
      });
  } else {
    disparaGeolocation();
  }
}

function bloquearSubmitSemGps() {
  const form = document.getElementById('form-novo-chamado');
  if (!form) return;
  form.addEventListener('submit', (ev) => {
    const lat = document.getElementById('latitude');
    const lon = document.getElementById('longitude');
    if (!lat?.value || !lon?.value) {
      ev.preventDefault();
      setGpsStatus(' Aguardando GPS. Tentando capturar novamente...');
      capturarCoordenadas();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    capturarCoordenadas();
    bloquearSubmitSemGps();
  } catch (e) {
    console.error('Falha ao inicializar captura de coordenadas', e);
    setGpsStatus('Erro ao inicializar captura de GPS.');
  }
});

if (typeof window !== 'undefined') {
  window.capturarCoordenadas = capturarCoordenadas;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { capturarCoordenadas };
}
