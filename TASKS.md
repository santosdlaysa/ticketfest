# TicketFest - Tarefas Pendentes

## Status Geral: 70% Completo

---

## CLIENTE (Comprador)

### Prioridade Alta
- [x] **TASK-001**: Garantir envio de email com ingresso e QR Code funcionando
- [x] **TASK-002**: Email de lembrete antes do evento (24h e 2h antes)
- [x] **TASK-003**: Pagina "Meus Ingressos" com QR Code visivel

### Prioridade Media
- [ ] **TASK-004**: Lista de espera para eventos esgotados
- [ ] **TASK-005**: Historico de eventos frequentados
- [ ] **TASK-006**: Favoritos/eventos salvos
- [ ] **TASK-007**: Busca avancada com filtros (data, preco, localizacao)

---

## EMPRESA (Organizador)

### Prioridade Alta
- [x] **TASK-010**: UI de reembolso no admin (botao na pagina do pedido)
- [x] **TASK-011**: Botao "Reenviar Email" na pagina de detalhes do pedido
- [x] **TASK-012**: Exportar lista de participantes (CSV/Excel)
- [x] **TASK-013**: Dashboard de vendas em tempo real
- [ ] **TASK-014**: Relatorios financeiros detalhados

### Prioridade Media
- [ ] **TASK-015**: Duplicar evento (criar a partir de template)
- [ ] **TASK-016**: Envio de email marketing para compradores do evento
- [ ] **TASK-017**: Gestao de equipe (varios usuarios por organizador)
- [ ] **TASK-018**: Cancelamento de evento com reembolso automatico

### Prioridade Baixa
- [ ] **TASK-019**: Analytics demografico dos compradores
- [ ] **TASK-020**: Previsao de receita

---

## ADMIN (Plataforma)

### Prioridade Alta
- [ ] **TASK-030**: Moderacao de eventos (aprovar antes de publicar)
- [ ] **TASK-031**: Gestao de usuarios (listar, suspender, banir)
- [ ] **TASK-032**: Painel de monitoramento da plataforma
- [ ] **TASK-033**: Reconciliacao de pagamentos com gateway

### Prioridade Media
- [ ] **TASK-034**: Sistema de suporte (tickets)
- [ ] **TASK-035**: Configuracao de taxas por organizador
- [ ] **TASK-036**: Codigos promocionais da plataforma
- [ ] **TASK-037**: Broadcast de mensagens para usuarios

---

## INFRAESTRUTURA

### Prioridade Alta
- [ ] **TASK-040**: Testes automatizados (unit e E2E)
- [ ] **TASK-041**: Monitoramento de erros (Sentry)
- [ ] **TASK-042**: Cache com Redis
- [ ] **TASK-043**: Rate limiting
- [ ] **TASK-044**: 2FA/MFA para login

### Prioridade Media
- [ ] **TASK-045**: CDN para imagens
- [ ] **TASK-046**: Backup automatico
- [ ] **TASK-047**: Logs estruturados
- [ ] **TASK-048**: Health checks detalhados

---

## APP MOBILE

### Prioridade Alta
- [ ] **TASK-050**: Completar tela de Meus Ingressos
- [ ] **TASK-051**: Completar tela de Detalhes do Ingresso
- [ ] **TASK-052**: Completar fluxo de pagamento
- [ ] **TASK-053**: Integrar scanner QR Code para check-in

### Prioridade Media
- [ ] **TASK-054**: Push notifications
- [ ] **TASK-055**: Modo offline (cache de ingressos)
- [ ] **TASK-056**: Autenticacao biometrica

---

## Historico de Conclusao

| Task | Descricao | Data | Status |
|------|-----------|------|--------|
| - | Integracao Pagar.me (PIX, Cartao) | 2024-12-11 | Concluido |
| - | Admin sidebar e paginas | 2024-12-11 | Concluido |
| - | Gestao de pedidos admin | 2024-12-11 | Concluido |
| TASK-001 | Email com ingresso e QR Code melhorado | 2024-12-11 | Concluido |
| TASK-010 | UI de reembolso no admin (ja existia) | 2024-12-11 | Concluido |
| TASK-011 | Botao reenviar email (ja existia, melhorado) | 2024-12-11 | Concluido |
| TASK-012 | Exportar lista de participantes (CSV) | 2024-12-11 | Concluido |
| TASK-003 | Pagina Meus Ingressos com QR Code | 2024-12-11 | Concluido |
| TASK-002 | Email lembrete 24h e 2h antes do evento | 2024-12-11 | Concluido |
| TASK-013 | Dashboard de vendas em tempo real | 2024-12-11 | Concluido |

---

## Notas

- **Sem transferencia de ingressos** - Decisao de produto
- **Ingresso por email** - Nao tera download PDF, apenas email com QR Code
- **Pagar.me** - Gateway de pagamento principal (PIX e Cartao)
