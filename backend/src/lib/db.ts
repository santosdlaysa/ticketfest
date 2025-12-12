import pg from 'pg';
import { dbConfig } from '../config/env.js';

const { Pool } = pg;

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
});

// Log de conexões em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  pool.on('connect', () => {
    console.log('Database connected');
  });
  pool.on('error', (err) => {
    console.error('Database error:', err);
  });
}

// Helper para queries simples
export const query = <T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> => {
  return pool.query(text, params);
};

// Helper para transações
export const transaction = async <T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Para queries com cliente dedicado (transações manuais)
export const getClient = () => pool.connect();

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

// Fechar pool (para shutdown gracioso)
export const closePool = () => pool.end();

export { pool };
