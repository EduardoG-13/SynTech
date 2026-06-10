/**
 * @jest-environment jsdom
 */

import path from 'path';

describe('capturarCoordenadas', () => {
  const scriptPath = path.resolve(__dirname, '../../public/js/chamados.js');
  let capturarCoordenadas: () => void;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="form-novo-chamado">
        <input id="latitude" name="latitude" type="hidden" required />
        <input id="longitude" name="longitude" type="hidden" required />
        <span id="gps-status"></span>
      </form>
    `;

    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ capturarCoordenadas } = require(scriptPath));
  });

  it('preenche latitude e longitude quando a geolocation retorna coordenadas', () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn((success: (position: any) => void) => {
        success({ coords: { latitude: -23.123456, longitude: -46.123456 } });
      }),
    };

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: mockGeolocation,
    });

    capturarCoordenadas();

    const latitudeInput = document.getElementById('latitude') as HTMLInputElement | null;
    const longitudeInput = document.getElementById('longitude') as HTMLInputElement | null;

    expect(latitudeInput?.value).toBe('-23.123456');
    expect(longitudeInput?.value).toBe('-46.123456');
    expect(document.getElementById('gps-status')?.textContent).toContain('GPS capturado');
  });

  it('mostra mensagem de erro quando geolocation não é suportado', () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    capturarCoordenadas();

    expect(warnSpy).toHaveBeenCalledWith('Geolocation não suportado pelo navegador.');
    expect(document.getElementById('gps-status')?.textContent).toContain('Não foi possível capturar as coordenadas');

    warnSpy.mockRestore();
  });
});
