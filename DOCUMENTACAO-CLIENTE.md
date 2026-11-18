# Lumera — Apresentação do Sistema

**Documento de visão funcional e técnica para apresentação ao cliente**  
**Atualizado em:** 18 de novembro de 2026

> Lumera é uma plataforma digital de eventos e venda de ingressos. Este documento descreve os recursos identificados na versão atual do projeto. A disponibilidade em produção depende da infraestrutura, credenciais e serviços externos configurados para cada ambiente.

## 1. Visão geral

A plataforma reúne em um só fluxo a divulgação de eventos, a compra de ingressos, a gestão operacional pelo organizador e a validação de entradas. O produto é composto por uma experiência web, um aplicativo móvel e uma API central conectada ao banco de dados.

### Objetivos do sistema

- Facilitar a descoberta de eventos e a compra de ingressos.
- Dar ao organizador ferramentas para cadastrar eventos, lotes, acompanhar pedidos e controlar o acesso.
- Automatizar a emissão e a consulta de ingressos digitais com QR Code.
- Apoiar a operação financeira com relatórios, divisão de valores e gestão de repasses.
- Disponibilizar ao administrador recursos de gestão e acompanhamento da plataforma.

## 2. Perfis de acesso

| Perfil | Principais responsabilidades |
|---|---|
| **Participante/cliente** | Criar conta, explorar eventos, comprar ingressos, consultar pedidos e apresentar o ingresso no acesso. |
| **Organizador** | Gerenciar seus eventos e ingressos, acompanhar vendas, consultar informações financeiras e validar entradas conforme as permissões concedidas. |
| **Administrador** | Administrar usuários, eventos, pedidos, relatórios, permissões e rotinas operacionais da plataforma. |
| **Equipe da empresa** | Acesso compartilhado para tarefas específicas, conforme convite e permissões disponíveis para a conta. |

O acesso a operações protegidas é controlado por autenticação e autorização. Algumas telas e operações administrativas podem exigir permissões adicionais.

## 3. Jornada do participante

1. **Descoberta:** acessa a página inicial ou a lista de eventos e consulta detalhes como descrição, data, local, categoria e opções de ingresso.
2. **Seleção:** escolhe o tipo e a quantidade de ingressos disponíveis e adiciona os itens ao carrinho.
3. **Identificação e pagamento:** entra ou cria uma conta, informa os dados necessários e seleciona um meio de pagamento habilitado no ambiente.
4. **Confirmação:** acompanha o resultado do pedido. A confirmação pode ser recebida após o retorno do provedor de pagamento ou a atualização de status correspondente.
5. **Ingresso digital:** consulta seus pedidos e ingressos na área pessoal e apresenta o QR Code para validação no evento.
6. **Acesso ao evento:** a equipe autorizada lê o código ou pesquisa/valida o ingresso pelos recursos de check-in.

O carrinho pode ser usado por visitante e associado à conta no fluxo de compra; a conclusão do pedido e a consulta posterior ficam vinculadas ao usuário autenticado.

## 4. Recursos por área

### 4.1 Área pública e compra

- Página inicial com eventos em destaque.
- Catálogo de eventos com busca e filtros disponíveis.
- Página de detalhes do evento e consulta de ingressos.
- Carrinho com inclusão, remoção e ajuste de quantidade.
- Cadastro, login, recuperação e redefinição de senha.
- Checkout, página de resultado e consulta de pedidos.
- Área do participante com perfil, configurações, pedidos e ingressos.
- Páginas de termos, privacidade e solicitação de exclusão de conta.

### 4.2 Gestão de eventos e operação

- Cadastro, edição e consulta de eventos.
- Gestão de locais/venues.
- Cadastro e manutenção de tipos/lotes de ingresso, preço, quantidade e janela de venda.
- Consulta e gestão de pedidos, incluindo visualização de detalhes.
- Painel administrativo com indicadores, relatórios de vendas e receita e informações financeiras.
- Consulta de transações e acompanhamento de solicitações de saque/repasse.
- Configurações de empresa e conta bancária, convites e gestão de equipe e permissões.
- Exportação de lista de participantes, quando habilitada para o evento e perfil.

