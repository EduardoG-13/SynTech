(function () {
  const primaryColor = '#286140';
  const warningColor = '#946510';
  const mutedColor = '#5c6b5d';

  const barCtx = document.getElementById('chart-chamados').getContext('2d');
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Chamados',
          data: [],
          backgroundColor: primaryColor,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: '#d7dfd3' },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });

  const donutCtx = document.getElementById('chart-status').getContext('2d');
  new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Aberto', 'Em andamento', 'Resolvido'],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: [primaryColor, warningColor, mutedColor],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, font: { size: 13 } },
        },
      },
    },
  });
})();
