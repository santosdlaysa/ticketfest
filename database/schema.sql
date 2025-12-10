-- =========================================
-- TICKETFEST - Script de Criação do Banco de Dados
-- Sistema de Venda de Ingressos com Split de Pagamento
-- =========================================

-- Criar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- ENUMS
-- =========================================

-- Papel do usuário
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'ORGANIZER');

-- Status do evento
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- Status do pagamento
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- Status do pedido
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- Método de pagamento
CREATE TYPE payment_method AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO');

-- Tipo de desconto
CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED');

-- Tipo de conta bancária
CREATE TYPE account_type AS ENUM ('CHECKING', 'SAVINGS');

-- Tipo de titular
CREATE TYPE holder_type AS ENUM ('INDIVIDUAL', 'COMPANY');

-- Status do split
CREATE TYPE split_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Status do saque
CREATE TYPE payout_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Método de saque
CREATE TYPE payout_method AS ENUM ('BANK_TRANSFER', 'PIX');

-- =========================================
-- TABELAS
-- =========================================

-- -----------------------------------------
-- 1. USUÁRIOS E AUTENTICAÇÃO
-- -----------------------------------------

-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_cpf ON users(cpf);

-- Tabela de refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(500) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- -----------------------------------------
-- 2. EVENTOS
-- -----------------------------------------

-- Tabela de eventos
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    images TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    status event_status NOT NULL DEFAULT 'DRAFT',
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para eventos
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);

-- -----------------------------------------
-- 3. INGRESSOS
-- -----------------------------------------

-- Tabela de tipos de ingressos
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
    sales_start TIMESTAMP WITH TIME ZONE NOT NULL,
    sales_end TIMESTAMP WITH TIME ZONE NOT NULL,
    features TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_sales_dates CHECK (sales_end > sales_start),
    CONSTRAINT check_sold_quantity CHECK (sold <= quantity)
);

-- Índice para ingressos
CREATE INDEX idx_tickets_event_id ON tickets(event_id);

-- -----------------------------------------
-- 4. PEDIDOS E ITENS DE PEDIDO
-- -----------------------------------------

-- Tabela de pedidos
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    payment_method payment_method,
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    payment_id VARCHAR(255),
    status order_status NOT NULL DEFAULT 'PENDING',
    coupon_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Índices para pedidos
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_event_id ON orders(event_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Tabela de itens do pedido
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para itens do pedido
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_ticket_id ON order_items(ticket_id);

-- -----------------------------------------
-- 5. INSTÂNCIAS DE INGRESSOS (QR Code)
-- -----------------------------------------

-- Tabela de instâncias de ingressos
CREATE TABLE ticket_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    qr_code VARCHAR(255) NOT NULL UNIQUE,
    qr_code_data TEXT NOT NULL,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    transferred_to VARCHAR(255),
    transferred_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para instâncias de ingressos
CREATE INDEX idx_ticket_instances_qr_code ON ticket_instances(qr_code);
CREATE INDEX idx_ticket_instances_order_item_id ON ticket_instances(order_item_id);
CREATE INDEX idx_ticket_instances_ticket_id ON ticket_instances(ticket_id);
CREATE INDEX idx_ticket_instances_checked_in ON ticket_instances(checked_in);

-- -----------------------------------------
-- 6. CARRINHO DE COMPRAS
-- -----------------------------------------

-- Tabela de carrinhos
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Índices para carrinhos
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_carts_expires_at ON carts(expires_at);

-- Tabela de itens do carrinho
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, ticket_id)
);

-- Índice para itens do carrinho
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_ticket_id ON cart_items(ticket_id);

-- -----------------------------------------
-- 7. CUPONS DE DESCONTO
-- -----------------------------------------

-- Tabela de cupons
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    min_purchase DECIMAL(10, 2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_coupon_dates CHECK (valid_until > valid_from),
    CONSTRAINT check_coupon_uses CHECK (max_uses IS NULL OR used_count <= max_uses),
    CONSTRAINT check_percentage_value CHECK (
        discount_type != 'PERCENTAGE' OR (discount_value > 0 AND discount_value <= 100)
    )
);

-- Índices para cupons
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_event_id ON coupons(event_id);
CREATE INDEX idx_coupons_active ON coupons(active);

-- -----------------------------------------
-- 8. SPLIT DE PAGAMENTO
-- -----------------------------------------

