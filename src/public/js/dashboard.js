(function () {
  const primaryColor = '#286140';
  const warningColor = '#946510';
  const mutedColor = '#5c6b5d';

  let chartChamados;
  let chartStatus;

  function criarLoader(canvas) {
    const wrap = canvas.parentElement;
    const loader = document.createElement('div');
    loader.className = 'db-loader';
    loader.textContent = 'Carregando…';
    wrap.appendChild(loader);
    return loader;
  }

  function criarGraficos() {
    const barCtx = document.getElementById('chart-chamados').getContext('2d');
    chartChamados = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Chamados abertos',
            data: [],
            backgroundColor: '#1f5c3a',
            hoverBackgroundColor: '#163f28',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: '#d7dfd3' },
          },
          x: { grid: { display: false } },
        },
      },
    });

    const donutCtx = document.getElementById('chart-status').getContext('2d');
    chartStatus = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Pendente', 'Em andamento', 'Concluída'],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: ['#2d7a56', '#c4831e', '#0f3320'],
            borderWidth: 0,
            hoverOffset: 8,
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              font: { size: 13 },
              usePointStyle: true,
              pointStyleWidth: 10,
            },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                const valor = ctx.raw;
                const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
                return ' ' + ctx.label + ': ' + valor + ' (' + pct + '%)';
              },
            },
          },
        },
      },
    });
  }

  async function renderizarGraficos() {
    const gerenteId = window.DASHBOARD_USUARIO_ID;
    if (!gerenteId) {
      console.warn('[Dashboard] gerente_id não disponível — gráficos em modo vazio.');
      return;
    }

    const loaderChamados = criarLoader(document.getElementById('chart-chamados'));
    const loaderStatus = criarLoader(document.getElementById('chart-status'));

    try {
      const resp = await fetch('/api/painel-gerencial?gerente_id=' + encodeURIComponent(gerenteId));
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const dados = await resp.json();

      // Atualizar cards numéricos
      document.getElementById('stat-alertas').textContent =
        dados.total_alertas_abertos ?? '—';
      document.getElementById('stat-prioridades').textContent =
        dados.resumo_tarefas?.pendentes ?? '—';
      const total = dados.resumo_tarefas?.total || 0;
      const concluidas = dados.resumo_tarefas?.concluidas || 0;
      const evolucao = total > 0 ? Math.round((concluidas / total) * 100) : 0;
      document.getElementById('stat-evolucao').textContent = evolucao + '%';

      // Gráfico de barras — alertas abertos agrupados por retiro, ordem decrescente
      const alertas = dados.alertas_abertos || [];
      const contagemPorRetiro = alertas.reduce(function (acc, a) {
        const nome = a.retiro_nome || 'Sem retiro';
        acc[nome] = (acc[nome] || 0) + 1;
        return acc;
      }, {});
      const retirosSorted = Object.entries(contagemPorRetiro)
        .sort(function (a, b) { return b[1] - a[1]; });
      chartChamados.data.labels = retirosSorted.map(function (r) { return r[0]; });
      chartChamados.data.datasets[0].data = retirosSorted.map(function (r) { return r[1]; });
      chartChamados.update();

      // Gráfico de rosca — distribuição por status
      const resumo = dados.resumo_tarefas || {};
      chartStatus.data.datasets[0].data = [
        resumo.pendentes || 0,
        resumo.em_andamento || 0,
        resumo.concluidas || 0,
      ];
      chartStatus.update();
    } catch (err) {
      console.error('[Dashboard] Erro ao carregar painel:', err);
    } finally {
      loaderChamados.remove();
      loaderStatus.remove();
    }
  }

  criarGraficos();
  renderizarGraficos();
})();
