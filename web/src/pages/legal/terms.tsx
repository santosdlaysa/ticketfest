import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';

export default function TermsOfServicePage() {
  return (
    <>
      <Head>
        <title>Termos de Uso - Lumera</title>
        <meta
          name="description"
          content="Termos de Uso da Lumera - Condições para utilização da plataforma de venda de ingressos"
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
                Termos de Uso
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
                Bem-vindo à Lumera! Estes Termos de Uso ("Termos") regem o acesso e uso da plataforma Lumera,
                operada pela Lumera Tecnologia e Eventos Ltda. ("Lumera", "nós", "nosso" ou "empresa"),
                CNPJ nº XX.XXX.XXX/XXXX-XX, com sede em [endereço].
              </p>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Ao acessar ou usar nossa plataforma, você ("usuário", "você" ou "seu") concorda em cumprir
                e estar vinculado a estes Termos. Se você não concordar com qualquer parte destes Termos,
                não utilize nossos serviços.
              </p>
            </section>

            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                1. Definições
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Para os fins destes Termos, consideram-se:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li><strong>Plataforma</strong>: O site, aplicativo móvel e todos os serviços oferecidos pela Lumera</li>
                <li><strong>Usuário</strong>: Pessoa física ou jurídica que acessa e utiliza a Plataforma</li>
                <li><strong>Organizador</strong>: Pessoa física ou jurídica responsável pela criação e gestão de eventos</li>
                <li><strong>Evento</strong>: Qualquer acontecimento disponibilizado para venda de ingressos através da Plataforma</li>
                <li><strong>Ingresso</strong>: Título que dá direito de acesso a um Evento específico</li>
                <li><strong>Conta</strong>: Cadastro do Usuário na Plataforma com dados pessoais e credenciais de acesso</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                2. Aceitação dos Termos
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Ao criar uma conta, navegar pela Plataforma ou realizar qualquer transação, você declara que:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Leu, compreendeu e aceita estes Termos de Uso na íntegra</li>
                <li>Leu e aceita nossa <Link href="/legal/privacy" className="text-primary-400 hover:text-primary-300 underline">Política de Privacidade</Link></li>
                <li>É maior de 18 anos ou possui autorização de responsável legal</li>
                <li>Possui capacidade legal para celebrar contratos vinculativos</li>
                <li>Fornecerá informações verdadeiras, precisas e atualizadas</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                3. Descrição dos Serviços
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                A Lumera oferece uma plataforma digital para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Venda de ingressos para eventos de terceiros (Organizadores)</li>
                <li>Busca e descoberta de eventos</li>
                <li>Gestão de ingressos adquiridos</li>
                <li>Processamento de pagamentos através de parceiros certificados</li>
                <li>Emissão de ingressos eletrônicos (e-tickets) com código QR</li>
                <li>Validação de ingressos na entrada de eventos</li>
                <li>Suporte ao cliente antes, durante e após eventos</li>
              </ul>
              <div className="bg-blue-500/10 border-l-4 border-blue-400 p-4 mt-4">
                <p className="text-sm text-blue-300">
                  <strong>Importante:</strong> A Lumera atua como intermediadora entre Usuários e Organizadores.
                  Não somos responsáveis pela criação, organização, qualidade ou realização dos eventos anunciados.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                4. Cadastro e Conta
              </h2>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                4.1. Criação de Conta
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Para utilizar determinados serviços da Plataforma, é necessário criar uma conta fornecendo:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail válido</li>
                <li>CPF (Cadastro de Pessoa Física)</li>
                <li>Número de telefone</li>
                <li>Senha segura</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                4.2. Responsabilidades do Usuário
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Ao criar uma conta, você se compromete a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Fornecer informações verdadeiras, completas e atualizadas</li>
                <li>Manter suas credenciais de acesso em sigilo</li>
                <li>Notificar imediatamente a Lumera sobre qualquer uso não autorizado de sua conta</li>
                <li>Ser responsável por todas as atividades realizadas através de sua conta</li>
                <li>Não compartilhar, vender ou transferir sua conta para terceiros</li>
                <li>Atualizar seus dados cadastrais sempre que houver alterações</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                4.3. Suspensão e Encerramento de Conta
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Reservamo-nos o direito de suspender ou encerrar sua conta, a qualquer momento e sem aviso prévio, se:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-2">
                <li>Você violar estes Termos ou qualquer política da Lumera</li>
                <li>Detectarmos atividades fraudulentas ou suspeitas</li>
                <li>Você fornecer informações falsas ou enganosas</li>
                <li>Houver requisição de autoridades competentes</li>
                <li>Você solicitar o encerramento de sua conta</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                5. Compra de Ingressos
              </h2>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                5.1. Processo de Compra
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Ao comprar um ingresso através da Plataforma:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Você está celebrando um contrato diretamente com o Organizador do evento</li>
                <li>A Lumera atua como intermediadora do pagamento e emissão do ingresso</li>
                <li>Você receberá um e-mail de confirmação com o ingresso eletrônico (e-ticket)</li>
                <li>O ingresso contém um código QR único para validação na entrada do evento</li>
                <li>Cada compra gera uma nota fiscal eletrônica</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                5.2. Preços e Taxas
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Os preços exibidos na Plataforma incluem:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Valor do ingresso definido pelo Organizador</li>
                <li>Taxa de serviço da Lumera (claramente discriminada)</li>
                <li>Tributos aplicáveis conforme legislação vigente</li>
              </ul>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Os preços podem variar conforme tipo de ingresso, lote promocional e data de compra.
                O preço final será exibido antes da confirmação da compra.
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                5.3. Formas de Pagamento
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Aceitamos as seguintes formas de pagamento:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li><strong>Cartão de Crédito</strong>: Aprovação imediata (sujeito à análise do emissor)</li>
                <li><strong>Cartão de Débito</strong>: Aprovação imediata</li>
                <li><strong>PIX</strong>: Confirmação em até 10 minutos</li>
                <li><strong>Boleto Bancário</strong>: Confirmação em até 3 dias úteis após pagamento</li>
              </ul>
              <p className="text-lumera-muted leading-relaxed mt-4">
                Todos os pagamentos são processados de forma segura pelo Pagar.me (Stone Pagamentos S.A.),
                certificado PCI-DSS nível 1.
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                5.4. Confirmação e Entrega
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Após a confirmação do pagamento:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-2">
                <li>Você receberá um e-mail de confirmação com os ingressos em PDF</li>
                <li>Os ingressos também estarão disponíveis em sua conta na Plataforma</li>
                <li>Você pode apresentar o ingresso impresso ou digital (no celular)</li>
                <li>É recomendado fazer backup dos ingressos</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                5.5. Limite de Ingressos
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Organizadores podem estabelecer limites de ingressos por CPF ou por transação.
                Reservamo-nos o direito de cancelar pedidos que violem estes limites ou que sejam
                considerados suspeitos de revenda não autorizada.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                6. Política de Cancelamento e Reembolso
              </h2>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                6.1. Cancelamento por Iniciativa do Usuário
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                De acordo com o Código de Defesa do Consumidor:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Você pode solicitar o cancelamento em até 7 dias após a compra</li>
                <li>O reembolso será de 100% do valor pago, incluindo taxas de serviço</li>
                <li>O prazo de estorno varia conforme a forma de pagamento original</li>
                <li>Após 7 dias, o cancelamento depende da política do Organizador</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                6.2. Cancelamento do Evento
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Se um evento for cancelado pelo Organizador:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Você será notificado imediatamente por e-mail e SMS</li>
                <li>O reembolso integral será processado automaticamente</li>
                <li>O prazo de reembolso é de até 30 dias corridos</li>
                <li>Taxa de serviço da Lumera não será reembolsada em alguns casos</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                6.3. Adiamento ou Alteração do Evento
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Em caso de adiamento ou alteração significativa:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-2">
                <li>Seu ingresso permanecerá válido para a nova data</li>
                <li>Você poderá solicitar reembolso conforme política do Organizador</li>
                <li>Será notificado sobre todas as alterações</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                6.4. Prazo de Reembolso
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Os prazos de reembolso são:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-2">
                <li><strong>Cartão de Crédito</strong>: Até 2 faturas subsequentes</li>
                <li><strong>Cartão de Débito</strong>: Até 10 dias úteis</li>
                <li><strong>PIX/Boleto</strong>: Até 10 dias úteis via transferência bancária</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                7. Uso Permitido da Plataforma
              </h2>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                7.1. Você Pode
              </h3>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Usar a Plataforma para fins pessoais e não comerciais</li>
                <li>Comprar ingressos para uso próprio ou como presente</li>
                <li>Compartilhar eventos nas redes sociais usando nossas ferramentas</li>
                <li>Avaliar eventos que você compareceu</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                7.2. Você Não Pode
              </h3>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Revender ingressos por valores superiores ao face value (cambismo)</li>
                <li>Usar bots, scripts ou automação para comprar ingressos</li>
                <li>Criar múltiplas contas para burlar limites de compra</li>
                <li>Copiar, modificar ou distribuir conteúdo da Plataforma sem autorização</li>
                <li>Fazer engenharia reversa ou tentar acessar sistemas não autorizados</li>
                <li>Transmitir vírus, malware ou código malicioso</li>
                <li>Usar a Plataforma para atividades ilegais ou fraudulentas</li>
                <li>Assediar, ameaçar ou prejudicar outros usuários</li>
                <li>Publicar conteúdo falso, enganoso ou difamatório</li>
                <li>Violar direitos de propriedade intelectual da Lumera ou terceiros</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                8. Propriedade Intelectual
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Todo o conteúdo da Plataforma é protegido por direitos autorais e outras leis de propriedade intelectual:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>A marca "Lumera", logo, design e elementos visuais são propriedade exclusiva da empresa</li>
                <li>O código-fonte, algoritmos e tecnologia são confidenciais</li>
                <li>Textos, imagens, vídeos e conteúdos dos eventos pertencem aos respectivos Organizadores</li>
                <li>Você recebe apenas uma licença limitada, não exclusiva e revogável para usar a Plataforma</li>
                <li>É proibido reproduzir, distribuir ou criar obras derivadas sem autorização expressa</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                9. Limitação de Responsabilidade
              </h2>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                9.1. Responsabilidades da Lumera
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                A Lumera é responsável por:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Intermediar a venda de ingressos entre Usuários e Organizadores</li>
                <li>Processar pagamentos de forma segura através de parceiros certificados</li>
                <li>Emitir e entregar ingressos eletrônicos</li>
                <li>Fornecer suporte ao cliente relacionado à Plataforma</li>
                <li>Proteger dados pessoais conforme nossa Política de Privacidade</li>
              </ul>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                9.2. Limitações de Responsabilidade
              </h3>
              <p className="text-lumera-muted leading-relaxed mb-4">
                A Lumera NÃO é responsável por:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4">
                <li>Qualidade, segurança, legalidade ou realização dos eventos</li>
                <li>Ações ou omissões dos Organizadores</li>
                <li>Alterações, adiamentos ou cancelamentos de eventos decididos pelos Organizadores</li>
                <li>Condições do local do evento (estrutura, segurança, acessibilidade)</li>
                <li>Problemas de transporte ou estacionamento</li>
                <li>Comportamento de outros participantes do evento</li>
                <li>Danos ou prejuízos indiretos, incidentais ou consequenciais</li>
                <li>Perda de lucros, dados ou oportunidades de negócio</li>
                <li>Falhas temporárias na Plataforma devido a manutenção ou problemas técnicos</li>
                <li>Ataques cibernéticos ou casos fortuitos e força maior</li>
              </ul>

              <div className="bg-yellow-500/10 border-l-4 border-yellow-400 p-4 mt-4">
                <p className="text-sm text-yellow-300">
                  <strong>Importante:</strong> Reclamações sobre o evento devem ser direcionadas diretamente
                  ao Organizador. A Lumera auxiliará na mediação quando possível, mas a responsabilidade
                  final é do Organizador.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                10. Indenização
              </h2>
              <p className="text-lumera-muted leading-relaxed">
                Você concorda em indenizar, defender e isentar a Lumera, seus diretores, funcionários,
                parceiros e afiliados de quaisquer reclamações, danos, perdas, responsabilidades, custos
                ou despesas (incluindo honorários advocatícios) decorrentes de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-4">
                <li>Violação destes Termos de Uso</li>
                <li>Uso indevido da Plataforma</li>
                <li>Violação de direitos de terceiros</li>
                <li>Fornecimento de informações falsas ou enganosas</li>
                <li>Atividades fraudulentas ou ilegais</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                11. Modificações dos Termos
              </h2>
              <p className="text-lumera-muted leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas
                serão comunicadas através de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lumera-muted ml-4 mt-4">
                <li>E-mail para o endereço cadastrado</li>
                <li>Aviso destacado na Plataforma</li>
                <li>Atualização da data no topo deste documento</li>
              </ul>
              <p className="text-lumera-muted leading-relaxed mt-4">
                O uso continuado da Plataforma após as alterações constitui aceitação dos novos Termos.
                Se você não concordar com as modificações, deve encerrar o uso da Plataforma.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                12. Disposições Gerais
              </h2>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                12.1. Lei Aplicável e Foro
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
                da comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos,
                com renúncia expressa a qualquer outro, por mais privilegiado que seja.
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                12.2. Independência das Cláusulas
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais
                disposições permanecerão em pleno vigor e efeito.
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                12.3. Cessão
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Você não pode transferir ou ceder seus direitos e obrigações sob estes Termos sem nosso
                consentimento prévio por escrito. Podemos transferir nossos direitos e obrigações a qualquer momento.
              </p>

              <h3 className="text-xl font-semibold text-lumera-luminoso mb-3 mt-6">
                12.4. Acordo Integral
              </h3>
              <p className="text-lumera-muted leading-relaxed">
                Estes Termos, juntamente com nossa Política de Privacidade, constituem o acordo integral
                entre você e a Lumera, substituindo todos os acordos anteriores relacionados ao uso da Plataforma.
              </p>
            </section>

            {/* Section 13 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-lumera-luminoso mb-4">
                13. Contato
              </h2>
              <p className="text-lumera-muted leading-relaxed mb-4">
                Para dúvidas, sugestões ou reclamações sobre estes Termos de Uso, entre em contato:
              </p>
              <div className="bg-lumera-surface-alt rounded-lg p-6 mt-4">
                <h3 className="font-semibold text-lumera-luminoso mb-3">Dados para Contato:</h3>
                <ul className="space-y-2 text-lumera-muted">
                  <li><strong>Empresa:</strong> Lumera Tecnologia e Eventos Ltda.</li>
                  <li><strong>CNPJ:</strong> XX.XXX.XXX/XXXX-XX</li>
                  <li><strong>Endereço:</strong> [Endereço completo]</li>
                  <li><strong>E-mail de Suporte:</strong> <a href="mailto:suporte@lumera.com.br" className="text-primary-400 hover:text-primary-300 underline">suporte@lumera.com.br</a></li>
                  <li><strong>E-mail Jurídico:</strong> <a href="mailto:juridico@lumera.com.br" className="text-primary-400 hover:text-primary-300 underline">juridico@lumera.com.br</a></li>
                  <li><strong>Telefone:</strong> (11) 99999-9999</li>
                  <li><strong>WhatsApp:</strong> (11) 99999-9999</li>
                  <li><strong>Horário de atendimento:</strong> Segunda a sexta, das 9h às 18h</li>
                </ul>
              </div>
            </section>

            {/* Footer Navigation */}
            <div className="mt-12 pt-8 border-t border-lumera-border">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <Link
                  href="/legal/privacy"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Ver Política de Privacidade →
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
