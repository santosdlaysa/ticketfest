/**
 * Teste de envio de email via Resend
 *
 * Uso:
 *   npx tsx scripts/test-email.ts destinatario@email.com
 *   npm run test:email -- destinatario@email.com
 *
 * Se nenhum email for passado, usa EMAIL_FROM como destino.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parser simples de .env (sem dependência externa)
function loadEnv(envPath: string) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.resolve(__dirname, '..', '.env'));

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

const to = process.argv[2] || EMAIL_FROM;

async function main() {
  console.log('🔎 Configuração:');
  console.log(`   RESEND_API_KEY: ${RESEND_API_KEY ? RESEND_API_KEY.slice(0, 8) + '...' : '(ausente)'}`);
  console.log(`   EMAIL_FROM:     ${EMAIL_FROM}`);
  console.log(`   Destinatário:   ${to}`);
  console.log('');

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY não está definida no .env');
    process.exit(1);
  }

  console.log('📤 Enviando email de teste...');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject: '✅ Teste de email - Lumera',
      html: `
        <h1>Teste de envio</h1>
        <p>Se você está lendo isto, o Resend está configurado corretamente.</p>
        <p><strong>Enviado em:</strong> ${new Date().toISOString()}</p>
      `,
      text: 'Teste de envio - Resend está funcionando.',
    }),
  });

  const body = await response.json().catch(() => null);

  console.log('');
  console.log(`📬 Status HTTP: ${response.status} ${response.statusText}`);
  console.log('📦 Resposta:', JSON.stringify(body, null, 2));

  if (!response.ok) {
    console.error('');
    console.error('❌ Falha no envio. Verifique:');
    console.error('   - A API key está correta?');
    console.error('   - O domínio de EMAIL_FROM está verificado no Resend?');
    console.error('     (Sem domínio verificado, use from=onboarding@resend.dev e envie só para o email da sua conta Resend)');
    process.exit(1);
  }

  console.log('');
  console.log('✅ Email enviado com sucesso! Verifique a caixa de entrada (e spam).');
}

main().catch((err) => {
  console.error('❌ Erro inesperado:', err);
  process.exit(1);
});
