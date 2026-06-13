import swaggerDocument from '../config/swagger.json';

describe('Swagger OpenAPI', () => {
  test('documenta sincronização em lote e painel gerencial', () => {
    expect(swaggerDocument.paths).toHaveProperty('/api/sincronizacao/lote');
    expect(swaggerDocument.paths['/api/sincronizacao/lote'].post.requestBody.content['application/json'].schema.$ref)
      .toBe('#/components/schemas/SincronizacaoLoteRequest');
    expect(swaggerDocument.paths['/api/sincronizacao/lote'].post.responses['200'].content['application/json'].schema.$ref)
      .toBe('#/components/schemas/SincronizacaoLoteResponse');

    expect(swaggerDocument.paths).toHaveProperty('/api/painel-gerencial');
    expect(swaggerDocument.paths['/api/painel-gerencial'].get.parameters[0]).toMatchObject({
      name: 'gerente_id',
      in: 'query',
      required: true
    });
    expect(swaggerDocument.paths['/api/painel-gerencial'].get.responses['200'].content['application/json'].schema.$ref)
      .toBe('#/components/schemas/PainelGerencialResponse');

    expect(swaggerDocument.components.schemas.PainelGerencialResponse.properties)
      .toHaveProperty('percentual_tarefas_concluidas');
    expect(swaggerDocument.components.schemas.PainelGerencialResponse.properties)
      .toHaveProperty('total_alertas_abertos');
  });
});
