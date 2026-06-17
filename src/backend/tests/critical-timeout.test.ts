import fs from 'fs';
import path from 'path';
import vm from 'vm';

function carregarOfflineInterceptor(fetchMock: jest.Mock) {
  const interceptorPath = path.resolve(__dirname, '../../public/js/offline-interceptor.js');
  const source = fs
    .readFileSync(interceptorPath, 'utf8')
    .replace(
      /import\s+\{\s*processarFilaSincronizacao\s*\}\s+from\s+'\/public\/js\/sync\.js';/,
      'const processarFilaSincronizacao = async () => ({ sucesso: true });'
    )
    .replace(/export\s+/g, '');

  const salvarFila = jest.fn().mockResolvedValue(42);

  const context: any = {
    console: {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    window: {
      CRITICAL_REQUEST_TIMEOUT_MS: 5000,
      CRITICAL_EVIDENCE_REQUEST_TIMEOUT_MS: 10000,
      brpecIndexedDb: { salvarFila },
      addEventListener: jest.fn(),
      offlineInterceptor: {},
    },
    document: {
      getElementById: jest.fn().mockReturnValue(null),
    },
    navigator: {
      onLine: true,
    },
    fetch: fetchMock,
    setTimeout: jest.fn((callback: () => void) => {
      callback();
      return 1;
    }),
    clearTimeout: jest.fn(),
    AbortController,
    CustomEvent: jest.fn(),
    localStorage: {
      setItem: jest.fn(),
    },
    Number,
    Object,
    Error,
    Promise,
  };

  vm.runInNewContext(source, context);

  return {
    api: context.window.offlineInterceptor,
    salvarFila,
  };
}

function carregarAuthClient(fetchMock: jest.Mock) {
  const authPath = path.resolve(__dirname, '../../public/js/auth-client.js');
  const source = fs.readFileSync(authPath, 'utf8');
  const localStorageMock = {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };

  const context: any = {
    window: {
      AUTH_REQUEST_TIMEOUT_MS: 5000,
      fetch: fetchMock,
      location: { href: '' },
    },
    localStorage: localStorageMock,
    Headers,
    Request,
    AbortController,
    setTimeout: jest.fn((callback: () => void) => {
      callback();
      return 1;
    }),
    clearTimeout: jest.fn(),
    Number,
    Object,
    Error,
    Promise,
  };

  vm.runInNewContext(source, context);

  return {
    authClient: context.window.authClient,
    localStorageMock,
  };
}

describe('Timeout em operacoes criticas', () => {
  it('salva operacao mutavel na fila local quando a requisicao expira', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    const fetchMock = jest.fn().mockRejectedValue(abortError);
    const { api, salvarFila } = carregarOfflineInterceptor(fetchMock);

    const resultado = await api.fazerRequisicaoComOffline('/api/chamados', {
      metodo: 'POST',
      tipo: 'chamado',
      dados: { descricao: 'Cerca rompida' },
    });

    expect(resultado).toEqual({
      sucesso: false,
      offline: true,
      mensagem: 'Operação salva localmente. Será sincronizada quando houver conexão.',
      idFila: 42,
    });
    expect(salvarFila).toHaveBeenCalledWith(
      'chamado',
      expect.objectContaining({
        url: '/api/chamados',
        metodo: 'POST',
        dados: { descricao: 'Cerca rompida' },
        erroComunicacao: 'TIMEOUT',
      })
    );
  });

  it('aplica timeout nas chamadas de autenticacao', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    const fetchMock = jest.fn().mockRejectedValue(abortError);
    const { authClient } = carregarAuthClient(fetchMock);

    await expect(authClient.refreshAccessToken()).rejects.toMatchObject({
      name: 'AbortError',
      comunicacao: true,
    });
  });
});
