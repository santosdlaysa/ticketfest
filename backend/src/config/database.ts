import { pool, query, transaction, healthCheck, closePool, getClient } from '../lib/db.js';
import { env, dbConfig } from './env.js';

class DatabaseService {
  public static async connect(): Promise<void> {
    try {
      // Testa a conexão
      await query('SELECT 1');
      console.log('Database connected successfully');
      if (env.NODE_ENV === 'development') {
        console.log(`Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
      }
    } catch (error) {
      console.error('Database connection failed:', error);
      process.exit(1);
    }
  }

  public static async disconnect(): Promise<void> {
    await closePool();
    console.log('Database disconnected');
  }

  public static async healthCheck(): Promise<boolean> {
    return healthCheck();
  }
}

// Re-export database utilities
export { pool, query, transaction, getClient, dbConfig };
export default DatabaseService;
