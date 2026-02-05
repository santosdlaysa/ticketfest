import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualiza o state para que a próxima renderização mostre a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log do erro para o console
    console.error('ErrorBoundary capturou um erro:', error);
    console.error('Informações do erro:', errorInfo);
    console.error('Stack trace do componente:', errorInfo.componentStack);

    // Atualiza o state com as informações do erro
    this.setState({
      error,
      errorInfo,
    });

    // Envia o erro para o Sentry com contexto adicional
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: 'true',
        errorType: error.name,
      },
      level: 'error',
    });
  }

  handleReload = (): void => {
    // Reseta o state e recarrega a página
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  handleReset = (): void => {
    // Apenas reseta o state sem recarregar a página
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Se um fallback customizado foi fornecido, usa ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de erro padrão
      return (
        <div className="min-h-screen bg-lumera-obsidian flex items-center justify-center px-4">
          <div className="max-w-2xl w-full bg-lumera-surface rounded-2xl shadow-xl p-8 md:p-12 border border-lumera-border">
            <div className="text-center">
              {/* Ícone de erro */}
              <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Título */}
              <h1 className="text-3xl md:text-4xl font-bold text-lumera-luminoso mb-4">
                Ops! Algo deu errado
              </h1>

              {/* Descrição */}
              <p className="text-lg text-lumera-muted mb-8">
                Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada
                e estamos trabalhando para resolver o problema.
              </p>

              {/* Detalhes do erro (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8 text-left">
                  <details className="bg-lumera-surface-alt rounded-lg p-4 border border-lumera-border">
                    <summary className="cursor-pointer font-semibold text-lumera-muted mb-2">
                      Detalhes do erro (visível apenas em desenvolvimento)
                    </summary>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="font-mono text-sm text-red-400 font-semibold">
                          {this.state.error.name}: {this.state.error.message}
                        </p>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <p className="text-xs font-semibold text-lumera-muted mb-1">
                            Stack Trace:
                          </p>
                          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <p className="text-xs font-semibold text-lumera-muted mb-1">
                            Component Stack:
                          </p>
                          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={this.handleReload}
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
                  onClick={() => (window.location.href = '/')}
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
                <p className="text-sm text-lumera-muted">
                  Se o problema persistir, entre em contato com nosso suporte em{' '}
                  <a
                    href="mailto:suporte@ticketfest.com"
                    className="text-primary-400 hover:text-primary-300 font-medium"
                  >
                    suporte@ticketfest.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
