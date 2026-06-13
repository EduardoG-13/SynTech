/**
 * Testes unitários para config/database.ts
 * Exercita todos os branches de inicialização usando isolateModules + doMock.
 */

describe('database.ts — branches de inicialização', () => {
  const savedDbPath = process.env.DB_PATH;

  afterEach(() => {
    if (savedDbPath === undefined) {
      delete process.env.DB_PATH;
    } else {
      process.env.DB_PATH = savedDbPath;
    }
  });

  function carregarDatabase(options: { dbPath: string | undefined; dirExists: boolean }) {
    if (options.dbPath === undefined) {
      delete process.env.DB_PATH;
    } else {
      process.env.DB_PATH = options.dbPath;
    }

    const MockDatabaseSync = jest.fn(() => ({ exec: jest.fn() }));
    const mockExistsSync = jest.fn(() => options.dirExists);
    const mockMkdirSync = jest.fn();

    jest.isolateModules(() => {
      jest.doMock('node:sqlite', () => ({ DatabaseSync: MockDatabaseSync }));
      jest.doMock('fs', () => ({
        existsSync: mockExistsSync,
        mkdirSync: mockMkdirSync,
      }));
      require('../../config/database');
    });

    return { MockDatabaseSync, mockExistsSync, mockMkdirSync };
  }

  it('usa o caminho padrão quando DB_PATH não está definido', () => {
    const { MockDatabaseSync } = carregarDatabase({ dbPath: undefined, dirExists: true });

    expect(MockDatabaseSync).toHaveBeenCalledWith(
      expect.stringContaining('brpec.sqlite')
    );
  });

  it('usa DB_PATH customizado e resolve para caminho absoluto', () => {
    const { MockDatabaseSync } = carregarDatabase({
      dbPath: './custom/test.sqlite',
      dirExists: true,
    });

    expect(MockDatabaseSync).toHaveBeenCalledWith(
      expect.stringContaining('test.sqlite')
    );
  });

  it('cria o diretório quando ele não existe (linhas 17-18)', () => {
    const { mockMkdirSync } = carregarDatabase({
      dbPath: './new-dir/db.sqlite',
      dirExists: false,
    });

    expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('usa :memory: diretamente sem resolver caminho no disco', () => {
    const { MockDatabaseSync } = carregarDatabase({ dbPath: ':memory:', dirExists: true });

    expect(MockDatabaseSync).toHaveBeenCalledWith(':memory:');
  });
});
