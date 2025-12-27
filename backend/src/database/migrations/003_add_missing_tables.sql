-- =====================================================
-- MIGRATION: Add missing tables for production
-- Date: 2024-12-26
-- =====================================================

-- =====================================================
-- TABLE: password_reset_tokens
-- Description: Tokens for password recovery
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- =====================================================
-- TABLE: venues
-- Description: Event venues/locations
-- =====================================================
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venues_organizer_id ON venues(organizer_id);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);

-- Add venue_id to events if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'venue_id'
    ) THEN
        ALTER TABLE events ADD COLUMN venue_id UUID REFERENCES venues(id);
        CREATE INDEX idx_events_venue_id ON events(venue_id);
    END IF;
END $$;

-- =====================================================
-- TABLE: ticket_batches
-- Description: Ticket batches/lots with different prices
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    sold INTEGER NOT NULL DEFAULT 0,
    sales_start TIMESTAMP WITH TIME ZONE NOT NULL,
    sales_end TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_batches_ticket_id ON ticket_batches(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_batches_sales ON ticket_batches(sales_start, sales_end);

-- Add use_batches column to tickets if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tickets' AND column_name = 'use_batches'
    ) THEN
        ALTER TABLE tickets ADD COLUMN use_batches BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- =====================================================
-- ENUM: team_role
-- =====================================================
DO $$ BEGIN
    CREATE TYPE team_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLE: team_members
-- Description: Team members for organizer accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_account_id UUID NOT NULL REFERENCES organizer_accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'MEMBER',
    permissions TEXT[] DEFAULT '{}',
    invited_email VARCHAR(255),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organizer_account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_organizer_account_id ON team_members(organizer_account_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- =====================================================
-- TABLE: permissions
-- Description: Available system permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

-- =====================================================
-- TABLE: user_permissions
-- Description: User-specific permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);

-- =====================================================
-- Insert default permissions
-- =====================================================
INSERT INTO permissions (code, name, description, module) VALUES
    -- Dashboard
    ('dashboard:view', 'Visualizar Dashboard', 'Permite visualizar o dashboard', 'dashboard'),

    -- Events
    ('events:view', 'Visualizar Eventos', 'Permite visualizar eventos', 'events'),
    ('events:create', 'Criar Eventos', 'Permite criar novos eventos', 'events'),
    ('events:edit', 'Editar Eventos', 'Permite editar eventos existentes', 'events'),
    ('events:delete', 'Excluir Eventos', 'Permite excluir eventos', 'events'),
    ('events:publish', 'Publicar Eventos', 'Permite publicar eventos', 'events'),

    -- Orders
    ('orders:view', 'Visualizar Pedidos', 'Permite visualizar pedidos', 'orders'),
    ('orders:manage', 'Gerenciar Pedidos', 'Permite gerenciar pedidos', 'orders'),
    ('orders:refund', 'Reembolsar Pedidos', 'Permite processar reembolsos', 'orders'),

    -- Tickets
    ('tickets:view', 'Visualizar Ingressos', 'Permite visualizar ingressos', 'tickets'),
    ('tickets:create', 'Criar Ingressos', 'Permite criar tipos de ingressos', 'tickets'),
    ('tickets:edit', 'Editar Ingressos', 'Permite editar ingressos', 'tickets'),

    -- Check-in
    ('checkin:view', 'Visualizar Check-in', 'Permite visualizar estatisticas de check-in', 'checkin'),
    ('checkin:perform', 'Realizar Check-in', 'Permite realizar check-in de participantes', 'checkin'),

    -- Financial
    ('financial:view', 'Visualizar Financeiro', 'Permite visualizar dados financeiros', 'financial'),
    ('financial:payout', 'Solicitar Saque', 'Permite solicitar saques', 'financial'),

    -- Team
    ('team:view', 'Visualizar Equipe', 'Permite visualizar membros da equipe', 'team'),
    ('team:manage', 'Gerenciar Equipe', 'Permite adicionar/remover membros', 'team'),

    -- Reports
    ('reports:view', 'Visualizar Relatorios', 'Permite visualizar relatorios', 'reports'),
    ('reports:export', 'Exportar Relatorios', 'Permite exportar relatorios', 'reports'),

    -- Admin
    ('admin:access', 'Acesso Admin', 'Permite acesso ao painel admin', 'admin'),
    ('admin:users', 'Gerenciar Usuarios', 'Permite gerenciar usuarios do sistema', 'admin'),
    ('admin:settings', 'Configuracoes', 'Permite alterar configuracoes do sistema', 'admin')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- TABLE: email_queue
-- Description: Queue for email sending with retry support
-- =====================================================
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);

-- =====================================================
-- TABLE: webhook_logs
-- Description: Log webhook deliveries for debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSED', 'FAILED')),
    processing_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- =====================================================
-- Add company info to organizer_accounts if not exists
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizer_accounts' AND column_name = 'company_name'
    ) THEN
        ALTER TABLE organizer_accounts ADD COLUMN company_name VARCHAR(255);
        ALTER TABLE organizer_accounts ADD COLUMN trading_name VARCHAR(255);
        ALTER TABLE organizer_accounts ADD COLUMN cnpj VARCHAR(18) UNIQUE;
        ALTER TABLE organizer_accounts ADD COLUMN company_email VARCHAR(255);
        ALTER TABLE organizer_accounts ADD COLUMN company_phone VARCHAR(20);
        ALTER TABLE organizer_accounts ADD COLUMN company_address VARCHAR(500);
        ALTER TABLE organizer_accounts ADD COLUMN company_city VARCHAR(100);
        ALTER TABLE organizer_accounts ADD COLUMN company_state VARCHAR(50);
        ALTER TABLE organizer_accounts ADD COLUMN company_zip_code VARCHAR(20);
        ALTER TABLE organizer_accounts ADD COLUMN pix_key_type VARCHAR(20);
    END IF;
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
