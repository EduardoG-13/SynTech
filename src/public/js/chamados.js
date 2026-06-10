// capturarCoordenadas: leitura da Geolocation API com escrita em inputs hidden.
// Sem `required` nos hidden — a validação acontece aqui no submit, com mensagem clara.

function setGpsStatus(message) {
  const statusElement = document.getElementById('gps-status');
  if (statusElement) statusElement.textContent = message;
}

function capturarCoordenadas() {
  if (!navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== 'function') {
    console.warn('Geolocation não suportado pelo navegador.');
    setGpsStatus('Não foi possível capturar as coordenadas: recurso indisponível.');
    return;
  }

  setGpsStatus('🛰️ Capturando localização...');

  const onSuccess = (pos) => {
    const lat = pos.coords.latitude?.toString() ?? '';
    const lon = pos.coords.longitude?.toString() ?? '';

    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');

    if (latInput) latInput.value = lat;
    if (lonInput) lonInput.value = lon;

    // Formata com 6 casas decimais para leitura humana
    const latFmt = parseFloat(lat).toFixed(6);
    const lonFmt = parseFloat(lon).toFixed(6);
    setGpsStatus(`✅ GPS capturado: ${latFmt}, ${lonFmt}`);
  };

  const onError = (err) => {
    console.warn('Erro obtendo posição:', err);
    // Mensagens específicas por código de erro do PositionError
    if (err && err.code === 1) {
      setGpsStatus('🚫 Permissão de localização negada. Habilite o GPS para abrir o chamado.');
    } else if (err && err.code === 3) {
      setGpsStatus('⏱️ GPS demorou para responder. Toque em "Registrar" novamente para tentar de novo.');
    } else {
      setGpsStatus('❌ Falha ao capturar coordenadas. Verifique se o GPS do dispositivo está ativo.');
    }
  };

  const options = {
    enableHighAccuracy: true,
    timeout: 30000,    // 30s — primeira leitura sem A-GPS (offline) pode demorar
    maximumAge: 0,
  };

  navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
}

// Validação no submit: bloqueia envio sem GPS e mostra mensagem visível ao usuário
function bloquearSubmitSemGps() {
  const form = document.getElementById('form-novo-chamado');
  if (!form) return;
  form.addEventListener('submit', (ev) => {
    const lat = document.getElementById('latitude');
    const lon = document.getElementById('longitude');
    if (!lat?.value || !lon?.value) {
      ev.preventDefault();
      setGpsStatus('📍 Aguardando GPS. Tentando capturar novamente...');
      // Tenta capturar de novo automaticamente — útil quando a 1ª leitura ainda não terminou
      capturarCoordenadas();
    }
  });
}

// Executa ao carregar a página
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
