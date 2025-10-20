import app from './app.js';
import { env } from './config/env.js';
import DatabaseService from './config/database.js';

const PORT = parseInt(env.PORT) || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log('');
  console.log('🎉 TicketFest API Server Started');
  console.log('================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 API URL: ${env.API_URL}`);
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
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down server...');

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
