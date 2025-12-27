import pg from 'pg';
import { dbConfig } from '../config/env.js';

const { Pool } = pg;

type ConnectionName = 'primary' | 'secondary';

interface PoolConfig {
  host?: string;
  port: number;
  user?: string;
  password?: string;
  database: string;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number;
}

// Pool configurations
const primaryConfig: PoolConfig = {
  host: dbConfig.primary.host,
  port: dbConfig.primary.port,
  user: dbConfig.primary.user,
  password: dbConfig.primary.password,
  database: dbConfig.primary.database,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
};

const secondaryConfig: PoolConfig = {
  host: dbConfig.secondary.host,
  port: dbConfig.secondary.port,
  user: dbConfig.secondary.user,
  password: dbConfig.secondary.password,
  database: dbConfig.secondary.database,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
};

// Check if secondary is configured
const hasSecondary = Boolean(
  dbConfig.secondary.host && dbConfig.secondary.user && dbConfig.secondary.password
);

// Create pools
let primaryPool: pg.Pool | null = null;
let secondaryPool: pg.Pool | null = null;

// Current active connection
let activeConnection: ConnectionName = 'primary';
let primaryHealthy = true;
let secondaryHealthy = false;
let healthCheckInterval: NodeJS.Timeout | null = null;

// Initialize pools
const initializePools = () => {
  // Primary pool
  if (dbConfig.primary.host && dbConfig.primary.user) {
    primaryPool = new Pool(primaryConfig);

    primaryPool.on('error', (err) => {
      console.error('[DB Primary] Pool error:', err.message);
      primaryHealthy = false;
      if (hasSecondary && dbConfig.failover.enabled) {
        switchToSecondary();
      }
    });
  }

  // Secondary pool (Supabase)
  if (hasSecondary) {
    secondaryPool = new Pool(secondaryConfig);

    secondaryPool.on('error', (err) => {
      console.error('[DB Secondary] Pool error:', err.message);
      secondaryHealthy = false;
    });

    console.log('[DB Failover] Secondary connection (Supabase) configured');
  }
};

// Switch to secondary
const switchToSecondary = () => {
  if (activeConnection === 'secondary') return;
  if (!secondaryPool || !secondaryHealthy) {
    console.error('[DB Failover] Cannot switch to secondary - not available');
    return;
  }

  activeConnection = 'secondary';
  console.warn('[DB Failover] ⚠️ Switched to SECONDARY (Supabase) connection');
};

// Switch to primary
const switchToPrimary = () => {
  if (activeConnection === 'primary') return;
  if (!primaryPool || !primaryHealthy) return;

  activeConnection = 'primary';
  console.log('[DB Failover] ✅ Switched back to PRIMARY connection');
};

// Get current active pool
const getActivePool = (): pg.Pool => {
  if (activeConnection === 'secondary' && secondaryPool) {
    return secondaryPool;
  }
  if (!primaryPool) {
    throw new Error('No database connection available');
  }
  return primaryPool;
};

// Health check for a specific pool
const checkPoolHealth = async (pool: pg.Pool | null, name: string): Promise<boolean> => {
  if (!pool) return false;

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error(`[DB Health] ${name} connection failed:`, (error as Error).message);
    return false;
  }
};

// Periodic health check
const startHealthCheck = () => {
  if (!dbConfig.failover.enabled || !hasSecondary) return;

  const interval = dbConfig.failover.healthCheckInterval || 30000;

  healthCheckInterval = setInterval(async () => {
    // Check primary
    const wasPrimaryHealthy = primaryHealthy;
    primaryHealthy = await checkPoolHealth(primaryPool, 'Primary');

    // Check secondary
    secondaryHealthy = await checkPoolHealth(secondaryPool, 'Secondary');

    // Handle failover logic
    if (!primaryHealthy && secondaryHealthy && activeConnection === 'primary') {
      switchToSecondary();
    } else if (primaryHealthy && !wasPrimaryHealthy && activeConnection === 'secondary') {
      // Primary recovered - switch back
      switchToPrimary();
    }

    // Log status in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB Health] Primary: ${primaryHealthy ? '✅' : '❌'}, Secondary: ${secondaryHealthy ? '✅' : '❌'}, Active: ${activeConnection.toUpperCase()}`);
    }
  }, interval);

  console.log(`[DB Failover] Health check started (interval: ${interval}ms)`);
};

// Stop health check
const stopHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
};

// Initialize on module load
initializePools();

// Export current pool for backward compatibility
export const pool = {
  query: <T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> => {
    return getActivePool().query<T>(text, params);
  },
  connect: () => getActivePool().connect(),
  end: async () => {
    stopHealthCheck();
    if (primaryPool) await primaryPool.end();
    if (secondaryPool) await secondaryPool.end();
  },
};

// Helper para queries simples com retry
export const query = async <T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> => {
  try {
    return await getActivePool().query<T>(text, params);
  } catch (error) {
    // If primary fails, try secondary
    if (activeConnection === 'primary' && hasSecondary && dbConfig.failover.enabled) {
      console.warn('[DB Failover] Primary query failed, trying secondary...');
      primaryHealthy = false;

      if (secondaryPool) {
        try {
          const result = await secondaryPool.query<T>(text, params);
          switchToSecondary();
          return result;
        } catch (secondaryError) {
          secondaryHealthy = false;
          throw secondaryError;
        }
      }
    }
    throw error;
  }
};

// Helper para transações
export const transaction = async <T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
  const client = await getActivePool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Para queries com cliente dedicado (transações manuais)
export const getClient = () => getActivePool().connect();

// Health check
export const healthCheck = async (): Promise<boolean> => {
  const pool = getActivePool();
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

// Fechar pools (para shutdown gracioso)
export const closePool = async () => {
  stopHealthCheck();
  if (primaryPool) await primaryPool.end();
  if (secondaryPool) await secondaryPool.end();
};

// Get connection status
export const getConnectionStatus = () => ({
  active: activeConnection,
  primary: {
    configured: Boolean(primaryPool),
    healthy: primaryHealthy,
  },
  secondary: {
    configured: hasSecondary,
    healthy: secondaryHealthy,
  },
  failoverEnabled: dbConfig.failover.enabled,
});

// Start health check monitoring
export const startMonitoring = () => {
  startHealthCheck();
};

// Export for backward compatibility
export { getActivePool as getCurrentPool };
