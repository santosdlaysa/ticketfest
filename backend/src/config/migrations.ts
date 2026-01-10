import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrations = [
  '000_initial_schema.sql',
  '001_create_permissions.sql',
  '002_create_event_reminders.sql',
  '003_add_missing_tables.sql',
  '004_fix_encrypted_fields.sql'
];

export async function runMigrations(): Promise<void> {
  console.log('🔄 Running database migrations...');

  for (const migration of migrations) {
    const filePath = path.join(__dirname, '..', 'database', 'migrations', migration);

    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Migration ${migration} skipped (file not found)`);
      continue;
    }

    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      await query(sql);
      console.log(`✅ Migration ${migration} completed`);
    } catch (err: any) {
      // Ignore "already exists" errors
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`⏭️  Migration ${migration} skipped (already applied)`);
      } else {
        console.error(`❌ Migration ${migration} failed:`, err.message);
      }
    }
  }

  console.log('✅ Migrations completed');
}
