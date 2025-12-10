import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import DatabaseService, { prisma, dbConfig } from '../../config/database.js';

describe('Database Connection E2E Tests', () => {
  describe('Database Configuration', () => {
    it('should have database configuration defined', () => {
      expect(dbConfig).toBeDefined();
      expect(dbConfig.host).toBeDefined();
      expect(dbConfig.port).toBeDefined();
      expect(dbConfig.database).toBeDefined();
    });

    it('should have a valid database URL', () => {
      expect(dbConfig.url).toBeDefined();
      expect(dbConfig.url).toContain('postgresql://');
    });

    it('should have correct database configuration values', () => {
      expect(typeof dbConfig.host).toBe('string');
      expect(typeof dbConfig.port).toBe('number');
      expect(dbConfig.port).toBeGreaterThan(0);
      expect(dbConfig.port).toBeLessThan(65536);
    });
  });

  describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
      const isHealthy = await DatabaseService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should execute a simple query', async () => {
      const result = await prisma.$queryRaw<[{ result: number }]>`SELECT 1 as result`;
      expect(result).toBeDefined();
      expect(result[0].result).toBe(1);
    });

    it('should get current timestamp from database', async () => {
      const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
      expect(result).toBeDefined();
      expect(result[0].now).toBeInstanceOf(Date);
    });

    it('should get database version', async () => {
      const result = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`;
      expect(result).toBeDefined();
      expect(result[0].version).toContain('PostgreSQL');
    });
  });

  describe('Database Tables', () => {
    it('should have users table', async () => {
      const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'users'
      `;
      expect(tables.length).toBe(1);
      expect(tables[0].tablename).toBe('users');
    });

    it('should have events table', async () => {
      const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'events'
      `;
      expect(tables.length).toBe(1);
      expect(tables[0].tablename).toBe('events');
    });

    it('should have tickets table', async () => {
      const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'tickets'
      `;
      expect(tables.length).toBe(1);
      expect(tables[0].tablename).toBe('tickets');
    });

    it('should have orders table', async () => {
      const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'orders'
      `;
      expect(tables.length).toBe(1);
      expect(tables[0].tablename).toBe('orders');
    });

    it('should list all expected tables', async () => {
      const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `;

      const tableNames = tables.map((t) => t.tablename);

      // Tabelas principais esperadas
      const expectedTables = [
        'users',
        'refresh_tokens',
        'events',
        'tickets',
        'orders',
        'order_items',
        'ticket_instances',
        'carts',
        'cart_items',
        'coupons',
        'organizer_accounts',
        'split_rules',
        'split_transactions',
        'payouts',
        'audit_logs',
      ];

      // Verifica se todas as tabelas esperadas existem
      for (const expectedTable of expectedTables) {
        expect(tableNames).toContain(expectedTable);
      }
    });
  });

  describe('Prisma Client Operations', () => {
    it('should count users (even if zero)', async () => {
      const count = await prisma.user.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should count events (even if zero)', async () => {
      const count = await prisma.event.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should count tickets (even if zero)', async () => {
      const count = await prisma.ticket.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should count orders (even if zero)', async () => {
      const count = await prisma.order.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Database Transaction Support', () => {
    it('should support transactions', async () => {
      // Testa se transações funcionam (sem fazer alterações permanentes)
      try {
        await prisma.$transaction(async (tx) => {
          // Executa uma query de leitura dentro da transação
          const count = await tx.user.count();
          expect(typeof count).toBe('number');

          // Não faz commit de nenhuma alteração
        });
        expect(true).toBe(true); // Transação completou com sucesso
      } catch (error) {
        // Se falhar, o teste falha
        throw error;
      }
    });

    it('should rollback transaction on error', async () => {
      const initialCount = await prisma.user.count();

      try {
        await prisma.$transaction(async (tx) => {
          // Tenta criar um usuário
          await tx.user.create({
            data: {
              email: 'test-rollback@test.com',
              passwordHash: 'test',
              name: 'Test Rollback',
            },
          });

          // Força um erro para testar rollback
          throw new Error('Forced rollback');
        });
      } catch (error) {
        // Esperado - a transação deve fazer rollback
      }

      // Verifica se o rollback funcionou
      const finalCount = await prisma.user.count();
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('Connection Pool', () => {
    it('should handle multiple concurrent queries', async () => {
      // Executa múltiplas queries em paralelo para testar o pool de conexões
      const queries = Array(10)
        .fill(null)
        .map(() => prisma.$queryRaw`SELECT 1 as result`);

      const results = await Promise.all(queries);

      expect(results.length).toBe(10);
      results.forEach((result: any) => {
        expect(result[0].result).toBe(1);
      });
    });

    it('should handle sequential queries efficiently', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 5; i++) {
        await prisma.$queryRaw`SELECT pg_sleep(0.01)`; // 10ms cada
      }

      const duration = Date.now() - startTime;

      // Deve completar em menos de 1 segundo (5 * 10ms + overhead)
      expect(duration).toBeLessThan(1000);
    });
  });
});
