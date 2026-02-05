import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Política de Privacidade - Lumera</title>
        <meta
          name="description"
          content="Política de Privacidade da Lumera - Como coletamos, usamos e protegemos seus dados pessoais"
        />
      </Head>

      {/* Header */}
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

      {/* Content */}
      <main className="bg-lumera-obsidian min-h-screen py-12">
        <div className="container-custom max-w-4xl">
          <div className="bg-lumera-surface rounded-xl shadow-sm p-8 md:p-12">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-lumera-luminoso mb-2">
                Política de Privacidade
              </h1>
              <p className="text-lumera-muted">
                Última atualização: {new Date().toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            {/* Introduction */}
            <section className="mb-8 prose prose-lg max-w-none">
              <p className="text-lumera-muted leading-relaxed">
                A Lumera ("nós", "nosso" ou "empresa") está comprometida em proteger a privacidade e segurança
                dos dados pessoais de nossos usuários. Esta Política de Privacidade descreve como coletamos,
                usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nossa plataforma
                de venda de ingressos para eventos.
              </p>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Ao utilizar os serviços da Lumera, você concorda com as práticas descritas nesta política.
                Esta política está em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                1. Informações que Coletamos
              </h2>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                1.1. Dados Pessoais Fornecidos por Você
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Coletamos as seguintes informações quando você cria uma conta ou realiza uma compra:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li><strong>Nome completo</strong>: Para identificação e personalização do serviço</li>
                <li><strong>Endereço de e-mail</strong>: Para comunicação, envio de ingressos e notificações</li>
                <li><strong>CPF (Cadastro de Pessoa Física)</strong>: Exigido para emissão de nota fiscal e validação de identidade</li>
                <li><strong>Número de telefone</strong>: Para contato e recuperação de conta</li>
                <li><strong>Data de nascimento</strong>: Para eventos com restrição de idade</li>
                <li><strong>Endereço</strong>: Quando necessário para entrega de ingressos físicos ou emissão de nota fiscal</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                1.2. Informações de Pagamento
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Para processar suas compras, coletamos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li><strong>Dados de cartão de crédito/débito</strong>: Número do cartão, data de validade, código CVV (processados de forma segura pelo Pagar.me)</li>
                <li><strong>Histórico de transações</strong>: Registros de compras e pagamentos realizados</li>
                <li><strong>Informações de faturamento</strong>: Endereço de cobrança e dados fiscais</li>
              </ul>
              <div className="bg-yellow-500/10 border-l-4 border-yellow-400 p-4 mt-4">
                <p className="text-sm text-yellow-300">
                  <strong>Importante:</strong> Não armazenamos dados completos de cartão de crédito em nossos servidores.
                  Todas as informações de pagamento são processadas de forma segura através do Pagar.me,
                  nosso parceiro de pagamentos certificado PCI-DSS.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                1.3. Dados de Uso e Navegação
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Coletamos automaticamente informações sobre como você interage com nossa plataforma:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Endereço IP e localização geográfica aproximada</li>
                <li>Tipo de navegador, sistema operacional e dispositivo utilizado</li>
                <li>Páginas visitadas, eventos visualizados e tempo de navegação</li>
                <li>Histórico de buscas e preferências de eventos</li>
                <li>Cookies e tecnologias similares (veja seção 5)</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                2. Como Utilizamos Suas Informações
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Utilizamos seus dados pessoais para as seguintes finalidades:
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                2.1. Prestação de Serviços
              </h3>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Processar e confirmar suas compras de ingressos</li>
                <li>Enviar ingressos eletrônicos e códigos QR para acesso aos eventos</li>
                <li>Gerenciar sua conta e preferências</li>
                <li>Fornecer suporte ao cliente e responder suas solicitações</li>
                <li>Validar ingressos na entrada de eventos</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                2.2. Comunicação
              </h3>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Enviar confirmações de compra e atualizações sobre seus pedidos</li>
                <li>Notificar sobre eventos de seu interesse</li>
                <li>Informar sobre alterações em eventos que você comprou ingressos</li>
                <li>Enviar newsletters e ofertas promocionais (com seu consentimento)</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                2.3. Segurança e Prevenção de Fraudes
              </h3>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Detectar e prevenir atividades fraudulentas e abusivas</li>
                <li>Verificar identidade e autenticar usuários</li>
                <li>Proteger contra acesso não autorizado e violações de segurança</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                2.4. Melhorias e Análises
              </h3>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Analisar tendências e comportamentos para melhorar nossos serviços</li>
                <li>Personalizar sua experiência com recomendações de eventos</li>
                <li>Realizar pesquisas de satisfação e coletar feedback</li>
                <li>Desenvolver novos recursos e funcionalidades</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                3. Compartilhamento de Informações
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Compartilhamos seus dados pessoais apenas nas seguintes situações:
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                3.1. Provedores de Serviço
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Compartilhamos informações com parceiros que nos auxiliam a operar nossos serviços:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li><strong>Pagar.me (Stone Pagamentos S.A.)</strong>: Processamento de pagamentos com cartão de crédito, débito, PIX e boleto bancário</li>
                <li><strong>Provedores de hospedagem</strong>: Armazenamento seguro de dados em servidores</li>
                <li><strong>Serviços de e-mail</strong>: Envio de comunicações e ingressos eletrônicos</li>
                <li><strong>Ferramentas de análise</strong>: Análise de uso e performance da plataforma</li>
              </ul>
              <div className="bg-blue-500/10 border-l-4 border-blue-400 p-4 mt-4">
                <p className="text-sm text-blue-300">
                  Todos os nossos parceiros são cuidadosamente selecionados e estão contratualmente obrigados
                  a manter a confidencialidade e segurança de seus dados, utilizando-os apenas para as finalidades acordadas.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                3.2. Organizadores de Eventos
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Compartilhamos informações necessárias com os organizadores dos eventos para os quais você compra ingressos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Nome, e-mail e telefone (para contato relacionado ao evento)</li>
                <li>Número de ingressos adquiridos e tipo de ingresso</li>
                <li>Informações de check-in para controle de acesso</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                3.3. Obrigações Legais
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Podemos divulgar suas informações quando exigido por lei ou para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-2">
                <li>Cumprir ordens judiciais ou requisições de autoridades competentes</li>
                <li>Proteger nossos direitos, propriedade ou segurança</li>
                <li>Investigar fraudes ou violações de nossos Termos de Uso</li>
                <li>Atender obrigações fiscais e tributárias</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                4. Armazenamento e Segurança dos Dados
              </h2>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                4.1. Medidas de Segurança
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Implementamos diversas medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Criptografia SSL/TLS para transmissão de dados</li>
                <li>Criptografia de dados sensíveis em repouso</li>
                <li>Firewalls e sistemas de detecção de intrusão</li>
                <li>Controles de acesso rigorosos e autenticação multifator</li>
                <li>Monitoramento contínuo de segurança e auditoria de logs</li>
                <li>Backups regulares e planos de recuperação de desastres</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                4.2. Localização dos Dados
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Seus dados são armazenados em servidores seguros localizados no Brasil, em conformidade
                com a LGPD. Alguns parceiros podem processar dados em servidores internacionais, sempre
                garantindo níveis adequados de proteção.
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                4.3. Período de Retenção
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Mantemos seus dados pessoais pelo tempo necessário para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-2">
                <li>Fornecer nossos serviços e manter sua conta ativa</li>
                <li>Cumprir obrigações legais, fiscais e contábeis (normalmente 5 anos)</li>
                <li>Resolver disputas e fazer cumprir nossos acordos</li>
                <li>Prevenir fraudes e abusos</li>
              </ul>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Após este período, seus dados serão anonimizados ou excluídos de forma segura.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                5. Cookies e Tecnologias Similares
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência em nossa plataforma.
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                5.1. O que são Cookies?
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Cookies são pequenos arquivos de texto armazenados em seu navegador que nos permitem reconhecer
                seu dispositivo e lembrar suas preferências.
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                5.2. Tipos de Cookies que Utilizamos
              </h3>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li><strong>Cookies Essenciais</strong>: Necessários para o funcionamento básico da plataforma (login, carrinho de compras)</li>
                <li><strong>Cookies de Performance</strong>: Analisam como você usa o site para melhorar a performance</li>
                <li><strong>Cookies de Funcionalidade</strong>: Lembram suas preferências e escolhas</li>
                <li><strong>Cookies de Marketing</strong>: Personalizam anúncios e medem eficácia de campanhas (apenas com seu consentimento)</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                5.3. Gerenciamento de Cookies
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
                Note que desabilitar certos cookies pode afetar a funcionalidade do site.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                6. Seus Direitos (LGPD)
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                De acordo com a LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:
              </p>
              <ul className="list-disc list-inside space-y-3 text-lumera-muted ml-4">
                <li><strong>Confirmação e Acesso</strong>: Confirmar se processamos seus dados e solicitar acesso a eles</li>
                <li><strong>Correção</strong>: Solicitar a correção de dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização, Bloqueio ou Eliminação</strong>: Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos</li>
                <li><strong>Portabilidade</strong>: Solicitar a portabilidade de seus dados a outro fornecedor de serviço</li>
                <li><strong>Eliminação</strong>: Solicitar a eliminação de dados tratados com seu consentimento</li>
                <li><strong>Informação sobre Compartilhamento</strong>: Obter informações sobre entidades com as quais compartilhamos seus dados</li>
                <li><strong>Revogação do Consentimento</strong>: Revogar seu consentimento a qualquer momento</li>
                <li><strong>Oposição</strong>: Opor-se ao tratamento de dados em determinadas situações</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                6.1. Como Exercer Seus Direitos
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Para exercer qualquer um desses direitos, você pode:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-2">
                <li>Acessar as configurações de sua conta na plataforma</li>
                <li>Enviar um e-mail para: <a href="mailto:privacidade@lumera.com.br" className="text-primary-400 hover:text-primary-300 underline">privacidade@lumera.com.br</a></li>
                <li>Entrar em contato através do nosso canal de suporte</li>
              </ul>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Responderemos à sua solicitação em até 15 dias, podendo ser prorrogado por mais 15 dias mediante justificativa.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                7. Menores de Idade
              </h2>
              <p className="text-lumera-muted leading-relaxed">
                Nossos serviços são destinados a pessoas maiores de 18 anos. Não coletamos intencionalmente
                dados de menores de idade sem o consentimento de pais ou responsáveis. Se você é menor de 18 anos,
                utilize nossa plataforma apenas com a supervisão de um adulto responsável.
              </p>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Se tomarmos conhecimento de que coletamos dados de menores sem o devido consentimento,
                tomaremos medidas para excluir essas informações o mais rápido possível.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                8. Links para Sites de Terceiros
              </h2>
              <p className="text-lumera-muted leading-relaxed">
                Nossa plataforma pode conter links para sites de terceiros (organizadores de eventos,
                patrocinadores, etc.). Não somos responsáveis pelas práticas de privacidade desses sites.
                Recomendamos que você leia as políticas de privacidade de cada site que visitar.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                9. Alterações nesta Política
              </h2>
              <p className="text-lumera-muted leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas
                práticas ou por razões legais. Notificaremos você sobre alterações significativas através de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-2">
                <li>E-mail para o endereço cadastrado em sua conta</li>
                <li>Aviso em destaque em nossa plataforma</li>
                <li>Atualização da data de "Última atualização" no topo desta página</li>
              </ul>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Recomendamos que você revise esta política regularmente para se manter informado sobre como
                protegemos seus dados.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                10. Contato e Encarregado de Dados
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade
                ou ao tratamento de seus dados pessoais, entre em contato conosco:
              </p>
              <div className="bg-lumera-surface-alt rounded-lg p-6 mt-4">
                <h3 className="font-semibold text-lumera-luminoso mb-3">Dados para Contato:</h3>
                <ul className="space-y-2 text-lumera-muted">
                  <li><strong>Empresa:</strong> Lumera Tecnologia e Eventos Ltda.</li>
                  <li><strong>E-mail de Privacidade:</strong> <a href="mailto:privacidade@lumera.com.br" className="text-primary-400 hover:text-primary-300 underline">privacidade@lumera.com.br</a></li>
                  <li><strong>E-mail de Suporte:</strong> <a href="mailto:suporte@lumera.com.br" className="text-primary-400 hover:text-primary-300 underline">suporte@lumera.com.br</a></li>
                  <li><strong>Telefone:</strong> (11) 99999-9999</li>
                  <li><strong>Encarregado de Dados (DPO):</strong> dpo@lumera.com.br</li>
                </ul>
              </div>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Você também tem o direito de apresentar uma reclamação à Autoridade Nacional de Proteção de Dados (ANPD)
                se considerar que o tratamento de seus dados pessoais viola a LGPD.
              </p>
            </section>

            {/* Footer Navigation */}
            <div className="mt-12 pt-8 border-t border-lumera-border">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <Link
                  href="/legal/terms"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Ver Termos de Uso →
                </Link>
                <Link
                  href="/"
                  className="text-lumera-muted hover:text-lumera-muted transition-colors"
                >
                  ← Voltar para Home
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
