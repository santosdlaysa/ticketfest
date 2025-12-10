import { PrismaClient } from '@prisma/client';
import { env, dbConfig } from './env';

// Singleton pattern for Prisma Client
class DatabaseService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      // Verifica se a DATABASE_URL está configurada
      if (!dbConfig.url) {
        console.error('❌ Database configuration error:');
        console.error('   DATABASE_URL não está definida.');
        console.error('   Configure as variáveis DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME');
        console.error('   ou defina DATABASE_URL diretamente no arquivo .env');
        process.exit(1);
      }

      DatabaseService.instance = new PrismaClient({
        log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: dbConfig.url,
          },
        },
      });

      // Log de conexão em desenvolvimento
      if (env.NODE_ENV === 'development') {
        console.log(`📦 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
      }
    }
    return DatabaseService.instance;
  }

  public static async connect(): Promise<void> {
    try {
      await DatabaseService.getInstance().$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
      console.log('📦 Database disconnected');
    }
  }

  // Método para verificar a conexão
  public static async healthCheck(): Promise<boolean> {
    try {
      await DatabaseService.getInstance().$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

export const prisma = DatabaseService.getInstance();
export { dbConfig };
export default DatabaseService;
