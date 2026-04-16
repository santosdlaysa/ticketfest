import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';

export default function AccountDeletionPage() {
  const [copied, setCopied] = useState(false);
  const deletionEmail = 'privacidade@lumera.com.br';
  const subject = 'Solicitação de exclusão de conta e dados — Lumera';
  const body = `Olá,

Solicito a exclusão completa da minha conta e dos meus dados pessoais do aplicativo Lumera.

Dados da conta:
- E-mail cadastrado:
- Nome completo:
- Data aproximada do cadastro:

Estou ciente de que esta ação é irreversível.

Obrigado(a).`;

  const mailtoUrl = `mailto:${deletionEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(deletionEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <>
      <Head>
        <title>Exclusão de Conta e Dados - Lumera</title>
        <meta
          name="description"
          content="Solicite a exclusão da sua conta e dos seus dados pessoais do Lumera."
        />
      </Head>

      <header className="bg-lumera-surface shadow-sm sticky top-0 z-10">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-lumera rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-lumera-luminoso font-bold text-lg">Lumera</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-lumera-muted hover:text-primary-400 transition-colors"
            >
              Voltar para Home
            </Link>
          </div>
        </div>
      </header>

      <main className="bg-lumera-obsidian min-h-screen py-12">
        <div className="container-custom max-w-3xl">
          <div className="bg-lumera-surface rounded-xl shadow-sm p-8 md:p-12">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-lumera-luminoso mb-2">
                Exclusão de Conta e Dados
              </h1>
              <p className="text-lumera-muted">
                Como solicitar a remoção da sua conta e dos seus dados pessoais no Lumera.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">1. O que será excluído</h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Ao solicitar a exclusão da conta, removemos permanentemente:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Dados de cadastro (nome, e-mail, telefone, CPF, data de nascimento, endereço).</li>
                <li>Foto de perfil.</li>
                <li>Histórico de favoritos e preferências de eventos.</li>
                <li>Tokens de sessão, dispositivos autenticados e notificações.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">2. O que pode ser retido</h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Por obrigação legal e fiscal, alguns dados podem ser mantidos de forma anonimizada ou
                restrita ao financeiro por até 5 (cinco) anos, conforme a legislação brasileira:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Registros de compras e notas fiscais emitidas.</li>
                <li>Comprovantes de pagamento e estornos.</li>
                <li>Logs de segurança exigidos pelo Marco Civil da Internet.</li>
              </ul>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Esses registros ficam dissociados da sua identidade sempre que possível e são usados
                apenas para cumprimento de obrigações legais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">3. Como solicitar</h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Envie um e-mail para o endereço abaixo a partir da conta cadastrada no app. Nosso time
                confirma a sua identidade e processa a exclusão em até <strong>15 dias úteis</strong>.
              </p>

              <div className="bg-lumera-surface-alt rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-lumera-muted">E-mail de contato:</p>
                    <p className="text-lumera-luminoso font-mono text-lg">{deletionEmail}</p>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="px-4 py-2 bg-lumera-surface border border-lumera-border rounded-md text-sm text-lumera-luminoso hover:border-primary-400 transition-colors"
                  >
                    {copied ? 'Copiado!' : 'Copiar e-mail'}
                  </button>
                </div>

                <a
                  href={mailtoUrl}
                  className="inline-block w-full text-center px-6 py-3 bg-gradient-lumera text-white font-semibold rounded-md hover:opacity-90 transition-opacity"
                >
                  Abrir e-mail com mensagem pronta
                </a>
              </div>

              <p className="text-lumera-muted leading-relaxed mt-4 text-sm">
                Você também pode solicitar a exclusão diretamente no app, em
                <strong> Perfil → Configurações → Excluir conta</strong>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">4. Dúvidas</h2>
              <p className="text-lumera-muted leading-relaxed">
                Consulte também nossa{' '}
                <Link href="/legal/privacy" className="text-primary-400 hover:text-primary-300 underline">
                  Política de Privacidade
                </Link>{' '}
                para entender como tratamos seus dados. Em caso de dúvida, fale com a gente pelo e-mail{' '}
                <a
                  href="mailto:suporte@lumera.com.br"
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  suporte@lumera.com.br
                </a>
                .
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-lumera-border">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <Link
                  href="/legal/privacy"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  ← Política de Privacidade
                </Link>
                <Link
                  href="/"
                  className="text-lumera-muted hover:text-lumera-muted transition-colors"
                >
                  Voltar para Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
