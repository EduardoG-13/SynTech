import fs from 'fs';
import path from 'path';
import vm from 'vm';

function carregarModuloSync() {
  const syncPath = path.resolve(__dirname, '../../public/js/sync.js');
  const source = fs.readFileSync(syncPath, 'utf8').replace(/export\s+/g, '');
  const delays: number[] = [];

  const context: any = {
    console: {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    window: {
      SYNC_REQUEST_TIMEOUT_MS: 5000,
      brpecIndexedDb: {},
      sincronizador: {},
      addEventListener: jest.fn(),
    },
    navigator: {
      onLine: true,
    },
    localStorage: {
      setItem: jest.fn(),
    },
    CustomEvent: jest.fn(),
    AbortController,
    fetch: jest.fn(),
    clearTimeout: jest.fn(),
    setTimeout: jest.fn((callback: () => void, ms: number) => {
      delays.push(ms);
      callback();
      return 1;
    }),
    Math,
    Promise,
    Error,
    Number,
  };

  vm.runInNewContext(
    `${source}\nglobalThis.__syncRetryTest = { executarComRetry, calcularAtrasoRetry };`,
    context
  );

  return {
    api: context.__syncRetryTest,
    delays,
  };
}

describe('Retry de sincronizacao offline-online', () => {
  it('calcula backoff exponencial com jitter controlado', () => {
    const { api } = carregarModuloSync();

    expect(api.calcularAtrasoRetry(1, 0)).toBe(1000);
    expect(api.calcularAtrasoRetry(2, 0)).toBe(2000);
    expect(api.calcularAtrasoRetry(3, 0)).toBe(4000);
    expect(api.calcularAtrasoRetry(2, 250)).toBe(2250);
  });

  it('retenta falha de comunicacao ate sucesso sem intervencao do usuario', async () => {
    const { api, delays } = carregarModuloSync();
    let tentativas = 0;

    const resultado = await api.executarComRetry(async () => {
      tentativas += 1;

      if (tentativas < 3) {
        throw new Error('Falha simulada de comunicacao');
      }

      return { sucesso: true };
    });

    expect(resultado).toEqual({ sucesso: true });
    expect(tentativas).toBe(3);
    expect(delays).toHaveLength(2);
    expect(delays[0]).toBeGreaterThanOrEqual(1000);
    expect(delays[0]).toBeLessThan(1500);
    expect(delays[1]).toBeGreaterThanOrEqual(2000);
    expect(delays[1]).toBeLessThan(2500);
  });

  it('nao retenta erro marcado como nao transitorio', async () => {
    const { api, delays } = carregarModuloSync();
    let tentativas = 0;

    await expect(
      api.executarComRetry(async () => {
        tentativas += 1;
        const erro = new Error('Payload invalido') as Error & { retryable?: boolean };
        erro.retryable = false;
        throw erro;
      })
    ).rejects.toThrow('Payload invalido');

    expect(tentativas).toBe(1);
    expect(delays).toHaveLength(0);
  });
});
