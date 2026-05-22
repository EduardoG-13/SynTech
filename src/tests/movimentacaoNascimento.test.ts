import { getDatabase, resetDatabase } from '../database/connection';
import * as movimentacaoRepository from '../repositories/movimentacaoRepository';
import * as movimentacaoService from '../services/movimentacaoService';
import * as syncNotifier from '../services/syncNotifier';

type PayloadNascimento = {
  retiroId: string;
  responsavelId: string;
  categoria: string;
  dataMovimentacao: string;
  quantidade: number;
  raca?: string;
  observacoes?: string;
};

type RegistroNascimento = {
  id: string;
  retiroId: string;
  responsavelId: string;
  tipo: string;
  categoria: string;
  dataMovimentacao: string;
  quantidade: number;
  raca: string | null;
  syncStatus: string;
};

type DatabaseConnection = {
  prepare: (sql: string) => {
    run: (...params: unknown[]) => unknown;
  };
};

jest.mock('../services/syncNotifier', () => ({
  notifyPendingSync: jest.fn().mockResolvedValue({ queued: true }),
}));

const seedDatabase = (): void => {
  const db = getDatabase() as DatabaseConnection;

  db.prepare(`
    INSERT INTO retiros (id, nome, localizacao)
    VALUES ('retiro-barra-bonita', 'Barra Bonita', 'Pantanal MS')
  `).run();

  db.prepare(`
    INSERT INTO usuarios (id, retiro_id, nome, email, senha_hash, perfil)
    VALUES (
      'usuario-capataz-1',
      'retiro-barra-bonita',
      'Gabriel Galdino',
      'gabriel@example.com',
      'hash-fake',
      'capataz'
    )
  `).run();
};

const payloadValido: PayloadNascimento = {
  retiroId: 'retiro-barra-bonita',
  responsavelId: 'usuario-capataz-1',
  categoria: 'bezerro',
  dataMovimentacao: '2026-05-21',
  quantidade: 3,
  raca: 'nelore',
  observacoes: 'Registro feito no retiro durante a rotina da manha',
};

beforeEach((): void => {
  resetDatabase();
  seedDatabase();
  jest.clearAllMocks();
});

describe('Fluxo de registro de nascimento de bezerro', () => {
  it('registra uma movimentacao de nascimento com sucesso', async () => {
    const registro = (await movimentacaoService.registrarNascimento(
      payloadValido,
    )) as RegistroNascimento;

    expect(registro).toEqual(
      expect.objectContaining({
        retiroId: payloadValido.retiroId,
        responsavelId: payloadValido.responsavelId,
        tipo: 'nascimento',
        categoria: payloadValido.categoria,
        quantidade: payloadValido.quantidade,
        raca: payloadValido.raca,
        syncStatus: 'pendente',
      }),
    );
    expect(syncNotifier.notifyPendingSync).toHaveBeenCalledTimes(1);
  });

  it('bloqueia nascimento com regra de negocio violada', async () => {
    await expect(
      movimentacaoService.registrarNascimento({ ...payloadValido, quantidade: 0 }),
    ).rejects.toMatchObject({
      message: 'A quantidade de nascimentos deve ser maior que zero',
      statusCode: 422,
    });
    expect(syncNotifier.notifyPendingSync).not.toHaveBeenCalled();
  });

  it('rejeita payload invalido sem campo obrigatorio', async () => {
    const { categoria, ...payloadSemCategoria } = payloadValido;

    await expect(
      movimentacaoService.registrarNascimento(payloadSemCategoria as PayloadNascimento),
    ).rejects.toMatchObject({
      message: 'Campo obrigatorio invalido: categoria',
      statusCode: 400,
    });
    expect(syncNotifier.notifyPendingSync).not.toHaveBeenCalled();
  });

  it('persiste a movimentacao, o detalhe de nascimento e a fila de sincronizacao no banco real', async () => {
    const registro = (await movimentacaoService.registrarNascimento(
      payloadValido,
    )) as RegistroNascimento;

    const registroPersistido = movimentacaoRepository.findNascimentoByMovimentacaoId(
      registro.id,
    ) as RegistroNascimento;
    const totalNaFila = movimentacaoRepository.countSyncQueueByRegistroId(registro.id) as number;

    expect(registroPersistido).toEqual(
      expect.objectContaining({
        id: registro.id,
        tipo: 'nascimento',
        quantidade: payloadValido.quantidade,
        syncStatus: 'pendente',
      }),
    );
    expect(totalNaFila).toBe(1);
  });

  it('retorna erro quando a persistencia viola uma chave estrangeira do banco real', async () => {
    await expect(
      movimentacaoService.registrarNascimento({
        ...payloadValido,
        retiroId: 'retiro-inexistente',
        responsavelId: 'usuario-inexistente',
      }),
    ).rejects.toThrow('FOREIGN KEY constraint failed');

    expect(syncNotifier.notifyPendingSync).not.toHaveBeenCalled();
  });
});
