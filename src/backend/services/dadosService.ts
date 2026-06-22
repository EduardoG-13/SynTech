import db from '../config/database';

export class DadosService {
  public listarRetiros() {
    return db.prepare('SELECT id, nome, localizacao FROM retiros ORDER BY nome').all();
  }

  public listarCapatazes() {
    return db.prepare(
      `SELECT id, nome, retiro_id FROM usuarios WHERE perfil = 'Capataz' ORDER BY nome`
    ).all();
  }

  public dadosFormNovaOs() {
    const retiros = db.prepare('SELECT id, nome FROM retiros ORDER BY nome').all();
    const capatazes = db.prepare(
      `SELECT id, nome, retiro_id FROM usuarios WHERE perfil = 'Capataz' ORDER BY nome`
    ).all();

    const categorias = [
      'Bezerra 0 a 7 meses', 'Bezerro 0 a 7 meses',
      'Novilha 8 a 12 meses', 'Garrote 8 a 12 meses',
      'Novilha 13 a 24 meses', 'Garrote 13 a 24 meses',
      'Novilha 25 a 36 meses', 'Boi 25 a 36 meses', 'Touro 25 a 36 meses',
      'Vaca acima 36 meses', 'Boi acima 36 meses', 'Touro acima 36 meses',
    ];

    const tiposMorte = [
      'Acidente', 'Atolado', 'Cobra', 'Def. nutricional', 'Desconhecida',
      'Desidratação', 'Doenças', 'Fraqueza', 'Hipotermia', 'Intoxicação',
      'Morte Subita', 'Onça', 'Parto', 'Raio',
    ];

    const operacoes = [
      { valor: 'nascimento', label: 'Nascimento' },
      { valor: 'obito', label: 'Óbito / Morte' },
      { valor: 'transferencia', label: 'Transferência entre retiros' },
      { valor: 'compravenda', label: 'Compra / Venda' },
      { valor: 'evolucao', label: 'Evolução de rebanho' },
      { valor: 'manejo', label: 'Manejo geral (vacinação, etc.)' },
    ];

    return { retiros, capatazes, categorias, tiposMorte, operacoes };
  }
}

export default new DadosService();
