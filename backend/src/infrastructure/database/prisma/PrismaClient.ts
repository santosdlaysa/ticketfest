// Re-exporta do módulo centralizado de configuração do banco
// Isso mantém a compatibilidade com imports existentes
export { prisma, dbConfig, default as DatabaseService } from '../../../config/database';
