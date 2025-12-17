import app from './app.js';
import { env, dbConfig } from './config/env.js';
import DatabaseService from './config/database.js';
import { initializeScheduler } from './jobs/scheduler.js';

const PORT = parseInt(env.PORT) || 4000;

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await DatabaseService.connect();

    // Start server - listen on all interfaces (0.0.0.0) to accept connections from mobile devices
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🎉 Lumera API Server Started');
      console.log('================================');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 API URL: ${env.API_URL}`);
      console.log(`📱 Mobile access: http://192.168.100.136:${PORT}/api`);
      console.log(`📦 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
      console.log('');
      console.log('📚 API Endpoints:');
      console.log(`   Health: ${env.API_URL}/api/health`);
      console.log(`   Auth: ${env.API_URL}/api/auth/*`);
      console.log(`   Events: ${env.API_URL}/api/events`);
      console.log(`   Tickets: ${env.API_URL}/api/tickets`);
      console.log(`   Cart: ${env.API_URL}/api/cart`);
      console.log(`   Orders: ${env.API_URL}/api/orders`);
      console.log(`   Check-in: ${env.API_URL}/api/checkin`);
      console.log('');

      // Initialize scheduled jobs
      initializeScheduler();
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Iniciar servidor e configurar handlers
const serverPromise = startServer();

// Variável para armazenar a referência do servidor
let server: ReturnType<typeof app.listen> | null = null;
serverPromise.then((s) => {
  server = s;
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down server...');

  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');

      try {
        await DatabaseService.disconnect();
        console.log('✅ Database connection closed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });
  } else {
    await DatabaseService.disconnect();
    process.exit(0);
  }

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});
