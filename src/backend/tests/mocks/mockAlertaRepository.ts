import type { Alerta } from '../../models/Alerta';

function alertaFixture(): Alerta {
  return {
    id: 'mock-alerta-id-0001',
    tipo: 'CERCA',
    descricao: 'Cerca danificada no setor B',
    status: 'ABERTO',
    capataz_id: 'mock-capataz-id-0001',
    retiro_id: 'mock-retiro-id-0001',
    latitude: -23.5505,
    longitude: -46.6333,
    criado_em: '2026-06-01T00:00:00.000Z',
    sincronizado: 1,
    foto_id: null,
    tecnico_id: null,
  };
}

class MockAlertaRepository {
  criar = jest.fn((alerta: any): Alerta => ({
    ...alertaFixture(),
    tipo: alerta.tipo,
    descricao: alerta.descricao ?? null,
    capataz_id: alerta.capataz_id,
    retiro_id: alerta.retiro_id,
    latitude: alerta.latitude,
    longitude: alerta.longitude,
  }));

  buscarPorId = jest.fn((id: string): Alerta => ({
    ...alertaFixture(),
    id,
  }));
}

export { MockAlertaRepository, alertaFixture };
export default new MockAlertaRepository();
