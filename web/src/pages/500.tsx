import React from 'react';
import { Button } from '@/components/common/Button';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Custom500() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>500 - Erro Interno do Servidor | TicketFest</title>
        <meta
          name="description"
          content="Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde."
        />
      </Head>

      <div className="min-h-screen bg-lumera-obsidian flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-lumera-surface rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center">
            {/* Código de erro */}
            <div className="mb-6">
              <h2 className="text-7xl md:text-9xl font-bold text-primary-500 opacity-20">
                500
              </h2>
            </div>

            {/* Ícone de erro */}
            <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 -mt-16">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Título */}
            <h1 className="text-3xl md:text-4xl font-bold text-lumera-luminoso mb-4">
              Erro Interno do Servidor
            </h1>

            {/* Descrição */}
            <p className="text-lg text-lumera-muted mb-4">
              Desculpe, nossos servidores encontraram um problema inesperado.
            </p>
            <p className="text-base text-lumera-muted mb-8">
              Nossa equipe foi notificada automaticamente e já está trabalhando para
              resolver a situação o mais rápido possível.
            </p>

            {/* Sugestões */}
            <div className="bg-blue-500/10 border border-lumera-border rounded-lg p-4 mb-8 text-left">
              <h3 className="font-semibold text-blue-300 mb-2">
                O que você pode fazer:
              </h3>
              <ul className="space-y-2 text-sm text-blue-300">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Aguardar alguns minutos e tentar novamente
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verificar sua conexão com a internet
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Limpar o cache do seu navegador
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Contatar nosso suporte se o problema persistir
                </li>
              </ul>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Tentar novamente
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/')}
                className="w-full sm:w-auto"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Voltar para a página inicial
              </Button>
            </div>

            {/* Informações de suporte */}
            <div className="mt-8 pt-8 border-t border-lumera-border">
              <p className="text-sm text-lumera-muted mb-2">
                Se o problema persistir, entre em contato com nosso suporte:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                <a
                  href="mailto:suporte@ticketfest.com"
                  className="text-primary-400 hover:text-primary-300 font-medium flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  suporte@ticketfest.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
