const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

// Configuração do Sentry para Next.js
const sentryWebpackPluginOptions = {
  // Suprime logs durante o build (opcional)
  silent: true,

  // Organização e projeto no Sentry (para upload de source maps)
  // Configure as variáveis de ambiente SENTRY_ORG e SENTRY_PROJECT
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token para upload de source maps
  // Configure a variável SENTRY_AUTH_TOKEN
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Desabilita upload de source maps se não estiver configurado
  // Source maps ajudam a debugar erros em produção mostrando o código original
  dryRun: !process.env.SENTRY_AUTH_TOKEN,

  // Outras opções de configuração do plugin
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

// Exporta a configuração com o Sentry integrado
// Se você não quiser usar o Sentry, basta exportar nextConfig diretamente
module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
