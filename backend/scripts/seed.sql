-- =========================================
-- TICKETFEST - Script de Seed do Banco de Dados
-- Dados iniciais baseados nos dados mockados do mobile
-- =========================================

-- Limpar dados existentes (opcional - descomente se necessário)
-- TRUNCATE ticket_instances, order_items, orders, cart_items, carts, tickets, events, organizer_accounts, users RESTART IDENTITY CASCADE;

-- =========================================
-- 1. USUÁRIOS (Organizadores)
-- =========================================

INSERT INTO users (id, email, password_hash, name, cpf, phone, role, created_at, updated_at)
VALUES
  -- Organizadores (sem CPF pois são empresas - CNPJ fica na tabela organizer_accounts)
  ('a0000000-0000-0000-0000-000000000001', 'contato@rockinrio.com', '$2b$10$XdMkN5S8VXJt1vM/lDvQpOqzJK8K0hZ6I2mQz1vI3n5NhQj8K8Cke', 'Rock World S.A.', NULL, '21999999901', 'ORGANIZER', '2024-01-15 10:00:00', NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'contato@livenation.com.br', '$2b$10$XdMkN5S8VXJt1vM/lDvQpOqzJK8K0hZ6I2mQz1vI3n5NhQj8K8Cke', 'Live Nation Brasil', NULL, '11999999902', 'ORGANIZER', '2024-02-20 10:00:00', NOW()),
  ('a0000000-0000-0000-0000-000000000003', 'contato@t4f.com.br', '$2b$10$XdMkN5S8VXJt1vM/lDvQpOqzJK8K0hZ6I2mQz1vI3n5NhQj8K8Cke', 'Time For Fun', NULL, '11999999903', 'ORGANIZER', '2024-01-10 10:00:00', NOW()),
  ('a0000000-0000-0000-0000-000000000004', 'contato@broadwaybrasil.com.br', '$2b$10$XdMkN5S8VXJt1vM/lDvQpOqzJK8K0hZ6I2mQz1vI3n5NhQj8K8Cke', 'Broadway Brasil', NULL, '11999999904', 'ORGANIZER', '2024-03-01 10:00:00', NOW()),
  ('a0000000-0000-0000-0000-000000000005', 'contato@cbf.com.br', '$2b$10$XdMkN5S8VXJt1vM/lDvQpOqzJK8K0hZ6I2mQz1vI3n5NhQj8K8Cke', 'CBF', NULL, '21999999905', 'ORGANIZER', '2024-04-01 10:00:00', NOW()),
  ('a0000000-0000-0000-0000-000000000006', 'eventos@rio.rj.gov.br', '$2b$10$XdMkN5S8VXJt1vM/lDvQpOqzJK8K0hZ6I2mQz1vI3n5NhQj8K8Cke', 'Prefeitura do Rio', NULL, '21999999906', 'ORGANIZER', '2024-05-01 10:00:00', NOW()),

  -- Usuário teste (promoter)
  ('b0000000-0000-0000-0000-000000000001', 'usuario@teste.com', '$2b$10$XdMkN5S8VXJt1vM/lDvQpOqzJK8K0hZ6I2mQz1vI3n5NhQj8K8Cke', 'Usuário Teste', '12345678900', '11999887766', 'USER', '2024-01-01 10:00:00', NOW()),

  -- Admin
  ('c0000000-0000-0000-0000-000000000001', 'admin@ticketfest.com', '$2b$10$XdMkN5S8VXJt1vM/lDvQpOqzJK8K0hZ6I2mQz1vI3n5NhQj8K8Cke', 'Admin TicketFest', '00000000000', '11999999999', 'ADMIN', '2024-01-01 00:00:00', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- =========================================
-- 2. EVENTOS
-- =========================================

INSERT INTO events (id, name, slug, description, date, end_date, location, address, latitude, longitude, images, category, status, organizer_id, created_at, updated_at)
VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    'Rock in Rio 2026',
    'rock-in-rio-2026',
    'O maior festival de música do mundo está de volta! Prepare-se para uma experiência inesquecível com os maiores artistas internacionais e nacionais. São 7 dias de muita música, arte e entretenimento na Cidade do Rock.',
    '2026-09-12 16:00:00',
    '2026-09-21 23:59:00',
    'Cidade do Rock',
    'Av. Salvador Allende, 6555 - Barra da Tijuca, Rio de Janeiro - RJ',
    -22.9756,
    -43.3927,
    ARRAY['https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'],
    'FESTIVAL',
    'PUBLISHED',
    'a0000000-0000-0000-0000-000000000001',
    '2024-01-15 10:00:00',
    '2024-06-01 15:30:00'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'Show do Coldplay',
    'coldplay-tour-2026',
    'A banda britânica Coldplay traz sua turnê mundial "Music of the Spheres" para o Brasil. Uma experiência visual e sonora única com os maiores hits da banda.',
    '2026-03-15 20:00:00',
    NULL,
    'Allianz Parque',
    'Av. Francisco Matarazzo, 1705 - Água Branca, São Paulo - SP',
    -23.5275,
    -46.6781,
    ARRAY['https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'],
    'SHOW',
    'PUBLISHED',
    'a0000000-0000-0000-0000-000000000002',
    '2024-02-20 10:00:00',
    '2024-05-15 12:00:00'
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    'Lollapalooza Brasil 2026',
    'lollapalooza-brasil-2026',
    'O Lollapalooza Brasil retorna com uma lineup incrível! Três dias de festival com os melhores artistas do rock, pop, eletrônico e muito mais.',
    '2026-03-28 12:00:00',
    '2026-03-30 23:00:00',
    'Autódromo de Interlagos',
    'Av. Sen. Teotônio Vilela, 261 - Interlagos, São Paulo - SP',
    -23.7036,
    -46.6975,
    ARRAY['https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800'],
    'FESTIVAL',
    'PUBLISHED',
    'a0000000-0000-0000-0000-000000000003',
    '2024-01-10 10:00:00',
    '2024-04-20 14:00:00'
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    'Teatro - O Fantasma da Ópera',
    'fantasma-da-opera-sp',
    'O musical mais icônico de todos os tempos! Uma produção espetacular que conta a história de amor e obsessão nos subterrâneos da Ópera de Paris.',
    '2026-02-14 20:00:00',
    NULL,
    'Teatro Renault',
    'Av. Brigadeiro Luís Antônio, 411 - Bela Vista, São Paulo - SP',
    -23.5536,
    -46.6416,
    ARRAY['https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800'],
    'TEATRO',
    'PUBLISHED',
    'a0000000-0000-0000-0000-000000000004',
    '2024-03-01 10:00:00',
    '2024-05-10 16:00:00'
  ),
  (
    'e0000000-0000-0000-0000-000000000005',
    'Final da Copa do Brasil',
    'final-copa-brasil-2026',
    'A grande final da Copa do Brasil 2026! Dois gigantes do futebol brasileiro se enfrentam pela taça mais cobiçada do país.',
    '2026-11-12 16:00:00',
    NULL,
    'Maracanã',
    'Av. Pres. Castelo Branco - Maracanã, Rio de Janeiro - RJ',
    -22.9121,
    -43.2302,
    ARRAY['https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800'],
    'ESPORTE',
    'PUBLISHED',
    'a0000000-0000-0000-0000-000000000005',
    '2024-04-01 10:00:00',
    '2024-06-15 18:00:00'
  ),
  (
    'e0000000-0000-0000-0000-000000000006',
    'Réveillon Copacabana 2027',
    'reveillon-copacabana-2027',
    'A maior festa de Ano Novo do mundo! Shows, fogos de artifício e muita energia positiva na praia mais famosa do Brasil.',
    '2026-12-31 20:00:00',
    NULL,
    'Praia de Copacabana',
    'Av. Atlântica - Copacabana, Rio de Janeiro - RJ',
    -22.9711,
    -43.1822,
    ARRAY['https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800'],
    'FESTA',
    'PUBLISHED',
    'a0000000-0000-0000-0000-000000000006',
    '2024-05-01 10:00:00',
    '2024-06-20 10:00:00'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- =========================================
-- 3. TICKETS (Ingressos)
-- =========================================

INSERT INTO tickets (id, event_id, name, description, price, quantity, sold, sales_start, sales_end, features, created_at, updated_at)
VALUES
  -- Rock in Rio 2026
  (
    'd0000000-0000-0000-0001-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'Pista',
    'Acesso à área de pista geral',
    595.00,
    50000,
    35000,
    '2024-04-01 10:00:00',
    '2026-09-11 23:59:00',
    ARRAY['Acesso à pista', 'Área de alimentação', 'Banheiros'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0001-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    'Pista Premium',
    'Área mais próxima ao palco com visão privilegiada',
    995.00,
    10000,
    8500,
    '2024-04-01 10:00:00',
    '2026-09-11 23:59:00',
    ARRAY['Área exclusiva próxima ao palco', 'Bar exclusivo', 'Banheiros VIP', 'Entrada prioritária'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0001-000000000003',
    'e0000000-0000-0000-0000-000000000001',
    'Camarote',
    'Experiência VIP com open bar e vista privilegiada',
    2500.00,
    2000,
    1800,
    '2024-04-01 10:00:00',
    '2026-09-11 23:59:00',
    ARRAY['Open bar premium', 'Buffet completo', 'Vista privilegiada', 'Estacionamento VIP', 'Acesso ao backstage'],
    NOW(),
    NOW()
  ),

  -- Show do Coldplay
  (
    'd0000000-0000-0000-0002-000000000001',
    'e0000000-0000-0000-0000-000000000002',
    'Pista',
    'Acesso à área de pista',
    450.00,
    30000,
    25000,
    '2024-06-01 10:00:00',
    '2026-03-14 23:59:00',
    ARRAY['Acesso à pista', 'Área de alimentação'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0002-000000000002',
    'e0000000-0000-0000-0000-000000000002',
    'Cadeira Inferior',
    'Assento numerado no anel inferior',
    680.00,
    15000,
    12000,
    '2024-06-01 10:00:00',
    '2026-03-14 23:59:00',
    ARRAY['Assento numerado', 'Boa visibilidade', 'Acesso a bares'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0002-000000000003',
    'e0000000-0000-0000-0000-000000000002',
    'Cadeira Superior',
    'Assento numerado no anel superior',
    380.00,
    20000,
    15000,
    '2024-06-01 10:00:00',
    '2026-03-14 23:59:00',
    ARRAY['Assento numerado', 'Vista panorâmica'],
    NOW(),
    NOW()
  ),

  -- Lollapalooza Brasil 2026
  (
    'd0000000-0000-0000-0003-000000000001',
    'e0000000-0000-0000-0000-000000000003',
    'Lolla Pass (3 dias)',
    'Acesso aos 3 dias de festival',
    1650.00,
    40000,
    30000,
    '2024-09-01 10:00:00',
    '2026-03-27 23:59:00',
    ARRAY['Acesso aos 3 dias', 'Todas as áreas gerais', 'Área de alimentação'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0003-000000000002',
    'e0000000-0000-0000-0000-000000000003',
    'Lolla Lounge (3 dias)',
    'Experiência premium com área exclusiva',
    3200.00,
    5000,
    4200,
    '2024-09-01 10:00:00',
    '2026-03-27 23:59:00',
    ARRAY['Acesso aos 3 dias', 'Área lounge exclusiva', 'Open bar', 'Buffet', 'Banheiros VIP'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0003-000000000003',
    'e0000000-0000-0000-0000-000000000003',
    'Day Pass - Sexta',
    'Acesso apenas na sexta-feira',
    650.00,
    15000,
    10000,
    '2024-09-01 10:00:00',
    '2026-03-27 23:59:00',
    ARRAY['Acesso dia 28/03', 'Todas as áreas gerais'],
    NOW(),
    NOW()
  ),

  -- Teatro - O Fantasma da Ópera
  (
    'd0000000-0000-0000-0004-000000000001',
    'e0000000-0000-0000-0000-000000000004',
    'Plateia A',
    'Melhores lugares da casa',
    450.00,
    200,
    100,
    '2024-10-01 10:00:00',
    '2026-02-13 23:59:00',
    ARRAY['Melhor visibilidade', 'Assento numerado', 'Programa do espetáculo'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0004-000000000002',
    'e0000000-0000-0000-0000-000000000004',
    'Plateia B',
    'Ótima visão do palco',
    320.00,
    300,
    150,
    '2024-10-01 10:00:00',
    '2026-02-13 23:59:00',
    ARRAY['Boa visibilidade', 'Assento numerado'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0004-000000000003',
    'e0000000-0000-0000-0000-000000000004',
    'Balcão',
    'Vista panorâmica do espetáculo',
    180.00,
    400,
    200,
    '2024-10-01 10:00:00',
    '2026-02-13 23:59:00',
    ARRAY['Vista panorâmica', 'Assento numerado'],
    NOW(),
    NOW()
  ),

  -- Final da Copa do Brasil
  (
    'd0000000-0000-0000-0005-000000000001',
    'e0000000-0000-0000-0000-000000000005',
    'Arquibancada',
    'Setor de arquibancada geral',
    250.00,
    50000,
    35000,
    '2024-10-01 10:00:00',
    '2026-11-11 23:59:00',
    ARRAY['Acesso à arquibancada', 'Vista do campo'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0005-000000000002',
    'e0000000-0000-0000-0000-000000000005',
    'Cadeira Numerada',
    'Assento numerado com melhor conforto',
    450.00,
    20000,
    15000,
    '2024-10-01 10:00:00',
    '2026-11-11 23:59:00',
    ARRAY['Assento numerado', 'Maior conforto', 'Boa visibilidade'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0005-000000000003',
    'e0000000-0000-0000-0000-000000000005',
    'Camarote',
    'Experiência VIP com serviço completo',
    1500.00,
    3000,
    2000,
    '2024-10-01 10:00:00',
    '2026-11-11 23:59:00',
    ARRAY['Open bar', 'Buffet', 'Estacionamento VIP', 'Vista privilegiada'],
    NOW(),
    NOW()
  ),

  -- Réveillon Copacabana 2027
  (
    'd0000000-0000-0000-0006-000000000001',
    'e0000000-0000-0000-0000-000000000006',
    'Área Geral',
    'Acesso à área de shows na praia',
    0.00,
    1000000,
    500000,
    '2024-11-01 10:00:00',
    '2026-12-31 18:00:00',
    ARRAY['Acesso livre', 'Shows gratuitos'],
    NOW(),
    NOW()
  ),
  (
    'd0000000-0000-0000-0006-000000000002',
    'e0000000-0000-0000-0000-000000000006',
    'Área VIP Copacabana Palace',
    'Experiência exclusiva no hotel mais famoso do Brasil',
    5000.00,
    500,
    300,
    '2024-11-01 10:00:00',
    '2026-12-30 23:59:00',
    ARRAY['Open bar premium', 'Buffet internacional', 'Vista privilegiada dos fogos', 'DJ exclusivo'],
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  quantity = EXCLUDED.quantity,
  sold = EXCLUDED.sold,
  updated_at = NOW();

-- =========================================
-- 4. PROMOTER LISTS (Listas de Promoters)
-- =========================================

-- Criar tabela de listas de promoters se não existir
CREATE TABLE IF NOT EXISTS promoter_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    promoter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    max_items INTEGER NOT NULL DEFAULT 50,
    current_items INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promoter_lists_event_id ON promoter_lists(event_id);
CREATE INDEX IF NOT EXISTS idx_promoter_lists_promoter_id ON promoter_lists(promoter_id);

-- Criar tabela de itens das listas se não existir
CREATE TABLE IF NOT EXISTS list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES promoter_lists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cpf VARCHAR(14),
    checked_in BOOLEAN DEFAULT FALSE NOT NULL,
    checked_in_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);

-- Criar tabela de logs de ações (anti-fraude) se não existir
CREATE TABLE IF NOT EXISTS list_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES promoter_lists(id) ON DELETE CASCADE,
    promoter_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_list_action_logs_list_id ON list_action_logs(list_id);

-- Inserir listas de promoters
INSERT INTO promoter_lists (id, event_id, promoter_id, type, name, max_items, current_items, expires_at, created_at)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'vip',
    'Lista VIP Rock in Rio',
    50,
    3,
    '2026-09-12 14:00:00',
    '2024-06-01 10:00:00'
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'desconto',
    'Lista Desconto Coldplay',
    30,
    2,
    '2026-03-15 18:00:00',
    '2024-07-15 10:00:00'
  ),
  (
    'f0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'divulgador',
    'Lista Divulgador Lollapalooza',
    100,
    1,
    '2026-03-28 10:00:00',
    '2024-08-01 10:00:00'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  max_items = EXCLUDED.max_items,
  current_items = EXCLUDED.current_items;

-- Inserir itens das listas
INSERT INTO list_items (id, list_id, name, phone, cpf, checked_in, checked_in_at, created_by, created_at)
VALUES
  -- Lista VIP Rock in Rio
  (
    'f1000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'João Silva',
    '11999887766',
    '12345678900',
    FALSE,
    NULL,
    'b0000000-0000-0000-0000-000000000001',
    '2024-06-15 14:30:00'
  ),
  (
    'f1000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000001',
    'Maria Santos',
    '11988776655',
    NULL,
    TRUE,
    '2026-09-12 17:30:00',
    'b0000000-0000-0000-0000-000000000001',
    '2024-06-16 10:00:00'
  ),
  (
    'f1000000-0000-0000-0000-000000000003',
    'f0000000-0000-0000-0000-000000000001',
    'Pedro Oliveira',
    '11977665544',
    NULL,
    FALSE,
    NULL,
    'b0000000-0000-0000-0000-000000000001',
    '2024-06-17 09:15:00'
  ),

  -- Lista Desconto Coldplay
  (
    'f1000000-0000-0000-0000-000000000004',
    'f0000000-0000-0000-0000-000000000002',
    'Ana Costa',
    '11966554433',
    '98765432100',
    FALSE,
    NULL,
    'b0000000-0000-0000-0000-000000000001',
    '2024-07-20 11:00:00'
  ),
  (
    'f1000000-0000-0000-0000-000000000005',
    'f0000000-0000-0000-0000-000000000002',
    'Carlos Ferreira',
    '11955443322',
    NULL,
    FALSE,
    NULL,
    'b0000000-0000-0000-0000-000000000001',
    '2024-07-21 16:45:00'
  ),

  -- Lista Divulgador Lollapalooza
  (
    'f1000000-0000-0000-0000-000000000006',
    'f0000000-0000-0000-0000-000000000003',
    'Fernanda Lima',
    '11944332211',
    NULL,
    FALSE,
    NULL,
    'b0000000-0000-0000-0000-000000000001',
    '2024-08-05 10:30:00'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  checked_in = EXCLUDED.checked_in;

-- =========================================
-- 5. CUPONS DE DESCONTO
-- =========================================

INSERT INTO coupons (id, code, description, discount_type, discount_value, max_uses, used_count, valid_from, valid_until, event_id, min_purchase, active)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'ROCK10',
    '10% de desconto no Rock in Rio',
    'PERCENTAGE',
    10.00,
    1000,
    150,
    '2024-04-01 00:00:00',
    '2026-09-11 23:59:00',
    'e0000000-0000-0000-0000-000000000001',
    100.00,
    TRUE
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'COLDPLAY50',
    'R$50 de desconto no show do Coldplay',
    'FIXED',
    50.00,
    500,
    200,
    '2024-06-01 00:00:00',
    '2026-03-14 23:59:00',
    'e0000000-0000-0000-0000-000000000002',
    200.00,
    TRUE
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'LOLLA15',
    '15% de desconto no Lollapalooza',
    'PERCENTAGE',
    15.00,
    2000,
    500,
    '2024-09-01 00:00:00',
    '2026-03-27 23:59:00',
    'e0000000-0000-0000-0000-000000000003',
    500.00,
    TRUE
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'BEMVINDO',
    'R$20 de desconto para novos usuários',
    'FIXED',
    20.00,
    10000,
    0,
    '2024-01-01 00:00:00',
    '2027-12-31 23:59:00',
    NULL,
    50.00,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  discount_value = EXCLUDED.discount_value;

-- =========================================
-- 6. CONTAS DE ORGANIZADORES
-- =========================================

INSERT INTO organizer_accounts (id, user_id, verified, verified_at, available_balance, pending_balance)
VALUES
  ('0a000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', TRUE, '2024-02-01 10:00:00', 1500000.00, 250000.00),
  ('0a000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', TRUE, '2024-03-01 10:00:00', 800000.00, 150000.00),
  ('0a000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', TRUE, '2024-02-15 10:00:00', 2000000.00, 500000.00),
  ('0a000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', TRUE, '2024-04-01 10:00:00', 50000.00, 15000.00),
  ('0a000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', TRUE, '2024-05-01 10:00:00', 3000000.00, 800000.00),
  ('0a000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', TRUE, '2024-06-01 10:00:00', 500000.00, 100000.00)
ON CONFLICT (user_id) DO UPDATE SET
  verified = EXCLUDED.verified,
  available_balance = EXCLUDED.available_balance,
  pending_balance = EXCLUDED.pending_balance;

-- =========================================
-- FIM DO SCRIPT DE SEED
-- =========================================

-- Verificação dos dados inseridos
SELECT 'Usuários inseridos:' AS info, COUNT(*) AS total FROM users;
SELECT 'Eventos inseridos:' AS info, COUNT(*) AS total FROM events;
SELECT 'Tickets inseridos:' AS info, COUNT(*) AS total FROM tickets;
SELECT 'Cupons inseridos:' AS info, COUNT(*) AS total FROM coupons;
SELECT 'Listas de promoters inseridas:' AS info, COUNT(*) AS total FROM promoter_lists;
SELECT 'Itens de listas inseridos:' AS info, COUNT(*) AS total FROM list_items;
SELECT 'Contas de organizadores inseridas:' AS info, COUNT(*) AS total FROM organizer_accounts;
