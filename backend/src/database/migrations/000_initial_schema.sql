-- =====================================================
-- LUMERA - COMPLETE DATABASE SCHEMA
-- Generated: 2024-12-26
-- Description: Full schema documentation for production
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'ORGANIZER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('CHECKING', 'SAVINGS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE holder_type AS ENUM ('INDIVIDUAL', 'COMPANY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_method AS ENUM ('BANK_TRANSFER', 'PIX');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE split_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLE: users
-- Description: System users (customers, organizers, admins)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) UNIQUE,  -- Encrypted data requires larger size
    phone VARCHAR(255),       -- Encrypted data requires larger size
    role user_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- TABLE: refresh_tokens
-- Description: JWT refresh tokens for authentication
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- =====================================================
-- TABLE: events
-- Description: Events created by organizers
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    images TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    status event_status NOT NULL DEFAULT 'DRAFT',
    organizer_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);

-- =====================================================
-- TABLE: tickets
-- Description: Ticket types for events
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    sold INTEGER NOT NULL DEFAULT 0,
    sales_start TIMESTAMP WITH TIME ZONE NOT NULL,
    sales_end TIMESTAMP WITH TIME ZONE NOT NULL,
    features TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);

-- =====================================================
-- TABLE: orders
-- Description: Customer orders
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    subtotal NUMERIC NOT NULL,
    discount NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL,
    payment_method payment_method,
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    payment_id VARCHAR(255),
    status order_status NOT NULL DEFAULT 'PENDING',
    coupon_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- =====================================================
-- TABLE: order_items
-- Description: Items within an order
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_ticket_id ON order_items(ticket_id);

-- =====================================================
-- TABLE: ticket_instances
-- Description: Individual ticket instances with QR codes
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    transferred_to VARCHAR(255),
    transferred_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_instances_order_item_id ON ticket_instances(order_item_id);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_ticket_id ON ticket_instances(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_qr_code ON ticket_instances(qr_code);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_checked_in ON ticket_instances(checked_in);

-- =====================================================
-- TABLE: carts
-- Description: Shopping carts (session or user based)
-- =====================================================
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);

-- =====================================================
-- TABLE: cart_items
-- Description: Items in a cart
-- =====================================================
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- =====================================================
-- TABLE: coupons
-- Description: Discount coupons
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value NUMERIC NOT NULL,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    min_purchase NUMERIC,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_event_id ON coupons(event_id);

-- =====================================================
-- TABLE: event_reminders
-- Description: Track sent reminders to avoid duplicates
-- =====================================================
CREATE TABLE IF NOT EXISTS event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('HOURS_24', 'HOURS_2')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_order_id ON event_reminders(order_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON event_reminders(event_id);

-- =====================================================
-- TABLE: organizer_accounts
-- Description: Organizer payment accounts for payouts
-- =====================================================
CREATE TABLE IF NOT EXISTS organizer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    -- Bank account info
    bank_code VARCHAR(10),
    bank_name VARCHAR(100),
    account_type account_type,
    account_number VARCHAR(20),
    account_digit VARCHAR(5),
    agency_number VARCHAR(10),
    agency_digit VARCHAR(5),
    holder_name VARCHAR(255),
    holder_document VARCHAR(20),
    holder_type holder_type,
    -- Payment gateway IDs
    stripe_account_id VARCHAR(255) UNIQUE,
    pagarme_recipient_id VARCHAR(255) UNIQUE,
    mercado_pago_user_id VARCHAR(255) UNIQUE,
    asaas_wallet_id VARCHAR(255) UNIQUE,
    -- Balances
    available_balance NUMERIC NOT NULL DEFAULT 0,
    pending_balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizer_accounts_user_id ON organizer_accounts(user_id);

-- =====================================================
-- TABLE: payouts
-- Description: Payout requests from organizers
-- =====================================================
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id),
    amount NUMERIC NOT NULL,
    fee NUMERIC NOT NULL DEFAULT 0,
    net_amount NUMERIC NOT NULL,
    status payout_status NOT NULL DEFAULT 'PENDING',
    payout_method payout_method NOT NULL,
    bank_code VARCHAR(10),
    account_number VARCHAR(20),
    agency_number VARCHAR(10),
    pix_key VARCHAR(255),
    external_id VARCHAR(255),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_payouts_organizer_account_id ON payouts(organizer_account_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- =====================================================
-- TABLE: split_rules
-- Description: Payment split rules per event
-- =====================================================
CREATE TABLE IF NOT EXISTS split_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id),
    platform_percentage NUMERIC NOT NULL,
    organizer_percentage NUMERIC NOT NULL,
    platform_fixed_fee NUMERIC NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_split_rules_event_id ON split_rules(event_id);

