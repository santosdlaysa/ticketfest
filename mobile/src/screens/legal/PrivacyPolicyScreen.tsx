import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Appbar, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../stores/themeStore';
import { lightColors, darkColors, spacing, fontSize } from '../../theme';
import type { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function PrivacyPolicyScreen() {
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
        <Appbar.Content title="Política de Privacidade" titleStyle={{ color: colors.text }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Política de Privacidade</Text>
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
            A Lumera ("nós", "nosso" ou "empresa") está comprometida em proteger a privacidade e segurança
            dos dados pessoais de nossos usuários. Esta Política de Privacidade descreve como coletamos,
            usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nossa plataforma
            de venda de ingressos para eventos.
          </Paragraph>
          <Paragraph>
            Ao utilizar os serviços da Lumera, você concorda com as práticas descritas nesta política.
            Esta política está em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).
          </Paragraph>
        </View>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 1 */}
        <Section title="1. Informações que Coletamos">
          <SubSection title="1.1. Dados Pessoais Fornecidos por Você">
            <Paragraph>Coletamos as seguintes informações quando você cria uma conta ou realiza uma compra:</Paragraph>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Nome completo</Text>: Para identificação e personalização do serviço</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>E-mail</Text>: Para comunicação, envio de ingressos e notificações</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>CPF</Text>: Exigido para emissão de nota fiscal e validação de identidade</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Telefone</Text>: Para contato e recuperação de conta</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Data de nascimento</Text>: Para eventos com restrição de idade</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Endereço</Text>: Quando necessário para entrega ou emissão de nota fiscal</BulletPoint>
          </SubSection>

          <SubSection title="1.2. Informações de Pagamento">
            <Paragraph>Para processar suas compras, coletamos:</Paragraph>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Dados de cartão</Text>: Número, validade e CVV (processados pelo Pagar.me)</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Histórico de transações</Text>: Registros de compras e pagamentos</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Informações de faturamento</Text>: Endereço de cobrança e dados fiscais</BulletPoint>

            <InfoBox color="#f39c12">
              <Text style={{ fontWeight: '600' }}>Importante: </Text>
              Não armazenamos dados completos de cartão de crédito em nossos servidores.
              Todas as informações de pagamento são processadas de forma segura através do Pagar.me,
              nosso parceiro certificado PCI-DSS.
            </InfoBox>
          </SubSection>

          <SubSection title="1.3. Dados de Uso e Navegação">
            <Paragraph>Coletamos automaticamente informações sobre como você interage com nossa plataforma:</Paragraph>
            <BulletPoint>Endereço IP e localização geográfica aproximada</BulletPoint>
            <BulletPoint>Tipo de dispositivo, sistema operacional e versão do app</BulletPoint>
            <BulletPoint>Páginas visitadas, eventos visualizados e tempo de navegação</BulletPoint>
            <BulletPoint>Histórico de buscas e preferências de eventos</BulletPoint>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 2 */}
        <Section title="2. Como Utilizamos Suas Informações">
          <Paragraph>Utilizamos seus dados pessoais para as seguintes finalidades:</Paragraph>

          <SubSection title="2.1. Prestação de Serviços">
            <BulletPoint>Processar e confirmar suas compras de ingressos</BulletPoint>
            <BulletPoint>Enviar ingressos eletrônicos e códigos QR</BulletPoint>
            <BulletPoint>Gerenciar sua conta e preferências</BulletPoint>
            <BulletPoint>Fornecer suporte ao cliente</BulletPoint>
            <BulletPoint>Validar ingressos na entrada de eventos</BulletPoint>
          </SubSection>

          <SubSection title="2.2. Comunicação">
            <BulletPoint>Enviar confirmações de compra e atualizações</BulletPoint>
            <BulletPoint>Notificar sobre eventos de seu interesse</BulletPoint>
            <BulletPoint>Informar sobre alterações em eventos</BulletPoint>
            <BulletPoint>Enviar newsletters e ofertas (com seu consentimento)</BulletPoint>
          </SubSection>

          <SubSection title="2.3. Segurança e Prevenção de Fraudes">
            <BulletPoint>Detectar e prevenir atividades fraudulentas</BulletPoint>
            <BulletPoint>Verificar identidade e autenticar usuários</BulletPoint>
            <BulletPoint>Proteger contra acesso não autorizado</BulletPoint>
            <BulletPoint>Cumprir obrigações legais e regulatórias</BulletPoint>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 3 */}
        <Section title="3. Compartilhamento de Informações">
          <Paragraph>Compartilhamos seus dados pessoais apenas nas seguintes situações:</Paragraph>

          <SubSection title="3.1. Provedores de Serviço">
            <Paragraph>Compartilhamos informações com parceiros que nos auxiliam:</Paragraph>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Pagar.me</Text>: Processamento de pagamentos</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Provedores de hospedagem</Text>: Armazenamento seguro</BulletPoint>
            <BulletPoint><Text style={{ fontWeight: '600' }}>Serviços de e-mail</Text>: Envio de comunicações</BulletPoint>

            <InfoBox>
              Todos os parceiros são obrigados a manter a confidencialidade e segurança de seus dados.
            </InfoBox>
          </SubSection>

          <SubSection title="3.2. Organizadores de Eventos">
            <Paragraph>Compartilhamos com organizadores:</Paragraph>
            <BulletPoint>Nome, e-mail e telefone para contato</BulletPoint>
            <BulletPoint>Número e tipo de ingressos adquiridos</BulletPoint>
            <BulletPoint>Informações de check-in</BulletPoint>
          </SubSection>

          <SubSection title="3.3. Obrigações Legais">
            <Paragraph>Podemos divulgar informações quando exigido por lei ou para:</Paragraph>
            <BulletPoint>Cumprir ordens judiciais ou requisições de autoridades</BulletPoint>
            <BulletPoint>Proteger nossos direitos e segurança</BulletPoint>
            <BulletPoint>Investigar fraudes ou violações</BulletPoint>
            <BulletPoint>Atender obrigações fiscais</BulletPoint>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 4 */}
        <Section title="4. Segurança dos Dados">
          <SubSection title="4.1. Medidas de Segurança">
            <Paragraph>Implementamos diversas medidas para proteger seus dados:</Paragraph>
            <BulletPoint>Criptografia SSL/TLS para transmissão</BulletPoint>
            <BulletPoint>Criptografia de dados sensíveis</BulletPoint>
            <BulletPoint>Firewalls e sistemas de detecção de intrusão</BulletPoint>
            <BulletPoint>Controles de acesso rigorosos</BulletPoint>
            <BulletPoint>Monitoramento contínuo de segurança</BulletPoint>
            <BulletPoint>Backups regulares</BulletPoint>
          </SubSection>

          <SubSection title="4.2. Localização dos Dados">
            <Paragraph>
              Seus dados são armazenados em servidores seguros no Brasil, em conformidade com a LGPD.
            </Paragraph>
          </SubSection>

          <SubSection title="4.3. Período de Retenção">
            <Paragraph>Mantemos seus dados pelo tempo necessário para:</Paragraph>
            <BulletPoint>Fornecer nossos serviços</BulletPoint>
            <BulletPoint>Cumprir obrigações legais (normalmente 5 anos)</BulletPoint>
            <BulletPoint>Resolver disputas</BulletPoint>
            <BulletPoint>Prevenir fraudes</BulletPoint>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 5 */}
        <Section title="5. Seus Direitos (LGPD)">
          <Paragraph>De acordo com a LGPD, você possui os seguintes direitos:</Paragraph>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Confirmação e Acesso</Text>: Confirmar se processamos seus dados</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Correção</Text>: Solicitar correção de dados incorretos</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Anonimização ou Eliminação</Text>: Solicitar anonimização ou exclusão</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Portabilidade</Text>: Solicitar portabilidade dos dados</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Informação sobre Compartilhamento</Text>: Saber com quem compartilhamos</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Revogação do Consentimento</Text>: Revogar seu consentimento</BulletPoint>
          <BulletPoint><Text style={{ fontWeight: '600' }}>Oposição</Text>: Opor-se ao tratamento em certas situações</BulletPoint>

          <SubSection title="Como Exercer Seus Direitos">
            <Paragraph>Para exercer qualquer direito:</Paragraph>
            <BulletPoint>Acesse as configurações de sua conta</BulletPoint>
            <BulletPoint>Envie e-mail para: privacidade@lumera.com.br</BulletPoint>
            <BulletPoint>Entre em contato através do suporte</BulletPoint>
            <Paragraph>Responderemos em até 15 dias, prorrogáveis por mais 15 dias.</Paragraph>
          </SubSection>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 6 */}
        <Section title="6. Menores de Idade">
          <Paragraph>
            Nossos serviços são destinados a pessoas maiores de 18 anos. Não coletamos intencionalmente
            dados de menores sem consentimento de pais ou responsáveis.
          </Paragraph>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 7 */}
        <Section title="7. Alterações nesta Política">
          <Paragraph>
            Podemos atualizar esta Política periodicamente. Notificaremos sobre alterações significativas
            através de e-mail e aviso no app.
          </Paragraph>
        </Section>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Section 8 - Contact */}
        <Section title="8. Contato">
          <Paragraph>Para dúvidas sobre esta política, entre em contato:</Paragraph>
          <View style={[styles.contactBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>Empresa:</Text> Lumera Tecnologia e Eventos Ltda.
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>E-mail:</Text> privacidade@lumera.com.br
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>Suporte:</Text> suporte@lumera.com.br
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>Telefone:</Text> (11) 99999-9999
            </Text>
            <Text style={[styles.contactItem, { color: colors.text }]}>
              <Text style={{ fontWeight: '600' }}>DPO:</Text> dpo@lumera.com.br
            </Text>
          </View>
        </Section>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
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