### 4.3 Check-in

- Leitura e validação do QR Code do ingresso.
- Verificação de validade e registro de check-in para evitar reutilização do mesmo ingresso.
- Consulta de estatísticas e histórico por evento.
- Recursos móveis para scanner e validação manual.
- Ações de check-in sujeitas a autenticação, autorização e permissões.

### 4.4 Aplicativo móvel

O aplicativo foi desenvolvido com React Native e Expo. O código inclui autenticação, navegação por áreas, descoberta e detalhes de eventos, carrinho, checkout, consulta de ingressos e pedidos, perfil e recursos de validação. Também existem telas e serviços para notificações, favoritos, localização, listas/promotores e configurações.

A publicação nas lojas, as permissões do dispositivo, o envio de notificações e a conexão com a API precisam ser configurados e validados no ambiente de distribuição escolhido. Alguns recursos podem depender de endpoints e integrações disponíveis no backend implantado.

## 5. Pagamentos e repasses

O backend contém integração com o provedor **Pagar.me** para operações de pagamento e webhooks de atualização. O checkout e o aplicativo incluem fluxos para meios de pagamento previstos no sistema, como cartão e PIX; a disponibilidade final depende da configuração da conta do provedor, credenciais, métodos habilitados e ambiente de teste ou produção.

O sistema também possui estrutura para divisão de valores entre plataforma e organizador, cadastro e verificação de conta do organizador, acompanhamento de saldo/transações e gestão de solicitações de saque. Percentuais e regras devem ser confirmados com o cliente e configurados de acordo com o contrato comercial e a conta do provedor.

**Importante:** não considerar pagamento real, liquidação, estorno ou prazo de repasse como operacional sem homologação ponta a ponta com credenciais e webhooks de produção. Um endpoint de simulação existe apenas para desenvolvimento e não representa uma confirmação financeira real.

## 6. Notificações e comunicação

O backend prevê envio de e-mails transacionais e lembretes. O serviço de e-mail pode usar Resend ou SMTP; sem configuração dessas credenciais, a implementação registra as mensagens no console em vez de entregá-las ao destinatário. O aplicativo contém infraestrutura para notificações locais/push, cuja entrega depende de configuração do Expo e das plataformas móveis.

Antes de produção, devem ser definidos remetente, domínio, conteúdo, política de consentimento, credenciais e comportamento esperado para confirmação de pedidos, entrega de ingresso, recuperação de conta e lembretes.

## 7. Fluxo do organizador

1. Acessa a área autenticada com perfil e permissões adequadas.
2. Cadastra o evento, local, informações de divulgação e ingressos/lotes.
3. Publica ou disponibiliza o evento conforme o fluxo de aprovação adotado.
4. Acompanha pedidos, vendas, participantes e indicadores.
5. Configura os dados da empresa e bancários necessários à operação financeira.
6. No dia do evento, a equipe autorizada valida ingressos e acompanha o histórico de acessos.
7. Consulta as informações de saldo, transações e repasses disponíveis.

## 8. Fluxo administrativo

O painel e a API oferecem recursos de visão geral, gestão de eventos e locais, consulta de pedidos, relatórios, finanças, transações, saques, permissões, usuários e equipe. Operações sensíveis, como aprovação/rejeição de saque e gestão de usuários, são reservadas ao perfil administrativo apropriado.

## 9. Arquitetura e tecnologia

```text
Participante / Organizador / Administrador
             │
       Web e aplicativo
             │ HTTPS / API REST
             ▼
      Backend Node.js + Express
        ├── PostgreSQL
        ├── Pagar.me (pagamentos/webhooks)
        ├── Resend ou SMTP (e-mails)
        └── serviços de monitoramento/configuração
```

