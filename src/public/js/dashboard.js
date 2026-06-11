/* dashboard.js — Carrega dados reais via /api/dashboard/* e popula gráficos Chart.js */

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    carregarResumo();
    carregarListaRetiros();
  });

  function carregarResumo() {
    fetch('/api/dashboard/resumo', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        // Aviso visual quando o escopo é "meus-retiros" (Coordenador)
        if (d.escopo === 'meus-retiros') {
          var header = document.querySelector('.header-bar .sub');
          if (header && (d.totais && d.totais.retiros !== undefined)) {
            header.textContent += ' · ' + d.totais.retiros + ' retiro(s) sob sua responsabilidade';
          }
          if ((d.totais && d.totais.retiros === 0)) {
            var main = document.querySelector('.dashboard-main');
            if (main) {
              main.insertAdjacentHTML('afterbegin',
                '<div class="card" style="padding:1rem; margin-bottom:1rem; background:#FFF4E5; border-color:#A64B00;">' +
                '<strong>⚠️ Você ainda não gerencia nenhum retiro.</strong><br>' +
                '<small>Peça ao Gerente para te atribuir como coordenador de algum retiro nas Configurações.</small>' +
                '</div>');
            }
          }
        }
        // Indicadores de topo
        var alertasEl = document.getElementById('stat-alertas');
        var prioEl    = document.getElementById('stat-prioridades');
        var evoEl     = document.getElementById('stat-evolucao');
        if (alertasEl) alertasEl.textContent = (d.chamados && d.chamados.abertos) || 0;
        if (prioEl)    prioEl.textContent    = (d.boletas && d.boletas.pendentes) || 0;
        if (evoEl) {
          var total = (d.boletas && d.boletas.total) || 0;
          var aprov = (d.boletas && d.boletas.aprovadas) || 0;
          evoEl.textContent = (total ? Math.round((aprov / total) * 100) : 0) + '%';
        }

        renderBarras(d.chamadosPorRetiro || []);
        renderDonut(d.chamados || {});
      })
      .catch(function () {
        console.warn('[dashboard] falha ao carregar /api/dashboard/resumo');
      });
  }

  function renderBarras(rows) {
    var canvas = document.getElementById('chart-chamados');
    if (!canvas || typeof Chart === 'undefined') return;
    var labels = rows.map(function (r) { return r.retiro; });
    var dados  = rows.map(function (r) { return r.total; });
    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: { labels: labels, datasets: [{
        label: 'Chamados abertos',
        data: dados,
        backgroundColor: '#1A4D2E',
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
    if (!canvas || typeof Chart === 'undefined') return;
    new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Aberto', 'Em andamento', 'Resolvido'],
        datasets: [{
          data: [c.abertos || 0, c.andamento || 0, c.resolvidos || 0],
          backgroundColor: ['#1A4D2E', '#A64B00', '#2E7D52'],
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
        // Popula o filtro de retiros (apenas os retiros que o usuário tem acesso)
        var filtroSel = document.getElementById('filter-retiro');
        if (filtroSel) {
          filtroSel.innerHTML = '<option value="">Todos os meus retiros</option>';
          (rows || []).forEach(function (r) {
            filtroSel.insertAdjacentHTML('beforeend', '<option value="' + r.id + '">' + r.nome + '</option>');
          });
        }
        if (!cont) return;
        if (!rows || !rows.length) {
          cont.innerHTML = '<p style="color:#8A8A7C; text-align:center;">Nenhum retiro cadastrado.</p>';
          return;
        }
        cont.innerHTML = rows.map(function (r) {
          return '<div class="retiro-card-dash">' +
            '<div class="retiro-dash-nome">🏠 <strong>' + r.nome + '</strong>' +
              (r.numero ? ' (' + r.numero + ')' : '') + '</div>' +
            '<div class="retiro-dash-info">' +
              '<span>👷 ' + (r.capataz_nome || '—') + '</span>' +
              '<span>📋 ' + (r.coordenador_nome || '—') + '</span>' +
            '</div>' +
            '<div class="retiro-dash-stats">' +
              '<span class="dash-pill">📝 ' + r.total_boletas + ' boletas</span>' +
              '<span class="dash-pill alert">⚠️ ' + r.chamados_abertos + ' chamados</span>' +
            '</div>' +
          '</div>';
        }).join('');
      });
  }
})();
