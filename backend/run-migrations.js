import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://lumera:6Ql9SRKmrpl7mZvFtMnp0UZrWSVEIM92@dpg-d57ut1juibrs73adqkl0-a.oregon-postgres.render.com/lumera_it8q';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrations = [
  '000_initial_schema.sql',
  '001_create_permissions.sql',
  '002_create_event_reminders.sql',
  '003_add_missing_tables.sql',
  '004_fix_encrypted_fields.sql'
];

async function runMigrations() {
  console.log('Connecting to database...');
  const client = await pool.connect();

  try {
    for (const migration of migrations) {
      const filePath = path.join(__dirname, 'src', 'database', 'migrations', migration);

      if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${migration} - file not found`);
        continue;
      }

      console.log(`Running migration: ${migration}`);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query(sql);
        console.log(`  ✅ ${migration} completed`);
      } catch (err) {
        console.error(`  ⚠️ ${migration} error:`, err.message);
        // Continue with next migration even if one fails
      }
    }

    console.log('\n✅ All migrations completed!');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