- **Web:** Next.js, React, TypeScript e Tailwind CSS.
- **Aplicativo:** React Native, Expo e TypeScript.
- **API:** Node.js, Express e TypeScript; endpoints agrupados por autenticação, eventos, ingressos, carrinho, pedidos, check-in, administração e finanças.
- **Dados:** PostgreSQL, com acesso por `pg` e scripts de migração SQL no backend.
- **Integrações:** Pagar.me para pagamentos; Resend/SMTP para e-mail; Sentry disponível para monitoramento de erros.
- **Documentação técnica da API:** Swagger disponível em `/api/docs` no ambiente em que a API estiver publicada.

## 10. Segurança e privacidade

O projeto implementa autenticação por token, controle de acesso por perfil/permissão, proteção de rotas, validação de entradas, limitação de requisições, cabeçalhos de segurança, CORS configurável, proteção CSRF e registro de requisições. O fluxo de compra depende de dados pessoais e de pagamento tratados também pelo provedor externo.

Esses recursos de código não substituem a configuração segura de produção. É necessário usar HTTPS, guardar segredos fora do código, limitar origens autorizadas, restringir acesso ao banco e aos painéis, configurar retenção e descarte de dados e validar os textos legais e procedimentos de privacidade com o cliente.

## 11. Situação e dependências de implantação

O repositório contém implementação para web, aplicativo e API. O código disponível, por si só, não confirma que a solução esteja publicada, homologada ou pronta para transações reais. Para a entrada em produção, verificar pelo menos:

- Banco PostgreSQL criado, migrations aplicadas e backup/monitoramento configurados.
- API e web publicadas com domínios, HTTPS, CORS e variáveis de ambiente corretos.
- Chaves de produção do Pagar.me, webhooks e cenários de aprovação, falha, cancelamento e estorno homologados.
- Serviço de e-mail e domínio remetente autenticados e testados.
- Conta bancária/recebedores, regras de split e processo de repasse aprovados.
- Aplicativo apontando para a API de produção, builds assinados e publicação nas lojas concluída, se fizer parte do escopo.
- Perfis, permissões, políticas de privacidade/termos, suporte e procedimentos operacionais definidos.
- Testes de aceite com participantes, organizadores e operadores de check-in.

## 12. Limites a confirmar com o cliente

Os seguintes itens devem ser fechados durante o alinhamento de escopo e homologação:

- Quais métodos de pagamento serão oferecidos e em quais condições.
- Política de taxas, split, prazo de liberação, saque, cancelamento e reembolso.
- Se haverá moderação/aprovação de eventos antes de publicação.
- Quais dados serão obrigatórios no cadastro e na compra.
- Regras de transferência, cancelamento ou reemissão de ingressos e operação offline no acesso.
- Quais recursos móveis serão entregues na primeira versão e status de publicação nas lojas.
- Regras de suporte, atendimento e tratamento de solicitações de titulares de dados.
- Volumetria esperada, disponibilidade, retenção de dados, backups e níveis de serviço.

## 13. Glossário

| Termo | Significado |
|---|---|
| **Evento** | Atividade publicada para divulgação e venda de ingressos. |
| **Lote/tipo de ingresso** | Categoria comercial com preço, quantidade e período de venda próprios. |
| **Pedido** | Registro da compra e do respectivo estado de pagamento. |
| **QR Code** | Código digital associado ao ingresso e usado na validação de acesso. |
| **Check-in** | Registro de que um ingresso foi validado na entrada do evento. |
| **Split** | Regra de divisão dos valores entre organizador e plataforma. |
| **Webhook** | Notificação enviada pelo provedor para atualizar o estado de uma operação. |

## 14. Resumo para apresentação

**Lumera centraliza a jornada de eventos e ingressos:** o participante encontra eventos e compra online; o organizador administra eventos, vendas e acessos; e a administração acompanha usuários, pedidos e indicadores. A plataforma combina canais web e móvel com uma API central, emissão de ingressos digitais e integração de pagamentos. A operação comercial em produção depende da homologação do provedor de pagamento, configuração de e-mail, infraestrutura e regras acordadas com o cliente.
