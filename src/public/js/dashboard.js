/* dashboard.js — Carrega dados reais via /api/dashboard/* e popula gráficos Chart.js */

(function () {
  var chartBarras = null;
  var chartDonut  = null;

  document.addEventListener('DOMContentLoaded', function () {
    carregarResumo();
    carregarListaRetiros();

    var filtroRetiro = document.getElementById('filter-retiro');
    var filtroData   = document.getElementById('filter-data');
    if (filtroRetiro) filtroRetiro.addEventListener('change', carregarResumo);
    if (filtroData)   filtroData.addEventListener('change',   carregarResumo);
  });

  function getFiltros() {
    var retiro = document.getElementById('filter-retiro');
    var data   = document.getElementById('filter-data');
    var params = [];
    if (retiro && retiro.value) params.push('retiro_id=' + encodeURIComponent(retiro.value));
    if (data   && data.value)   params.push('data='      + encodeURIComponent(data.value));
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
    el.textContent = '⚠️ Não foi possível carregar os dados do painel. Tente recarregar a página.';
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
                '<strong>⚠️ Você ainda não gerencia nenhum retiro.</strong><br>' +
                '<small>Peça ao Gerente para te atribuir como coordenador de algum retiro nas Configurações.</small>' +
                '</div>');
            }
          }
        }

        var alertasEl = document.getElementById('stat-alertas');
        var prioEl    = document.getElementById('stat-prioridades');
        var evoEl     = document.getElementById('stat-evolucao');
        if (alertasEl) alertasEl.textContent = (d.chamados && d.chamados.abertos)   || 0;
        if (prioEl)    prioEl.textContent    = (d.boletas  && d.boletas.pendentes)  || 0;
        if (evoEl) {
          var total = (d.boletas && d.boletas.total)    || 0;
          var aprov = (d.boletas && d.boletas.aprovadas) || 0;
          evoEl.textContent = (total ? Math.round((aprov / total) * 100) : 0) + '%';
        }

        renderBarras(d.chamadosPorRetiro || []);
        renderDonut(d.chamados || {});
      })
      .catch(function () {
        ocultarLoader('chart-chamados');
        ocultarLoader('chart-status');
        mostrarErroPainel();
      });
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      }
    });
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
            '<div class="retiro-dash-nome">🏠 <strong>' + r.nome + '</strong>' +
              (r.numero ? ' (' + r.numero + ')' : '') + '</div>' +
            '<div class="retiro-dash-info">' +
              '<span>👷 ' + (r.capataz_nome     || '—') + '</span>' +
              '<span>📋 ' + (r.coordenador_nome || '—') + '</span>' +
            '</div>' +
            '<div class="retiro-dash-stats">' +
              '<span class="dash-pill">📝 ' + r.total_boletas    + ' boletas</span>' +
              '<span class="dash-pill alert">⚠️ ' + r.chamados_abertos + ' chamados</span>' +
            '</div>' +
          '</div>';
        }).join('');
      })
      .catch(function () {
        if (cont) cont.innerHTML = '<p style="color:#C0392B;text-align:center;">⚠️ Não foi possível carregar os retiros.</p>';
      });
  }
})();
