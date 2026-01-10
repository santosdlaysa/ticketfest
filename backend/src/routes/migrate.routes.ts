import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All migration routes require ADMIN authentication
router.use(authenticate);
router.use(authorize('ADMIN'));

// Migration endpoint - protected by JWT + ADMIN role + secret key
router.post('/run', async (req: Request, res: Response) => {
  // Additional protection - require a secret key
  const { secret } = req.body;
  const expectedSecret = process.env.MIGRATION_SECRET;

  // In production, secret is REQUIRED
  if (process.env.NODE_ENV === 'production' && !expectedSecret) {
    return res.status(500).json({ error: 'MIGRATION_SECRET not configured' });
  }

  if (expectedSecret && secret !== expectedSecret) {
    return res.status(401).json({ error: 'Invalid migration secret' });
  }

  const migrations = [
    '000_initial_schema.sql',
    '001_create_permissions.sql',
    '002_create_event_reminders.sql',
    '003_add_missing_tables.sql',
    '004_fix_encrypted_fields.sql'
  ];

  const results: { migration: string; status: string; error?: string }[] = [];

  try {
    for (const migration of migrations) {
      const filePath = path.join(__dirname, '..', 'database', 'migrations', migration);

      if (!fs.existsSync(filePath)) {
        results.push({ migration, status: 'skipped', error: 'File not found' });
        continue;
      }

      try {
        const sql = fs.readFileSync(filePath, 'utf8');
        await query(sql);
        results.push({ migration, status: 'success' });
        console.log(`✅ Migration ${migration} completed`);
      } catch (err: any) {
        results.push({ migration, status: 'error', error: err.message });
        console.error(`❌ Migration ${migration} failed:`, err.message);
      }
    }

    return res.json({
      message: 'Migrations completed',
      results
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Migration failed',
      message: error.message
    });
  }
});

// Check migration status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    // Check if key tables exist
    const tables = ['users', 'events', 'tickets', 'orders', 'email_queue', 'permissions'];
    const status: { table: string; exists: boolean }[] = [];

    for (const table of tables) {
      try {
        await query(`SELECT 1 FROM ${table} LIMIT 1`);
        status.push({ table, exists: true });
      } catch {
        status.push({ table, exists: false });
      }
    }

    return res.json({ tables: status });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
