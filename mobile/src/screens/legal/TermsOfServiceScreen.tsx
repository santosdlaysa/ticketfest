import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Appbar, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../stores/themeStore';
import { lightColors, darkColors, spacing, fontSize } from '../../theme';
import type { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function TermsOfServiceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.subSection}>
      <Text style={[styles.subSectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{children}</Text>
  );

  const BulletPoint = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.bulletContainer}>
      <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );

  const InfoBox = ({ children, color = '#3498db' }: { children: React.ReactNode; color?: string }) => (
    <View style={[styles.infoBox, { backgroundColor: color + '15', borderLeftColor: color }]}>
      <Text style={[styles.infoText, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.text} />
        <Appbar.Content title="Termos de Uso" titleStyle={{ color: colors.text }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Termos de Uso</Text>
          <Text style={[styles.lastUpdate, { color: colors.textMuted }]}>
            Última atualização: {new Date().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Introduction */}
        <View style={styles.section}>
          <Paragraph>
            Bem-vindo à Lumera! Estes Termos de Uso regem o acesso e uso da plataforma Lumera,
            operada pela Lumera Tecnologia e Eventos Ltda.
          </Paragraph>
          <Paragraph>
            Ao acessar ou usar nossa plataforma, você concorda em cumprir e estar vinculado a estes Termos.
            Se não concordar, não utilize nossos serviços.
          </Paragraph>
        </View>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 1 */}
        <Section title="1. Definições">
          <Paragraph>Para os fins destes Termos:</Paragraph>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Plataforma</Text>: O app, site e todos os serviços da Lumera</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Usuário</Text>: Pessoa que acessa e utiliza a Plataforma</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Organizador</Text>: Responsável pela criação e gestão de eventos</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Evento</Text>: Acontecimento disponível para venda de ingressos</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Ingresso</Text>: Título que dá direito de acesso a um Evento</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Conta</Text>: Cadastro com dados pessoais e credenciais</BulletPoint>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 2 */}
        <Section title="2. Aceitação dos Termos">
          <Paragraph>Ao criar uma conta ou realizar transações, você declara que:</Paragraph>
          <BulletPoint>Leu, compreendeu e aceita estes Termos</BulletPoint>
          <BulletPoint>Aceita nossa Política de Privacidade</BulletPoint>
          <BulletPoint>É maior de 18 anos ou possui autorização de responsável</BulletPoint>
          <BulletPoint>Possui capacidade legal para celebrar contratos</BulletPoint>
          <BulletPoint>Fornecerá informações verdadeiras e atualizadas</BulletPoint>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 3 */}
        <Section title="3. Descrição dos Serviços">
          <Paragraph>A Lumera oferece:</Paragraph>
          <BulletPoint>Venda de ingressos para eventos de terceiros</BulletPoint>
          <BulletPoint>Busca e descoberta de eventos</BulletPoint>
          <BulletPoint>Gestão de ingressos adquiridos</BulletPoint>
          <BulletPoint>Processamento de pagamentos via parceiros certificados</BulletPoint>
          <BulletPoint>Emissão de ingressos eletrônicos com código QR</BulletPoint>
          <BulletPoint>Validação de ingressos na entrada</BulletPoint>
          <BulletPoint>Suporte ao cliente</BulletPoint>

          <InfoBox>
            <Text style={{ fontWeight: '600' }}>Importante: </Text>
            A Lumera atua como intermediadora. Não somos responsáveis pela criação, organização
            ou qualidade dos eventos anunciados.
          </InfoBox>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 4 */}
        <Section title="4. Cadastro e Conta">
          <SubSection title="4.1. Criação de Conta">
            <Paragraph>Para usar a plataforma, é necessário fornecer:</Paragraph>
            <BulletPoint>Nome completo</BulletPoint>
            <BulletPoint>E-mail válido</BulletPoint>
            <BulletPoint>CPF (Cadastro de Pessoa Física)</BulletPoint>
            <BulletPoint>Número de telefone</BulletPoint>
            <BulletPoint>Senha segura</BulletPoint>
          </SubSection>

          <SubSection title="4.2. Responsabilidades">
            <Paragraph>Você se compromete a:</Paragraph>
            <BulletPoint>Fornecer informações verdadeiras e completas</BulletPoint>
            <BulletPoint>Manter suas credenciais em sigilo</BulletPoint>
            <BulletPoint>Notificar sobre uso não autorizado</BulletPoint>
            <BulletPoint>Ser responsável por atividades em sua conta</BulletPoint>
            <BulletPoint>Não compartilhar ou vender sua conta</BulletPoint>
            <BulletPoint>Atualizar seus dados quando necessário</BulletPoint>
          </SubSection>

          <SubSection title="4.3. Suspensão de Conta">
            <Paragraph>Podemos suspender sua conta se:</Paragraph>
            <BulletPoint>Você violar estes Termos</BulletPoint>
            <BulletPoint>Detectarmos atividades fraudulentas</BulletPoint>
            <BulletPoint>Você fornecer informações falsas</BulletPoint>
            <BulletPoint>Houver requisição de autoridades</BulletPoint>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 5 */}
        <Section title="5. Compra de Ingressos">
          <SubSection title="5.1. Processo de Compra">
            <Paragraph>Ao comprar um ingresso:</Paragraph>
            <BulletPoint>Você celebra contrato com o Organizador</BulletPoint>
            <BulletPoint>A Lumera é intermediadora do pagamento</BulletPoint>
            <BulletPoint>Receberá e-mail com ingresso eletrônico</BulletPoint>
            <BulletPoint>O ingresso contém código QR único</BulletPoint>
            <BulletPoint>Será gerada nota fiscal eletrônica</BulletPoint>
          </SubSection>

          <SubSection title="5.2. Preços e Taxas">
            <Paragraph>Os preços incluem:</Paragraph>
            <BulletPoint>Valor do ingresso (definido pelo Organizador)</BulletPoint>
            <BulletPoint>Taxa de serviço da Lumera</BulletPoint>
            <BulletPoint>Tributos aplicáveis</BulletPoint>
            <Paragraph>
              Preços variam por tipo, lote e data. O valor final é exibido antes da confirmação.
            </Paragraph>
          </SubSection>

          <SubSection title="5.3. Formas de Pagamento">
            <Paragraph>Aceitamos:</Paragraph>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Cartão de Crédito</Text>: Aprovação imediata</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Cartão de Débito</Text>: Aprovação imediata</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>PIX</Text>: Confirmação em até 10 minutos</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Boleto</Text>: Confirmação em até 3 dias úteis</BulletPoint>
            <Paragraph>
              Pagamentos processados pelo Pagar.me, certificado PCI-DSS nível 1.
            </Paragraph>
          </SubSection>

          <SubSection title="5.4. Confirmação e Entrega">
            <Paragraph>Após confirmação do pagamento:</Paragraph>
            <BulletPoint>Receberá e-mail com ingressos em PDF</BulletPoint>
            <BulletPoint>Ingressos disponíveis em sua conta</BulletPoint>
            <BulletPoint>Pode apresentar impresso ou digital</BulletPoint>
            <BulletPoint>Recomendado fazer backup</BulletPoint>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 6 */}
        <Section title="6. Cancelamento e Reembolso">
          <SubSection title="6.1. Cancelamento pelo Usuário">
            <Paragraph>Conforme Código de Defesa do Consumidor:</Paragraph>
            <BulletPoint>Pode cancelar em até 7 dias após compra</BulletPoint>
            <BulletPoint>Reembolso de 100% do valor pago</BulletPoint>
            <BulletPoint>Prazo varia conforme forma de pagamento</BulletPoint>
            <BulletPoint>Após 7 dias, depende da política do Organizador</BulletPoint>
          </SubSection>

          <SubSection title="6.2. Cancelamento do Evento">
            <Paragraph>Se evento for cancelado:</Paragraph>
            <BulletPoint>Notificação imediata por e-mail e SMS</BulletPoint>
            <BulletPoint>Reembolso integral processado automaticamente</BulletPoint>
            <BulletPoint>Prazo de até 30 dias corridos</BulletPoint>
          </SubSection>

          <SubSection title="6.3. Prazos de Reembolso">
            <BulletPoint><Text style={{ fontWeight: '600' }}>Cartão de Crédito</Text>: Até 2 faturas</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Cartão de Débito</Text>: Até 10 dias úteis</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>PIX/Boleto</Text>: Até 10 dias úteis</BulletPoint>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 7 */}
        <Section title="7. Uso Permitido">
          <SubSection title="7.1. Você Pode">
            <BulletPoint>Usar para fins pessoais e não comerciais</BulletPoint>
            <BulletPoint>Comprar ingressos para uso próprio ou presente</BulletPoint>
            <BulletPoint>Compartilhar eventos nas redes sociais</BulletPoint>
            <BulletPoint>Avaliar eventos que compareceu</BulletPoint>
          </SubSection>

          <SubSection title="7.2. Você Não Pode">
            <BulletPoint>Revender ingressos (cambismo)</BulletPoint>
            <BulletPoint>Usar bots ou automação</BulletPoint>
            <BulletPoint>Criar múltiplas contas para burlar limites</BulletPoint>
            <BulletPoint>Copiar ou distribuir conteúdo sem autorização</BulletPoint>
            <BulletPoint>Fazer engenharia reversa</BulletPoint>
            <BulletPoint>Transmitir vírus ou malware</BulletPoint>
            <BulletPoint>Usar para atividades ilegais</BulletPoint>
            <BulletPoint>Assediar ou ameaçar outros usuários</BulletPoint>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 8 */}
        <Section title="8. Propriedade Intelectual">
          <Paragraph>Todo conteúdo da Plataforma é protegido por direitos autorais:</Paragraph>
          <BulletPoint>Marca "Lumera", logo e design são propriedade exclusiva</BulletPoint>
          <BulletPoint>Código-fonte e algoritmos são confidenciais</BulletPoint>
          <BulletPoint>Conteúdo de eventos pertence aos Organizadores</BulletPoint>
          <BulletPoint>Licença limitada, não exclusiva e revogável</BulletPoint>
          <BulletPoint>Proibido reproduzir sem autorização</BulletPoint>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 9 */}
        <Section title="9. Limitação de Responsabilidade">
          <SubSection title="9.1. Somos Responsáveis Por">
            <BulletPoint>Intermediar venda de ingressos</BulletPoint>
            <BulletPoint>Processar pagamentos com segurança</BulletPoint>
            <BulletPoint>Emitir ingressos eletrônicos</BulletPoint>
            <BulletPoint>Fornecer suporte ao cliente</BulletPoint>
            <BulletPoint>Proteger dados pessoais</BulletPoint>
          </SubSection>

          <SubSection title="9.2. NÃO Somos Responsáveis Por">
            <BulletPoint>Qualidade, segurança ou realização dos eventos</BulletPoint>
            <BulletPoint>Ações dos Organizadores</BulletPoint>
            <BulletPoint>Alterações ou cancelamentos de eventos</BulletPoint>
            <BulletPoint>Condições do local do evento</BulletPoint>
            <BulletPoint>Problemas de transporte</BulletPoint>
            <BulletPoint>Comportamento de outros participantes</BulletPoint>
            <BulletPoint>Falhas técnicas temporárias</BulletPoint>
          </SubSection>

          <InfoBox color="#f39c12">
            Reclamações sobre eventos devem ser direcionadas ao Organizador.
            A Lumera auxiliará na mediação quando possível.
          </InfoBox>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 10 */}
        <Section title="10. Modificações dos Termos">
          <Paragraph>
            Podemos modificar estes Termos a qualquer momento. Alterações significativas serão
            comunicadas por e-mail e aviso no app.
          </Paragraph>
          <Paragraph>
            O uso continuado após alterações constitui aceitação dos novos Termos.
          </Paragraph>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 11 */}
        <Section title="11. Disposições Gerais">
          <SubSection title="11.1. Lei Aplicável">
            <Paragraph>
              Estes Termos são regidos pelas leis do Brasil. Foro eleito: São Paulo/SP.
            </Paragraph>
          </SubSection>

          <SubSection title="11.2. Independência das Cláusulas">
            <Paragraph>
              Se alguma disposição for inválida, as demais permanecem em vigor.
            </Paragraph>
          </SubSection>

          <SubSection title="11.3. Acordo Integral">
            <Paragraph>
              Estes Termos e a Política de Privacidade constituem o acordo integral entre você e a Lumera.
            </Paragraph>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 12 - Contact */}
        <Section title="12. Contato">
          <Paragraph>Para dúvidas sobre estes Termos:</Paragraph>
          <View style={[styles.contactBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>Empresa:</Text> Lumera Tecnologia e Eventos Ltda.
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>CNPJ:</Text> XX.XXX.XXX/XXXX-XX
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>E-mail:</Text> suporte@lumera.com.br
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>Jurídico:</Text> juridico@lumera.com.br
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>Telefone:</Text> (11) 99999-9999
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>WhatsApp:</Text> (11) 99999-9999
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>Horário:</Text> Segunda a sexta, 9h às 18h
            </Text>
          </View>
        </Section>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            © {new Date().getFullYear()} Lumera. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  lastUpdate: {
    fontSize: fontSize.sm,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  subSection: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  subSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  bullet: {
    fontSize: fontSize.md,
    marginRight: spacing.xs,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  infoBox: {
    borderLeftWidth: 4,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderRadius: 8,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  contactBox: {
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  contactItem: {
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  footerText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
