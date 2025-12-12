-- Migration: Create Permissions System
-- Description: Creates tables for managing user permissions

-- Tabela de permissões disponíveis no sistema
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- Ex: "events:create", "orders:view"
    name VARCHAR(255) NOT NULL,        -- Nome legível: "Criar Eventos"
    description TEXT,
    module VARCHAR(50) NOT NULL,       -- Módulo: "events", "orders", "users"
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca por módulo
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- Tabela de vínculo entre usuários e permissões
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);

-- Inserir permissões padrão do sistema
INSERT INTO permissions (code, name, description, module) VALUES
-- Módulo: Dashboard
('dashboard:view', 'Ver Dashboard', 'Acesso ao painel principal', 'dashboard'),

-- Módulo: Eventos
('events:view', 'Ver Eventos', 'Visualizar lista de eventos', 'events'),
('events:create', 'Criar Eventos', 'Criar novos eventos', 'events'),
('events:edit', 'Editar Eventos', 'Editar eventos existentes', 'events'),
('events:delete', 'Excluir Eventos', 'Excluir eventos', 'events'),
('events:publish', 'Publicar Eventos', 'Publicar e despublicar eventos', 'events'),

-- Módulo: Locais/Venues
('venues:view', 'Ver Locais', 'Visualizar lista de locais', 'venues'),
('venues:create', 'Criar Locais', 'Criar novos locais', 'venues'),
('venues:edit', 'Editar Locais', 'Editar locais existentes', 'venues'),
('venues:delete', 'Excluir Locais', 'Excluir locais', 'venues'),

-- Módulo: Ingressos
('tickets:view', 'Ver Ingressos', 'Visualizar ingressos', 'tickets'),
('tickets:create', 'Criar Ingressos', 'Criar tipos de ingressos', 'tickets'),
('tickets:edit', 'Editar Ingressos', 'Editar ingressos existentes', 'tickets'),
('tickets:delete', 'Excluir Ingressos', 'Excluir ingressos', 'tickets'),

-- Módulo: Pedidos
('orders:view', 'Ver Pedidos', 'Visualizar lista de pedidos', 'orders'),
('orders:manage', 'Gerenciar Pedidos', 'Confirmar, cancelar pedidos', 'orders'),
('orders:refund', 'Reembolsar Pedidos', 'Processar reembolsos', 'orders'),
('orders:export', 'Exportar Pedidos', 'Exportar relatórios de pedidos', 'orders'),

-- Módulo: Check-in
('checkin:view', 'Ver Check-in', 'Visualizar status de check-in', 'checkin'),
('checkin:perform', 'Realizar Check-in', 'Fazer check-in de participantes', 'checkin'),
('checkin:export', 'Exportar Participantes', 'Exportar lista de participantes', 'checkin'),

-- Módulo: Financeiro
('finance:view', 'Ver Financeiro', 'Visualizar dados financeiros', 'finance'),
('finance:payouts', 'Gerenciar Saques', 'Solicitar e gerenciar saques', 'finance'),
('finance:reports', 'Relatórios Financeiros', 'Acessar relatórios detalhados', 'finance'),

-- Módulo: Usuários
('users:view', 'Ver Usuários', 'Visualizar lista de usuários', 'users'),
('users:create', 'Criar Usuários', 'Criar novos usuários', 'users'),
('users:edit', 'Editar Usuários', 'Editar usuários existentes', 'users'),
('users:delete', 'Excluir Usuários', 'Excluir usuários', 'users'),

-- Módulo: Permissões
('permissions:view', 'Ver Permissões', 'Visualizar permissões', 'permissions'),
('permissions:manage', 'Gerenciar Permissões', 'Atribuir e revogar permissões', 'permissions'),

-- Módulo: Configurações
('settings:view', 'Ver Configurações', 'Visualizar configurações', 'settings'),
('settings:edit', 'Editar Configurações', 'Editar configurações do sistema', 'settings')

ON CONFLICT (code) DO NOTHING;
