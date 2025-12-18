-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE role AS ENUM ('USER', 'ADMIN', 'ORGANIZER');
CREATE TYPE team_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE pix_key_type AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM');
CREATE TYPE account_type AS ENUM ('CHECKING', 'SAVINGS');
CREATE TYPE holder_type AS ENUM ('INDIVIDUAL', 'COMPANY');
CREATE TYPE split_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE payout_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE payout_method AS ENUM ('BANK_TRANSFER', 'PIX');
CREATE TYPE reminder_type AS ENUM ('HOURS_24', 'HOURS_2');

-- ============================================
-- USER & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    phone VARCHAR(20),
    role role DEFAULT 'USER' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- ============================================
-- VENUES
-- ============================================

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    capacity INTEGER,
    description TEXT,
    images TEXT[] DEFAULT '{}',
    phone VARCHAR(20),
    email VARCHAR(255),
    organizer_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_venues_organizer_id ON venues(organizer_id);

-- ============================================
-- EVENTS
-- ============================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    venue_id UUID REFERENCES venues(id),
    images TEXT[] DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    status event_status DEFAULT 'DRAFT' NOT NULL,
    organizer_id UUID NOT NULL REFERENCES users(id),
    rules TEXT,
    age_restriction INTEGER,
    dress_code VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_venue_id ON events(venue_id);

-- ============================================
-- TICKETS
-- ============================================

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DOUBLE PRECISION NOT NULL,
    quantity INTEGER NOT NULL,
    sold INTEGER DEFAULT 0 NOT NULL,
    sales_start TIMESTAMP NOT NULL,
    sales_end TIMESTAMP NOT NULL,
    features TEXT[] DEFAULT '{}',
    use_batches BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tickets_event_id ON tickets(event_id);

CREATE TABLE ticket_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    quantity INTEGER NOT NULL,
    sold INTEGER DEFAULT 0 NOT NULL,
    sales_start TIMESTAMP NOT NULL,
    sales_end TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    "order" INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ticket_batches_ticket_id ON ticket_batches(ticket_id);
CREATE INDEX idx_ticket_batches_sales ON ticket_batches(sales_start, sales_end);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    subtotal DOUBLE PRECISION NOT NULL,
    discount DOUBLE PRECISION DEFAULT 0 NOT NULL,
    total DOUBLE PRECISION NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status payment_status DEFAULT 'PENDING' NOT NULL,
    payment_id VARCHAR(255),
    status order_status DEFAULT 'PENDING' NOT NULL,
    coupon_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    paid_at TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_event_id ON orders(event_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    quantity INTEGER NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- TICKET INSTANCES
-- ============================================

CREATE TABLE ticket_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    checked_in BOOLEAN DEFAULT FALSE NOT NULL,
    checked_in_at TIMESTAMP,
    transferred_to VARCHAR(255),
    transferred_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ticket_instances_qr_code ON ticket_instances(qr_code);

-- ============================================
-- CART
-- ============================================

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- COUPONS
-- ============================================

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    discount_type discount_type NOT NULL,
    discount_value DOUBLE PRECISION NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0 NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    event_id UUID,
    min_purchase DOUBLE PRECISION,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- ORGANIZER ACCOUNTS
-- ============================================

CREATE TABLE organizer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_at TIMESTAMP,
    company_name VARCHAR(255),
    trading_name VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    company_email VARCHAR(255),
    company_phone VARCHAR(20),
    company_address VARCHAR(500),
    company_city VARCHAR(100),
    company_state VARCHAR(50),
    company_zip_code VARCHAR(20),
    tax_regime VARCHAR(100),
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
    pix_key_type pix_key_type,
    pix_key VARCHAR(255),
    stripe_account_id VARCHAR(255) UNIQUE,
    pagarme_recipient_id VARCHAR(255) UNIQUE,
    mercadopago_user_id VARCHAR(255) UNIQUE,
    asaas_wallet_id VARCHAR(255) UNIQUE,
    available_balance DOUBLE PRECISION DEFAULT 0 NOT NULL,
    pending_balance DOUBLE PRECISION DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- TEAM MEMBERS
-- ============================================

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role team_role DEFAULT 'MEMBER' NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    invited_email VARCHAR(255),
    invited_at TIMESTAMP DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(organizer_account_id, user_id)
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- ============================================
-- SPLIT RULES
-- ============================================

CREATE TABLE split_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id),
    platform_percentage DOUBLE PRECISION NOT NULL,
    organizer_percentage DOUBLE PRECISION NOT NULL,
    platform_fixed_fee DOUBLE PRECISION DEFAULT 0 NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- SPLIT TRANSACTIONS
-- ============================================

CREATE TABLE split_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    split_rule_id UUID NOT NULL REFERENCES split_rules(id),
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id),
    total_amount DOUBLE PRECISION NOT NULL,
    platform_amount DOUBLE PRECISION NOT NULL,
    organizer_amount DOUBLE PRECISION NOT NULL,
    platform_fee DOUBLE PRECISION DEFAULT 0 NOT NULL,
    status split_status DEFAULT 'PENDING' NOT NULL,
    external_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMP
);

CREATE INDEX idx_split_transactions_order_id ON split_transactions(order_id);
CREATE INDEX idx_split_transactions_organizer_account_id ON split_transactions(organizer_account_id);
CREATE INDEX idx_split_transactions_status ON split_transactions(status);

-- ============================================
-- PAYOUTS
-- ============================================

CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id),
    amount DOUBLE PRECISION NOT NULL,
    fee DOUBLE PRECISION DEFAULT 0 NOT NULL,
    net_amount DOUBLE PRECISION NOT NULL,
    status payout_status DEFAULT 'PENDING' NOT NULL,
    payout_method payout_method NOT NULL,
    bank_code VARCHAR(10),
    account_number VARCHAR(20),
    agency_number VARCHAR(10),
    external_id VARCHAR(255),
    requested_at TIMESTAMP DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT
);

CREATE INDEX idx_payouts_organizer_account_id ON payouts(organizer_account_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ============================================
-- EVENT REMINDERS
-- ============================================

CREATE TABLE event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reminder_type reminder_type NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(order_id, reminder_type)
);

CREATE INDEX idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX idx_event_reminders_user_id ON event_reminders(user_id);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id UUID,
    previous_data JSONB,
    new_data JSONB,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