-- Tabela de contas de organizadores
CREATE TABLE organizer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Dados bancários
    bank_code VARCHAR(10),
    bank_name VARCHAR(100),
    account_type account_type,
    account_number VARCHAR(20),
    account_digit VARCHAR(5),
    agency_number VARCHAR(10),
    agency_digit VARCHAR(5),

    -- Dados do titular
    holder_name VARCHAR(255),
    holder_document VARCHAR(20),
    holder_type holder_type,

    -- IDs de gateways externos
    stripe_account_id VARCHAR(255) UNIQUE,
    pagarme_recipient_id VARCHAR(255) UNIQUE,
    mercado_pago_user_id VARCHAR(255) UNIQUE,
    asaas_wallet_id VARCHAR(255) UNIQUE,

    -- Saldos
    available_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    pending_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para contas de organizadores
CREATE INDEX idx_organizer_accounts_user_id ON organizer_accounts(user_id);
CREATE INDEX idx_organizer_accounts_verified ON organizer_accounts(verified);

-- Tabela de regras de split
CREATE TABLE split_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id) ON DELETE RESTRICT,

    -- Porcentagens (devem somar 100%)
    platform_percentage DECIMAL(5, 2) NOT NULL CHECK (platform_percentage >= 0 AND platform_percentage <= 100),
    organizer_percentage DECIMAL(5, 2) NOT NULL CHECK (organizer_percentage >= 0 AND organizer_percentage <= 100),
    platform_fixed_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (platform_fixed_fee >= 0),

    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_split_percentages CHECK (platform_percentage + organizer_percentage = 100)
);

-- Índices para regras de split
CREATE INDEX idx_split_rules_event_id ON split_rules(event_id);
CREATE INDEX idx_split_rules_organizer_account_id ON split_rules(organizer_account_id);

-- Tabela de transações de split
CREATE TABLE split_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    split_rule_id UUID NOT NULL REFERENCES split_rules(id) ON DELETE RESTRICT,
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id) ON DELETE RESTRICT,

    -- Valores calculados
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    platform_amount DECIMAL(12, 2) NOT NULL CHECK (platform_amount >= 0),
    organizer_amount DECIMAL(12, 2) NOT NULL CHECK (organizer_amount >= 0),
    platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),

    status split_status NOT NULL DEFAULT 'PENDING',
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para transações de split
CREATE INDEX idx_split_transactions_order_id ON split_transactions(order_id);
CREATE INDEX idx_split_transactions_split_rule_id ON split_transactions(split_rule_id);
CREATE INDEX idx_split_transactions_organizer_account_id ON split_transactions(organizer_account_id);
CREATE INDEX idx_split_transactions_status ON split_transactions(status);

-- Tabela de saques
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id) ON DELETE RESTRICT,

    -- Valores
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
    net_amount DECIMAL(12, 2) NOT NULL CHECK (net_amount >= 0),

    status payout_status NOT NULL DEFAULT 'PENDING',
    payout_method payout_method NOT NULL,

    -- Snapshot dos dados bancários no momento da solicitação
    bank_code VARCHAR(10),
    account_number VARCHAR(20),
    agency_number VARCHAR(10),
    pix_key VARCHAR(255),

    external_id VARCHAR(255),

    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT
);

-- Índices para saques
CREATE INDEX idx_payouts_organizer_account_id ON payouts(organizer_account_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_requested_at ON payouts(requested_at);

-- -----------------------------------------
-- 9. LISTAS DE PROMOTERS
-- -----------------------------------------

-- Tabela de listas de promoters
CREATE TABLE promoter_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    promoter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'VIP', 'DISCOUNT', 'GUEST', etc.
    max_entries INTEGER,
    discount_percentage DECIMAL(5, 2) CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100)),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para listas de promoters
CREATE INDEX idx_promoter_lists_event_id ON promoter_lists(event_id);
CREATE INDEX idx_promoter_lists_promoter_id ON promoter_lists(promoter_id);
CREATE INDEX idx_promoter_lists_active ON promoter_lists(active);

-- Tabela de itens das listas de promoters
CREATE TABLE list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES promoter_lists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    phone VARCHAR(20),
    email VARCHAR(255),
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para itens das listas
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_list_items_cpf ON list_items(cpf);
CREATE INDEX idx_list_items_checked_in ON list_items(checked_in);

-- -----------------------------------------
-- 10. LOG DE AUDITORIA
-- -----------------------------------------

-- Tabela de log de auditoria
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    previous_data JSONB,
    new_data JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para log de auditoria
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- -----------------------------------------
-- 11. LOG DE AÇÕES DOS PROMOTERS
-- -----------------------------------------