-- =====================================================
-- TABLE: split_transactions
-- Description: Individual split transactions per order
-- =====================================================
CREATE TABLE IF NOT EXISTS split_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    split_rule_id UUID NOT NULL REFERENCES split_rules(id),
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id),
    total_amount NUMERIC NOT NULL,
    platform_amount NUMERIC NOT NULL,
    organizer_amount NUMERIC NOT NULL,
    platform_fee NUMERIC NOT NULL DEFAULT 0,
    status split_status NOT NULL DEFAULT 'PENDING',
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_split_transactions_order_id ON split_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_split_transactions_organizer_account_id ON split_transactions(organizer_account_id);
CREATE INDEX IF NOT EXISTS idx_split_transactions_status ON split_transactions(status);

-- =====================================================
-- TABLE: promoter_lists
-- Description: Promoter guest lists for events
-- =====================================================
CREATE TABLE IF NOT EXISTS promoter_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    promoter_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    max_entries INTEGER,
    max_items INTEGER NOT NULL DEFAULT 50,
    current_items INTEGER NOT NULL DEFAULT 0,
    discount_percentage NUMERIC,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promoter_lists_event_id ON promoter_lists(event_id);
CREATE INDEX IF NOT EXISTS idx_promoter_lists_promoter_id ON promoter_lists(promoter_id);

-- =====================================================
-- TABLE: list_items
-- Description: Items/guests in promoter lists
-- =====================================================
CREATE TABLE IF NOT EXISTS list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES promoter_lists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(255),    -- Encrypted data requires larger size
    phone VARCHAR(255),  -- Encrypted data requires larger size
    email VARCHAR(255),
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);

-- =====================================================
-- TABLE: list_action_logs
-- Description: Audit log for promoter list actions
-- =====================================================
CREATE TABLE IF NOT EXISTS list_action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES promoter_lists(id) ON DELETE CASCADE,
    list_item_id UUID REFERENCES list_items(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_list_action_logs_list_id ON list_action_logs(list_id);

-- =====================================================
-- TABLE: audit_logs
-- Description: System-wide audit logging
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    previous_data JSONB,
    new_data JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Events with sales statistics
CREATE OR REPLACE VIEW v_events_with_sales AS
SELECT
    e.*,
    COALESCE(SUM(t.sold), 0) as total_tickets_sold,
    COALESCE(SUM(t.quantity), 0) as total_tickets_available,
    COALESCE(SUM(t.sold * t.price), 0) as total_revenue
FROM events e
LEFT JOIN tickets t ON e.id = t.event_id
GROUP BY e.id;

-- View: Orders with user and event details
CREATE OR REPLACE VIEW v_orders_detailed AS
SELECT
    o.*,
    u.name as user_name,
    u.email as user_email,
    e.name as event_name,
    e.date as event_date,
    COUNT(oi.id) as total_items,
    SUM(oi.quantity) as total_tickets
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN events e ON o.event_id = e.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.name, u.email, e.name, e.date;

-- View: Organizer balances summary
CREATE OR REPLACE VIEW v_organizer_balances AS
SELECT
    oa.*,
    u.name as organizer_name,
    u.email as organizer_email,
    oa.available_balance + oa.pending_balance as total_balance,
    COUNT(DISTINCT e.id) as total_events,
    COALESCE(SUM(st.organizer_amount), 0) as total_earned
FROM organizer_accounts oa
JOIN users u ON oa.user_id = u.id
LEFT JOIN events e ON e.organizer_id = u.id
LEFT JOIN split_transactions st ON oa.id = st.organizer_account_id AND st.status = 'COMPLETED'
GROUP BY oa.id, u.name, u.email;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
