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

export default supabasePool;