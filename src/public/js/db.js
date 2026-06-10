const DB_NAME = 'brpec_local';
const DB_VERSION = 1;
const SYNC_QUEUE_STORE = 'sync_queue';

let dbPromise;

const indexedDbUnavailableError = () =>
  new Error('IndexedDB nao esta disponivel neste navegador.');

export const abrirDb = () => {
  if (!('indexedDB' in window)) {
    return Promise.reject(indexedDbUnavailableError());
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('A abertura do IndexedDB foi bloqueada por outra aba aberta.');
    };
  });

  return dbPromise;
};

const executarNaFila = async (mode, callback) => {
  const db = await abrirDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_QUEUE_STORE, mode);
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    const request = callback(store);
    let result;

    request.onsuccess = () => {
      result = request.result;
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      resolve(result);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.onabort = () => {
      reject(transaction.error);
    };
  });
};

export async function salvarFila(tipo, dados) {
  const tiposPermitidos = ['tarefa', 'obito', 'nascimento', 'chamado'];

  if (!tiposPermitidos.includes(tipo)) {
    throw new Error('Tipo invalido para salvar na fila offline.');
  }

  const registro = {
    tipo,
    dados,
    status: 'PENDENTE',
    timestamp: new Date().toISOString(),
  };

  return executarNaFila('readwrite', (store) => store.add(registro));
}

export const adicionarFila = (registro) =>
  executarNaFila('readwrite', (store) =>
    store.add({
      ...registro,
      createdAt: registro.createdAt || new Date().toISOString(),
      status: registro.status || 'pending',
    }),
  );

export const listarFila = () => executarNaFila('readonly', (store) => store.getAll());

export const buscarFilaPorId = (id) => executarNaFila('readonly', (store) => store.get(id));

export const atualizarFila = (registro) => {
  if (!registro.id) {
    return Promise.reject(new Error('Informe o id do registro para atualizar a fila.'));
  }

  return executarNaFila('readwrite', (store) => store.put(registro));
};

export const removerFila = (id) => executarNaFila('readwrite', (store) => store.delete(id));

export const limparFila = () => executarNaFila('readwrite', (store) => store.clear());

// Remove vários registros em uma única transação (retorna o resultado de um getAll
// apenas para obter um IDBRequest compatível com a API interna)
export const removerVarios = (ids = []) =>
  executarNaFila('readwrite', (store) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      return store.getAll();
    }

    ids.forEach((id) => store.delete(id));
    return store.getAll();
  });

window.brpecIndexedDb = {
  abrirDb,
  salvarFila,
  adicionarFila,
  listarFila,
  buscarFilaPorId,
  atualizarFila,
  removerFila,
  removerVarios,
  limparFila,
};

abrirDb().catch((error) => {
  console.error('Nao foi possivel inicializar o IndexedDB local.', error);
});
