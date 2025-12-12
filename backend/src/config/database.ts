import { pool, query, transaction, healthCheck, closePool, getClient, getConnectionStatus, startMonitoring } from '../lib/db.js';
import { env, dbConfig } from './env.js';

class DatabaseService {
  public static async connect(): Promise<void> {
    try {
      // Testa a conexão primária
      await query('SELECT 1');
      console.log('✅ Database connected successfully');

      if (env.NODE_ENV === 'development') {
        console.log(`   Primary: ${dbConfig.primary.database}@${dbConfig.primary.host}:${dbConfig.primary.port}`);
        if (dbConfig.secondary.host) {
          console.log(`   Secondary (Supabase): ${dbConfig.secondary.database}@${dbConfig.secondary.host}:${dbConfig.secondary.port}`);
        }
      }

      // Inicia o monitoramento de saúde das conexões
      if (dbConfig.failover.enabled && dbConfig.secondary.host) {
        startMonitoring();
        console.log('✅ Database failover monitoring started');
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);

      // Se failover está habilitado e tem conexão secundária, tenta usar
      if (dbConfig.failover.enabled && dbConfig.secondary.host) {
        console.log('⚠️ Trying secondary connection (Supabase)...');
        try {
          await query('SELECT 1');
          console.log('✅ Connected to secondary database (Supabase)');
          startMonitoring();
        } catch (secondaryError) {
          console.error('❌ Secondary database also failed:', secondaryError);
          process.exit(1);
        }
      } else {
        process.exit(1);
      }
    }
  }

  public static async disconnect(): Promise<void> {
    await closePool();
    console.log('Database disconnected');
  }

  public static async healthCheck(): Promise<boolean> {
    return healthCheck();
  }

  public static getStatus() {
    return getConnectionStatus();
  }
}

// Re-export database utilities
export { pool, query, transaction, getClient, dbConfig, getConnectionStatus };
export default DatabaseService;
