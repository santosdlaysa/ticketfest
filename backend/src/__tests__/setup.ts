import { beforeAll, afterAll } from '@jest/globals';
import DatabaseService from '../config/database.js';

// Configuração global para todos os testes
beforeAll(async () => {
  // Conectar ao banco de dados antes dos testes
  try {
    await DatabaseService.connect();
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

afterAll(async () => {
  // Desconectar após todos os testes
  await DatabaseService.disconnect();
  console.log('✅ Test database disconnected');
});
