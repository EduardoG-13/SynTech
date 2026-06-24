const form = document.querySelector('#birthForm');
const seedButton = document.querySelector('#seedButton');
const refreshButton = document.querySelector('#refreshButton');
const businessErrorButton = document.querySelector('#businessErrorButton');
const databaseErrorButton = document.querySelector('#databaseErrorButton');
const responseOutput = document.querySelector('#responseOutput');
const statusMessage = document.querySelector('#statusMessage');
const recordsBody = document.querySelector('#recordsBody');
const apiBaseUrl = window.location.port === '3000' ? '' : 'http://localhost:3000';

// Este app.js é da tela de demonstração antiga. Em todas as outras páginas
// (tarefas, dashboard, etc.) esses elementos não existem — então sai cedo
// pra não quebrar a página inteira com "Cannot read properties of null".
if (!seedButton || !form || !recordsBody) {
  // não é a página de demo; nada a fazer aqui
} else {

const setStatus = (message, variant = 'neutral') => {
  statusMessage.textContent = message;
  statusMessage.className = `status ${variant}`;
};

const showResponse = (data) => {
  responseOutput.textContent = JSON.stringify(data, null, 2);
};

const formPayload = () => {
  const data = new FormData(form);

  return {
    retiroId: String(data.get('retiroId') || ''),
    responsavelId: String(data.get('responsavelId') || ''),
    categoria: String(data.get('categoria') || ''),
    dataMovimentacao: String(data.get('dataMovimentacao') || ''),
    quantidade: Number(data.get('quantidade')),
    raca: String(data.get('raca') || ''),
    observacoes: String(data.get('observacoes') || ''),
  };
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
};

const submitNascimento = async (payload) => {
  try {
    const data = await requestJson('/movimentacoes/nascimentos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setStatus('Nascimento registrado com sucesso e enviado para a fila de sincronizacao.', 'success');
    showResponse(data);
    await loadRecords();
  } catch (error) {
    setStatus(error.error || 'Erro ao registrar nascimento.', 'error');
    showResponse(error);
  }
};

const loadRecords = async () => {
  const records = await requestJson('/movimentacoes/nascimentos');

  if (!records.length) {
    recordsBody.innerHTML = '<tr><td colspan="6">Nenhum nascimento registrado.</td></tr>';
    return;
  }

  recordsBody.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td>${record.dataMovimentacao}</td>
          <td>${record.retiroId}</td>
          <td>${record.categoria}</td>
          <td>${record.quantidade}</td>
          <td>${record.syncStatus}</td>
          <td>${record.syncQueueTotal}</td>
        </tr>
      `,
    )
    .join('');
};

seedButton.addEventListener('click', async () => {
  try {
    const data = await requestJson('/demo/seed', { method: 'POST' });
    setStatus('Dados de demo preparados. O formulario ja pode ser enviado.', 'success');
    showResponse(data);
    await loadRecords();
  } catch (error) {
    setStatus(error.error || 'Erro ao preparar demo.', 'error');
    showResponse(error);
  }
});

refreshButton.addEventListener('click', async () => {
  await loadRecords();
});

businessErrorButton.addEventListener('click', async () => {
  await submitNascimento({ ...formPayload(), quantidade: 0 });
});

databaseErrorButton.addEventListener('click', async () => {
  await submitNascimento({
    ...formPayload(),
    retiroId: 'retiro-inexistente',
    responsavelId: 'usuario-inexistente',
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await submitNascimento(formPayload());
});

loadRecords().catch((error) => {
  setStatus(error.error || 'Nao foi possivel carregar registros.', 'error');
  showResponse(error);
});
} // fim do guard da tela de demo
