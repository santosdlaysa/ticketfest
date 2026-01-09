import { pool, query, transaction, healthCheck, closePool, getClient, getConnectionStatus, startMonitoring } from '../lib/db.js';
import { env, dbConfig } from './env.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseService {
  private static async initializeSchema(): Promise<void> {
    if (env.AUTO_MIGRATE !== 'true') {
      return;
    }

    console.log('🔄 AUTO_MIGRATE enabled - initializing database schema...');

    try {
      // Caminho para o schema.sql (na raiz do projeto)
      // Em produção: dist/config -> dist -> raiz
      // Em desenvolvimento: src/config -> src -> raiz
      const schemaPath = join(__dirname, '..', '..', 'schema.sql');
      console.log(`   Schema path: ${schemaPath}`);

      const schema = readFileSync(schemaPath, 'utf-8');

      // Executa o schema completo
      await query(schema);

      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
      // Não lança erro para permitir que o servidor inicie
      // As tabelas podem já existir ou podem ser criadas manualmente
      console.log('⚠️  Server will continue without schema initialization');
    }
  }

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

      // Inicializa o schema se AUTO_MIGRATE estiver habilitado
      await this.initializeSchema();

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

          // Inicializa o schema no banco secundário também
          await this.initializeSchema();

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
