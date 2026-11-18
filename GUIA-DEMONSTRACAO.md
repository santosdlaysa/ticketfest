# Guia de uso e demonstração — Lumera

**Roteiro prático para apresentar a plataforma**  
Atualizado em 18 de novembro de 2026

## 1. Acesso ao ambiente

O ambiente local está respondendo nestes endereços:

- **Sistema web:** http://localhost:3003
- **Entrar:** http://localhost:3003/auth/login
- **API:** http://localhost:3001/api
- **Saúde da API:** http://localhost:3001/api/health

O login exige conexão com a API. Se a página abrir mas não carregar eventos ou permitir autenticação, confira se os serviços web/API estão ativos e se o backend está conectado ao banco.

## 2. Acessos de demonstração

Consultei o banco ativo (`lumerafest`) e encontrei estas contas:

| Perfil | E-mail cadastrado | Situação da senha |
|---|---|---|
| Administrador | `admin.demo@lumera.example` | Senha temporária definida e login verificado. |
| Organizador | `demo+lumera-1795023659709@example.invalid` | Senha temporária definida e login verificado. |

As senhas são de uso interno do apresentador e foram fornecidas separadamente. Não as inclua em materiais enviados ao cliente. Como os domínios `.example` e `.invalid` são reservados para exemplos, o fluxo de recuperação por e-mail não é apropriado para essas contas.

Não use dados ou contas de produção em demonstração. Os logins foram validados no banco de demonstração e as contas ficam limitadas aos dados desse ambiente.

## 3. Roteiro sugerido (10 a 15 minutos)

### A. Apresentação pública (2 minutos)

1. Abra a página inicial.
2. Mostre a vitrine e a navegação para explorar eventos.
3. Abra a lista de eventos e utilize busca/categorias, se houver eventos publicados no banco.
4. Abra um evento para mostrar descrição, data, local e opções de ingresso.

**Mensagem para o cliente:** “O participante pode descobrir eventos e consultar as informações e opções de ingresso em um só lugar.”

### B. Jornada de compra (3 minutos)

1. Na página de um evento, selecione um tipo e quantidade de ingressos disponíveis.
2. Adicione ao carrinho e abra `/cart`.
3. Mostre os itens, quantidades e total.
4. Abra `/checkout` para apresentar os campos do comprador e meios de pagamento que o ambiente disponibiliza.
5. O checkout mostra um aviso de modo de demonstração: o cartão é aprovado automaticamente pela simulação e nenhum valor é cobrado. O código PIX é ilustrativo e não deve ser pago.
6. Apresente as áreas de pedidos e ingressos do participante em `/user/orders` e `/user/tickets` (exigem login).

### C. Área do organizador (3 a 4 minutos)

Entre por `/auth/login` usando uma conta de teste **ORGANIZER** autorizada. Depois, apresente:

1. **Dashboard** (`/admin`): visão de vendas e indicadores disponíveis para o organizador.
2. **Eventos** (`/admin/events`): lista e manutenção dos eventos permitidos para a conta; abra um evento para apresentar edição e ingressos/lotes.
3. **Pedidos** (`/admin/orders`): consulta de vendas e detalhes de pedidos do escopo do organizador.
4. **Relatórios/financeiro** (`/admin/reports`, `/admin/financials`): indicadores e informações disponíveis conforme permissões e dados existentes.
5. **Check-in** (`/admin/checkin`): selecione o evento e demonstre a validação de QR Code ou consulta manual, se habilitada.
6. **Configurações**: mostre dados da empresa/equipe e informações bancárias somente com dados fictícios ou previamente autorizados.

**Mensagem para o cliente:** “O organizador acompanha a operação do evento, as vendas e o acesso, dentro do escopo e das permissões da sua conta.”

### D. Área administrativa (3 a 4 minutos)

Entre por `/auth/login` usando uma conta **ADMIN** autorizada e mostre:

1. **Dashboard** (`/admin`): visão geral da operação.
2. **Eventos e locais** (`/admin/events`, `/admin/venues`): gestão do catálogo e dos espaços.
3. **Pedidos** (`/admin/orders`): consulta, detalhes e ações operacionais disponíveis.
4. **Relatórios, financeiro e transações** (`/admin/reports`, `/admin/financials`, `/admin/transactions`).
5. **Repasses** (`/admin/payouts`): consulta e gestão conforme permissões administrativas.
6. **Usuários e permissões** (`/admin/users`, `/admin/permissions`): governança de contas e acessos.
7. **Configurações** (`/admin/settings`): empresa e equipe.

Evite executar ações irreversíveis ou financeiras (reembolso, aprovação de saque, alteração de permissões) durante a apresentação. Use registros demonstrativos e explique o fluxo antes de qualquer ação.

## 4. App móvel

O aplicativo é desenvolvido com React Native/Expo. As telas implementadas incluem autenticação, eventos, carrinho, checkout, pedidos/ingressos, perfil e validação. Para apresentar o app, confirme antes que o build utilizado aponta para a mesma API do ambiente de demonstração e que o aparelho/emulador consegue alcançá-la. O acesso `localhost` de um celular físico não aponta para o computador; deve ser configurado o IP acessível na rede.

## 5. O que preparar antes da reunião

- Confirmar contas de teste **ADMIN** e **ORGANIZER** que realmente autenticam.
- Confirmar que há eventos publicados, lotes disponíveis e dados de venda de demonstração.
- Confirmar que o aviso de pagamento simulado aparece no checkout.
- Confirmar se e-mail, PIX, webhooks e repasses estão em modo de teste.
- Abrir e autenticar nas áreas restritas antes da reunião.
- Usar navegador em janela limpa e ocultar tokens, dados pessoais e informações bancárias.
- Separar uma gravação ou capturas de tela como plano alternativo.

## 6. Respostas rápidas para dúvidas

**O pagamento já está pronto para produção?**  
Não neste ambiente de demonstração. O checkout usa simulação local: cartão é aprovado sem cobrança e o PIX é apenas ilustrativo. Para produção, ainda são necessárias credenciais, recebedores, webhooks e homologação do Pagar.me.

**O check-in impede reutilização do ingresso?**  
O fluxo de validação registra check-in e permite consultar histórico/estatísticas. A demonstração deve usar ingresso de teste e equipe autorizada.

**O organizador vê todos os eventos?**  
O acesso a operações é limitado por perfil, permissões e vínculo do organizador com o evento.

**O sistema envia e-mails e notificações?**  
Há infraestrutura de e-mail e notificações, mas a entrega depende das credenciais e configuração do ambiente.

## 7. Fechamento da apresentação

“A Lumera reúne descoberta de eventos, venda de ingressos, gestão operacional e validação de acesso em canais web e móvel. A configuração final de pagamentos, comunicações e regras de operação é alinhada com o cliente e homologada no ambiente de produção.”
