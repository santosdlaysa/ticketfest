import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Função para construir a DATABASE_URL a partir das variáveis individuais
const buildDatabaseUrl = (): string | undefined => {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  // Se DATABASE_URL já estiver definida, usa ela
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Se todas as variáveis individuais estiverem definidas, constrói a URL
  if (host && port && user && password && database) {
    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  }

  return undefined;
};

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  API_URL: z.string().url().default('http://localhost:3000'),

  // Database - Variáveis individuais
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().default('ticketfest'),

  // Database URL (construída automaticamente ou definida diretamente)
  DATABASE_URL: z.string().optional(),

  // Supabase (opcional - apenas se usar Supabase diretamente)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Stripe (legacy)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Pagar.me
  PAGARME_SECRET_KEY: z.string().optional(),
  PAGARME_PUBLIC_KEY: z.string().optional(),
  PAGARME_WEBHOOK_SECRET: z.string().optional(),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const parseEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);

    // Constrói a DATABASE_URL se não estiver definida
    const databaseUrl = buildDatabaseUrl();

    return {
      ...parsed,
      DATABASE_URL: databaseUrl || parsed.DATABASE_URL,
    };
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
};

export const env = parseEnv();

// Configuração do banco de dados exportada separadamente para fácil acesso
export const dbConfig = {
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT, 10),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  url: env.DATABASE_URL,
};
