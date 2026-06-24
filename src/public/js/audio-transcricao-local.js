(function () {
  function escreverStatus(statusEl, texto, tipo) {
    if (!statusEl) return;
    statusEl.textContent = texto;
    statusEl.dataset.tipo = tipo || 'info';
    statusEl.style.display = texto ? 'block' : 'none';
  }

  function anexarTexto(textarea, texto) {
    if (!textarea || !texto) return;
    var atual = (textarea.value || '').trim();
    var limpo = String(texto).trim();
    if (!limpo) return;

    textarea.value = atual ? (atual + ' ' + limpo) : limpo;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function criarTranscritorLocal(opcoes) {
    var textarea = opcoes && opcoes.textarea;
    var statusEl = opcoes && opcoes.status;
    var lang = (opcoes && opcoes.lang) || 'pt-BR';
    var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = null;
    var ativo = false;
    var solicitado = false;
    var modoAtual = 'indisponivel';

    function indisponivel() {
      escreverStatus(
        statusEl,
        'Transcrição indisponível neste navegador ou sem internet. O áudio será salvo normalmente.',
        'aviso',
      );
    }

    function criarBase() {
      var rec = new Recognition();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      return rec;
    }

    function configurarCallbacks(rec) {
      rec.onresult = function (event) {
        var finais = [];
        for (var i = event.resultIndex; i < event.results.length; i += 1) {
          var resultado = event.results[i];
          if (resultado && resultado.isFinal && resultado[0] && resultado[0].transcript) {
            finais.push(resultado[0].transcript);
          }
        }
        if (finais.length) {
          anexarTexto(textarea, finais.join(' '));
          escreverStatus(statusEl, 'Transcrição adicionada ao texto. Revise antes de salvar.', 'ok');
        }
      };

      rec.onerror = function () {
        var complemento = modoAtual === 'local' ? 'localmente' : 'pelo navegador';
        escreverStatus(statusEl, 'Não foi possível transcrever ' + complemento + '. O áudio será salvo normalmente.', 'aviso');
      };

      rec.onend = function () {
        ativo = false;
      };

      return rec;
    }

    function prepararOnline() {
      if (!navigator.onLine) {
        indisponivel();
        return null;
      }

      modoAtual = 'online';
      return configurarCallbacks(criarBase());
    }

    async function preparar() {
      if (!Recognition) {
        indisponivel();
        return null;
      }

      var rec = criarBase();

      if (!('processLocally' in rec)) {
        return prepararOnline();
      }

      rec.processLocally = true;
      modoAtual = 'local';

      if (typeof Recognition.available === 'function') {
        try {
          var disponibilidade = await Recognition.available({
            langs: [lang],
            processLocally: true,
            quality: 'dictation',
          });

          if (disponibilidade === 'unavailable') {
            return prepararOnline();
          }

          if (disponibilidade !== 'available') {
            return prepararOnline();
          }
        } catch (erro) {
          // Alguns navegadores expõem processLocally, mas ainda não implementam
          // a checagem de disponibilidade. Nesse caso tentamos iniciar e tratamos o erro abaixo.
        }
      }

      return configurarCallbacks(rec);
    }

    return {
      async iniciar() {
        if (ativo) return;
        solicitado = true;
        recognition = await preparar();
        if (!solicitado) return;
        if (!recognition) return;
        try {
          recognition.start();
          ativo = true;
          if (modoAtual === 'local') {
            escreverStatus(statusEl, 'Transcrição local experimental ativa. Fale com calma e revise o texto.', 'info');
          } else {
            escreverStatus(statusEl, 'Transcrição online experimental ativa. Sem internet, o áudio continua salvo.', 'info');
          }
        } catch (erro) {
          escreverStatus(statusEl, 'Não foi possível iniciar a transcrição. O áudio será salvo normalmente.', 'aviso');
        }
      },

      parar() {
        solicitado = false;
        if (!recognition || !ativo) return;
        try {
          recognition.stop();
        } catch (erro) {
          // Evita quebrar o fluxo de gravação se o navegador já tiver parado.
        }
        ativo = false;
      },

      limparStatus() {
        escreverStatus(statusEl, '', 'info');
      },
    };
  }

  window.brpecTranscricaoLocal = {
    criar: criarTranscritorLocal,
  };
})();
