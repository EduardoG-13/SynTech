import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== 'test') {
  throw new Error('DATABASE_URL não definida.');
}

const supabasePool = new Pool(databaseUrl ? {
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
} : {});

supabasePool.on('error', (err: any, client) => {
  if (err.code === 'Z_DATA_ERROR') {
    // Supavisor costuma fechar conexões idle abruptamente, gerando Z_DATA_ERROR no zlib stream.
    // O pool vai descartar esse cliente automaticamente agora que estamos ouvindo o erro.
    console.warn('[supabasePool] Conexão idle com a nuvem caiu (Z_DATA_ERROR). Cliente descartado.');
    return;
  }
  console.error('[supabasePool] Erro inesperado no cliente idle:', err);
});

export default supabasePool;