-- Tabela de log de ações dos promoters
CREATE TABLE list_action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES promoter_lists(id) ON DELETE CASCADE,
    list_item_id UUID REFERENCES list_items(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL, -- 'ADD', 'REMOVE', 'CHECK_IN', 'EDIT'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para log de ações
CREATE INDEX idx_list_action_logs_list_id ON list_action_logs(list_id);
CREATE INDEX idx_list_action_logs_user_id ON list_action_logs(user_id);
CREATE INDEX idx_list_action_logs_created_at ON list_action_logs(created_at);

-- =========================================
-- TRIGGERS PARA UPDATED_AT
-- =========================================

-- Função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabela com updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizer_accounts_updated_at
    BEFORE UPDATE ON organizer_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_split_rules_updated_at
    BEFORE UPDATE ON split_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promoter_lists_updated_at
    BEFORE UPDATE ON promoter_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- VIEWS ÚTEIS
-- =========================================

-- View de eventos com contagem de ingressos vendidos
CREATE VIEW v_events_with_sales AS
SELECT
    e.*,
    COALESCE(SUM(t.sold), 0) AS total_tickets_sold,
    COALESCE(SUM(t.quantity), 0) AS total_tickets_available,
    COALESCE(SUM(t.sold * t.price), 0) AS total_revenue
FROM events e
LEFT JOIN tickets t ON t.event_id = e.id
GROUP BY e.id;

-- View de balanço dos organizadores
CREATE VIEW v_organizer_balances AS
SELECT
    oa.id,
    oa.user_id,
    u.name AS organizer_name,
    u.email AS organizer_email,
    oa.available_balance,
    oa.pending_balance,
    oa.available_balance + oa.pending_balance AS total_balance,
    oa.verified,
    COUNT(DISTINCT e.id) AS total_events,
    COALESCE(SUM(st.organizer_amount) FILTER (WHERE st.status = 'COMPLETED'), 0) AS total_earned
FROM organizer_accounts oa
JOIN users u ON u.id = oa.user_id
LEFT JOIN split_rules sr ON sr.organizer_account_id = oa.id
LEFT JOIN events e ON e.id = sr.event_id
LEFT JOIN split_transactions st ON st.organizer_account_id = oa.id
GROUP BY oa.id, u.id;

-- View de pedidos com detalhes
CREATE VIEW v_orders_detailed AS
SELECT
    o.*,
    u.name AS user_name,
    u.email AS user_email,
    e.name AS event_name,
    e.date AS event_date,
    COUNT(oi.id) AS total_items,
    SUM(oi.quantity) AS total_tickets
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN events e ON e.id = o.event_id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, u.id, e.id;

-- =========================================
-- COMENTÁRIOS NAS TABELAS
-- =========================================

COMMENT ON TABLE users IS 'Tabela de usuários do sistema';
COMMENT ON TABLE refresh_tokens IS 'Tokens de refresh para autenticação JWT';
COMMENT ON TABLE events IS 'Eventos cadastrados na plataforma';
COMMENT ON TABLE tickets IS 'Tipos de ingressos disponíveis para cada evento';
COMMENT ON TABLE orders IS 'Pedidos de compra de ingressos';
COMMENT ON TABLE order_items IS 'Itens individuais de cada pedido';
COMMENT ON TABLE ticket_instances IS 'Ingressos individuais com QR Code para check-in';
COMMENT ON TABLE carts IS 'Carrinhos de compra temporários';
COMMENT ON TABLE cart_items IS 'Itens do carrinho de compras';
COMMENT ON TABLE coupons IS 'Cupons de desconto';
COMMENT ON TABLE organizer_accounts IS 'Contas bancárias dos organizadores para recebimento';
COMMENT ON TABLE split_rules IS 'Regras de divisão de receita entre plataforma e organizador';
COMMENT ON TABLE split_transactions IS 'Transações de split para cada pedido';
COMMENT ON TABLE payouts IS 'Solicitações de saque dos organizadores';
COMMENT ON TABLE promoter_lists IS 'Listas de convidados gerenciadas por promoters';
COMMENT ON TABLE list_items IS 'Pessoas nas listas de promoters';
COMMENT ON TABLE audit_logs IS 'Log de auditoria para transações financeiras';
COMMENT ON TABLE list_action_logs IS 'Log de ações realizadas em listas de promoters';

-- =========================================
-- FIM DO SCRIPT
-- =========================================
