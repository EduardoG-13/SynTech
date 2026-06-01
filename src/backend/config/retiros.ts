/**
 * config/retiros.ts
 * Lista dos 15 retiros da BrPec e seus capatazes responsáveis.
 * Fonte: planilha Plan_Inteli_ProjetoBRPEC (aba RETIROS).
 * Reutilize esta lista em qualquer view/rota que precise listar retiros.
 */

export interface Retiro {
  nome: string;
  capataz: string;
}

export const RETIROS: Retiro[] = [
  { nome: 'Acurizal',     capataz: 'Rogério'    },
  { nome: 'Aroeira',      capataz: 'Lucas'      },
  { nome: 'Baia Bonita',  capataz: 'Marcelo'    },
  { nome: 'Bodoquena 1',  capataz: 'Fabiano'    },
  { nome: 'Bodoquena 2',  capataz: 'Valdineis'  },
  { nome: 'Boqueirão',    capataz: 'Daniel'     },
  { nome: 'Caieira',      capataz: 'João Paulo' },
  { nome: 'CMB',          capataz: 'Alberto'    },
  { nome: 'Confinamento', capataz: 'Valdineis'  },
  { nome: 'Cristo',       capataz: 'José Carlos'},
  { nome: 'Morada Nova',  capataz: 'Valdeci'    },
  { nome: 'Morro Azul',   capataz: 'Daniel'     },
  { nome: 'Puga',         capataz: 'Manoel'     },
  { nome: 'São Miguel',   capataz: 'Wilson'     },
  { nome: 'Vista Alegre', capataz: 'Ariovaldo'  },
];

export default RETIROS;
