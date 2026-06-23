/* dashboard.js — Carrega dados reais via /api/dashboard/* e popula gráficos Chart.js */

(function () {
  var chartBarras = null;
  var chartDonut  = null;
  var chartTipo   = null;
  var chartMes    = null;
  var ultimoResumo = null;   // guarda os últimos dados pra re-renderizar no resize
  var resizeTimer  = null;

  // No celular, gráficos de barra ficam HORIZONTAIS (rótulos legíveis sem cortar/girar)
  function ehMobile() {
    return window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
  }

  document.addEventListener('DOMContentLoaded', function () {
    carregarResumo();
    carregarListaRetiros();

    // Re-renderiza ao girar/redimensionar (alterna barras horizontais x verticais)
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (ultimoResumo) renderGraficos(ultimoResumo);
      }, 250);
    });

    var filtroRetiro = document.getElementById('filter-retiro');
    var filtroDe     = document.getElementById('filter-data-inicio');
    var filtroAte    = document.getElementById('filter-data-fim');
    if (filtroRetiro) filtroRetiro.addEventListener('change', carregarResumo);
    if (filtroDe)     filtroDe.addEventListener('change',     carregarResumo);
    if (filtroAte)    filtroAte.addEventListener('change',    carregarResumo);

    var btnLimpar = document.getElementById('btn-limpar-filtro');
    if (btnLimpar) btnLimpar.addEventListener('click', function () {
      if (filtroRetiro) filtroRetiro.value = '';
      if (filtroDe)     filtroDe.value = '';
      if (filtroAte)    filtroAte.value = '';
      carregarResumo();
    });

    var btnExp = document.getElementById('btn-exportar-dashboard');
    if (btnExp) btnExp.addEventListener('click', exportarPlanilha);

    // Fechamento de período (só Gerente — elementos só existem pra ele)
    var btnFechar = document.getElementById('btn-fechar-mes');
    if (btnFechar) {
      btnFechar.addEventListener('click', fecharPeriodo);
      carregarFechamentos();
    }
    var btnOficial = document.getElementById('btn-planilha-oficial');
    if (btnOficial) btnOficial.addEventListener('click', gerarPlanilhaOficial);
  });

  function gerarPlanilhaOficial() {
    var de  = (document.getElementById('fechar-de')  || {}).value || '';
    var ate = (document.getElementById('fechar-ate') || {}).value || '';
    var params = new URLSearchParams();
    if (de)  params.set('data_inicio', de);
    if (ate) params.set('data_fim', ate);
    window.location.href = '/api/gerente/planilha-oficial' + (params.toString() ? '?' + params.toString() : '');
  }

  function fecharMsg(texto, cor) {
    var el = document.getElementById('fechar-msg');
    if (!el) return;
    el.textContent = texto; el.style.color = cor; el.style.display = 'block';
  }

  function fecharPeriodo() {
    var de  = (document.getElementById('fechar-de')  || {}).value;
    var ate = (document.getElementById('fechar-ate') || {}).value;
    if (!de || !ate) { fecharMsg(' Escolha o período (de e até).', '#D32F2F'); return; }
    if (de > ate)   { fecharMsg(' A data inicial não pode ser maior que a final.', '#D32F2F'); return; }
    if (!confirm('Fechar o período de ' + de + ' a ' + ate + '? As boletas ficarão travadas.')) return;
    fetch('/api/gerente/fechamento', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({ data_inicio: de, data_fim: ate })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { fecharMsg(' ' + (res.d.erro || 'Erro.'), '#D32F2F'); return; }
        fecharMsg(' ' + res.d.mensagem, '#2E7D52');
        carregarFechamentos();
      })
      .catch(function () { fecharMsg(' Erro de conexão.', '#D32F2F'); });
  }

  function carregarFechamentos() {
    var cont = document.getElementById('lista-fechamentos');
    if (!cont) return;
    fetch('/api/gerente/fechamentos', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!rows || !rows.length) {
          cont.innerHTML = '<p style="color:#8A8A7C; font-size:0.85rem;">Nenhum mês fechado ainda.</p>';
          return;
        }
        cont.innerHTML = '<p style="font-size:0.8rem; color:#5c6b5d; margin-bottom:0.4rem;">Períodos fechados:</p>' +
          rows.map(function (f) {
            var label = (f.data_inicio && f.data_fim) ? (f.data_inicio + ' → ' + f.data_fim) : f.mes;
            return '<div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.4rem 0.6rem; border:1px solid #e5e5e0; border-radius:8px; margin-bottom:0.3rem;">' +
              '<span>' + BRPIcons.html('bloqueado', 'ico-sm') + ' <strong>' + label + '</strong> <small style="color:#8A8A7C;">por ' + (f.fechado_por_nome || '—') + '</small></span>' +
              '<button class="btn-reabrir" data-id="' + f.id + '" style="background:none; border:1px solid #A64B00; color:#A64B00; border-radius:6px; padding:0.2rem 0.6rem; cursor:pointer; font-size:0.8rem;">Reabrir</button>' +
            '</div>';
          }).join('');
        cont.querySelectorAll('.btn-reabrir').forEach(function (b) {
          b.addEventListener('click', function () { reabrirMes(b.dataset.id); });
        });
      })
      .catch(function () { cont.innerHTML = ''; });
  }

  function reabrirMes(id) {
    if (!confirm('Reabrir este período? As boletas voltam a poder ser editadas.')) return;
    fetch('/api/gerente/fechamento/' + encodeURIComponent(id), {
      method: 'DELETE', credentials: 'same-origin'
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        fecharMsg(res.ok ? (' ' + res.d.mensagem) : (' ' + (res.d.erro || 'Erro.')), res.ok ? '#2E7D52' : '#D32F2F');
        carregarFechamentos();
      })
      .catch(function () { fecharMsg(' Erro de conexão.', '#D32F2F'); });
  }

  // Exporta planilha XLSX respeitando os filtros atuais (retiro + data)
  function exportarPlanilha() {
    var params = new URLSearchParams();
    params.set('formato', 'xlsx');
    params.set('tipos', ['nascimento','obito','transferencia','compravenda','evolucao','manejo'].join(','));
    var retiro = document.getElementById('filter-retiro');
    var de     = document.getElementById('filter-data-inicio');
    var ate    = document.getElementById('filter-data-fim');
    if (retiro && retiro.value) params.set('retiro_id', retiro.value);
    if (de && de.value)         params.set('data_inicio', de.value);
    if (ate && ate.value)       params.set('data_fim', ate.value);
    window.location.href = '/api/coordenador/exportar?' + params.toString();
  }

  function getFiltros() {
    var retiro = document.getElementById('filter-retiro');
    var de     = document.getElementById('filter-data-inicio');
    var ate    = document.getElementById('filter-data-fim');
    var params = [];
    if (retiro && retiro.value) params.push('retiro_id='   + encodeURIComponent(retiro.value));
    if (de     && de.value)     params.push('data_inicio=' + encodeURIComponent(de.value));
    if (ate    && ate.value)    params.push('data_fim='    + encodeURIComponent(ate.value));
    return params.length ? '?' + params.join('&') : '';
  }

  function mostrarLoader(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var wrap = canvas.parentElement;
    if (!wrap) return;
    var loader = wrap.querySelector('.db-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'db-loader';
      loader.textContent = 'Carregando…';
      wrap.appendChild(loader);
    }
    loader.style.display = 'flex';
  }

  function ocultarLoader(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var wrap = canvas.parentElement;
    if (!wrap) return;
    var loader = wrap.querySelector('.db-loader');
    if (loader) loader.style.display = 'none';
  }

  function mostrarErroPainel() {
    var main = document.querySelector('.dashboard-main');
    if (!main || main.querySelector('.db-error')) return;
    var el = document.createElement('div');
    el.className = 'db-error card';
    el.style.cssText = 'padding:1rem;margin-bottom:1rem;background:#FFF0F0;border-color:#C0392B;color:#C0392B;text-align:center;';
    el.textContent = ' Não foi possível carregar os dados do painel. Tente recarregar a página.';
    main.insertAdjacentElement('afterbegin', el);
  }

  function carregarResumo() {
    mostrarLoader('chart-chamados');
    mostrarLoader('chart-status');

    fetch('/api/dashboard/resumo' + getFiltros(), { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.escopo === 'meus-retiros') {
          var header = document.querySelector('.header-bar .sub');
          if (header && d.totais && d.totais.retiros !== undefined) {
            var base = header.dataset.base || header.textContent;
            header.dataset.base = base;
            header.textContent = base + ' · ' + d.totais.retiros + ' retiro(s) sob sua responsabilidade';
          }
          if (d.totais && d.totais.retiros === 0) {
            var main = document.querySelector('.dashboard-main');
            if (main && !main.querySelector('.db-no-retiros')) {
              main.insertAdjacentHTML('afterbegin',
                '<div class="db-no-retiros card" style="padding:1rem;margin-bottom:1rem;background:#FFF4E5;border-color:#A64B00;">' +
                '<strong> Você ainda não gerencia nenhum retiro.</strong><br>' +
                '<small>Peça ao Gerente para te atribuir como coordenador de algum retiro nas Configurações.</small>' +
                '</div>');
            }
          }
        }

        var b = d.boletas || {};
        setKpi('stat-boletas-total', b.total || 0);
        setKpi('stat-pendentes', b.pendentes || 0);
        setKpi('stat-aprovadas', b.aprovadas || 0);
        setKpi('stat-alertas', (d.chamados && d.chamados.abertos) || 0);

        ultimoResumo = d;
        renderGraficos(d);
      })
      .catch(function () {
        ocultarLoader('chart-chamados');
        ocultarLoader('chart-status');
        mostrarErroPainel();
      });
  }

  function renderGraficos(d) {
    renderBarras(d.chamadosPorRetiro || []);
    renderDonut(d.chamados || {});
    renderBoletasPorTipo(d.boletasPorTipo || []);
    renderBoletasPorMes(d.boletasPorMes || []);
  }

  function renderBarras(rows) {
    var canvas = document.getElementById('chart-chamados');
    ocultarLoader('chart-chamados');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartBarras) { chartBarras.destroy(); chartBarras = null; }

    var wrap     = canvas.parentElement;
    var semDados = wrap && wrap.querySelector('.db-sem-dados');

    if (!rows.length) {
      canvas.style.display = 'none';
      if (!semDados) {
        semDados = document.createElement('p');
        semDados.className = 'db-sem-dados';
        semDados.style.cssText = 'text-align:center;color:#8A8A7C;padding:3rem 0;margin:0;';
        semDados.textContent = 'Nenhum chamado em aberto.';
        if (wrap) wrap.appendChild(semDados);
      }
      semDados.style.display = '';
      return;
    }

    canvas.style.display = '';
    if (semDados) semDados.style.display = 'none';

    var labels = rows.map(function (r) { return r.retiro; });
    var dados  = rows.map(function (r) { return r.total; });
    chartBarras = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: { labels: labels, datasets: [{
        label: 'Chamados abertos',
        data: dados,
        backgroundColor: '#1A4D2E',
        hoverBackgroundColor: '#163f28',
        borderRadius: 6,
      }]},
      options: opcoesBarra(),
    });
  }

  // Opções compartilhadas dos gráficos de barra. No mobile vira horizontal
  // (indexAxis 'y') pra caber os nomes; rótulos nunca somem (autoSkip:false).
  function opcoesBarra() {
    var mobile = ehMobile();
    var eixoValor = { beginAtZero: true, ticks: { precision: 0, font: { size: mobile ? 11 : 12 } } };
    var eixoCategoria = { ticks: { autoSkip: false, font: { size: mobile ? 11 : 12 }, maxRotation: mobile ? 0 : 40 } };
    return {
      indexAxis: mobile ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: mobile
        ? { x: eixoValor, y: eixoCategoria }
        : { y: eixoValor, x: eixoCategoria },
    };
  }

  function renderDonut(c) {
    var canvas = document.getElementById('chart-status');
    ocultarLoader('chart-status');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartDonut) { chartDonut.destroy(); chartDonut = null; }

    var wrap     = canvas.parentElement;
    var semDados = wrap && wrap.querySelector('.db-sem-dados-donut');
    var total = (c.abertos || 0) + (c.andamento || 0) + (c.resolvidos || 0);
    if (!total) {
      canvas.style.display = 'none';
      if (!semDados) {
        semDados = document.createElement('p');
        semDados.className = 'db-sem-dados-donut';
        semDados.style.cssText = 'text-align:center;color:#8A8A7C;padding:3rem 0;margin:0;';
        semDados.textContent = 'Nenhum chamado registrado.';
        if (wrap) wrap.appendChild(semDados);
      }
      semDados.style.display = '';
      return;
    }
    canvas.style.display = '';
    if (semDados) semDados.style.display = 'none';

    chartDonut = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Aberto', 'Em andamento', 'Resolvido'],
        datasets: [{
          data: [c.abertos || 0, c.andamento || 0, c.resolvidos || 0],
          backgroundColor: ['#1A4D2E', '#A64B00', '#607D8B'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 } } },
        },
        cutout: '60%',
      }
    });
  }

  function setKpi(id, valor) {
    var el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  var ROTULO_TIPO = {
    nascimento: 'Nascimento', obito: 'Morte', abate: 'Abate Interno', transferencia: 'Transferência',
    compravenda: 'Compra/Venda', evolucao: 'Evolução', manejo: 'Manejo',
    infra: 'Infra / Manutenção',
  };
  // Paleta pra boletas; Infra/Manutenção sai sempre em vermelho pra destacar "problema".
  var PALETA_TIPO = ['#1A4D2E', '#2E7D52', '#A64B00', '#607D8B', '#8E7CC3', '#D4A017'];

  function renderBoletasPorTipo(rows) {
    var canvas = document.getElementById('chart-tipo');
    if (!canvas || typeof Chart === 'undefined') return;
    if (chartTipo) { chartTipo.destroy(); chartTipo = null; }
    var labels = rows.map(function (r) { return ROTULO_TIPO[r.tipo] || r.tipo || '—'; });
    var dados  = rows.map(function (r) { return r.total; });
    var cores  = rows.map(function (r, i) {
      return r.tipo === 'infra' ? '#D32F2F' : PALETA_TIPO[i % PALETA_TIPO.length];
    });
    if (!rows.length) { canvas.style.display = 'none'; return; }
    canvas.style.display = '';
    chartTipo = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: { labels: labels, datasets: [{
        label: 'Quantidade', data: dados,
        backgroundColor: cores,
        borderRadius: 6,
      }]},
      options: opcoesBarra(),
    });
  }

  function renderBoletasPorMes(rows) {
    var canvas = document.getElementById('chart-mes');
    if (!canvas || typeof Chart === 'undefined') return;
    if (chartMes) { chartMes.destroy(); chartMes = null; }
    if (!rows.length) { canvas.style.display = 'none'; return; }
    canvas.style.display = '';
    var meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    var labels = rows.map(function (r) {
      var p = (r.mes || '').split('-');
      return p.length === 2 ? (meses[parseInt(p[1]) - 1] + '/' + p[0].slice(2)) : r.mes;
    });
    var dados = rows.map(function (r) { return r.total; });
    chartMes = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { labels: labels, datasets: [{
        label: 'Boletas no mês', data: dados,
        borderColor: '#1A4D2E', backgroundColor: 'rgba(46,125,82,0.15)',
        fill: true, tension: 0.3, pointBackgroundColor: '#1A4D2E', pointRadius: 4,
      }]},
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      }
    });
  }

  function carregarListaRetiros() {
    var cont = document.getElementById('lista-retiros-dashboard');
    fetch('/api/dashboard/retiros', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        var filtroSel = document.getElementById('filter-retiro');
        if (filtroSel) {
          filtroSel.innerHTML = '<option value="">Todos os meus retiros</option>';
          (rows || []).forEach(function (r) {
            filtroSel.insertAdjacentHTML('beforeend',
              '<option value="' + r.id + '">' + r.nome + '</option>');
          });
        }
        if (!cont) return;
        if (!rows || !rows.length) {
          cont.innerHTML = '<p style="color:#8A8A7C;text-align:center;">Nenhum retiro cadastrado.</p>';
          return;
        }
        cont.innerHTML = rows.map(function (r) {
          return '<div class="retiro-card-dash">' +
            '<div class="retiro-dash-nome">' + BRPIcons.html('home', 'label-ico') + ' <strong>' + r.nome + '</strong>' +
              (r.numero ? ' (' + r.numero + ')' : '') + '</div>' +
            '<div class="retiro-dash-info">' +
              '<span>' + BRPIcons.html('capataz', 'ico-sm') + ' ' + (r.capataz_nome || '—') + '</span>' +
              '<span>' + BRPIcons.html('coordenador', 'ico-sm') + ' ' + (r.coordenador_nome || '—') + '</span>' +
            '</div>' +
            '<div class="retiro-dash-stats">' +
              '<span class="dash-pill">' + BRPIcons.html('boleta', 'ico-sm') + ' ' + r.total_boletas + ' boletas</span>' +
              '<span class="dash-pill alert">' + BRPIcons.html('alerta', 'ico-sm') + ' ' + r.chamados_abertos + ' chamados</span>' +
            '</div>' +
          '</div>';
        }).join('');
      })
      .catch(function () {
        if (cont) cont.innerHTML = '<p style="color:#C0392B;text-align:center;"> Não foi possível carregar os retiros.</p>';
      });
  }
})();
