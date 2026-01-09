/**
 * Script de Seed do Banco de Dados
 * Insere os dados mockados do mobile no banco de dados
 *
 * Uso: npx tsx scripts/seed.ts
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

// Configuração do banco de dados
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ticketfest',
});

// Dados mockados
const users = [
  // Organizadores (sem CPF pois são empresas - CNPJ fica na tabela organizer_accounts)
  { id: 'a0000000-0000-0000-0000-000000000001', email: 'contato@rockinrio.com', name: 'Rock World S.A.', cpf: null, phone: '21999999901', role: 'ORGANIZER' },
  { id: 'a0000000-0000-0000-0000-000000000002', email: 'contato@livenation.com.br', name: 'Live Nation Brasil', cpf: null, phone: '11999999902', role: 'ORGANIZER' },
  { id: 'a0000000-0000-0000-0000-000000000003', email: 'contato@t4f.com.br', name: 'Time For Fun', cpf: null, phone: '11999999903', role: 'ORGANIZER' },
  { id: 'a0000000-0000-0000-0000-000000000004', email: 'contato@broadwaybrasil.com.br', name: 'Broadway Brasil', cpf: null, phone: '11999999904', role: 'ORGANIZER' },
  { id: 'a0000000-0000-0000-0000-000000000005', email: 'contato@cbf.com.br', name: 'CBF', cpf: null, phone: '21999999905', role: 'ORGANIZER' },
  { id: 'a0000000-0000-0000-0000-000000000006', email: 'eventos@rio.rj.gov.br', name: 'Prefeitura do Rio', cpf: null, phone: '21999999906', role: 'ORGANIZER' },
  // Usuário teste
  { id: 'b0000000-0000-0000-0000-000000000001', email: 'usuario@teste.com', name: 'Usuário Teste', cpf: '12345678900', phone: '11999887766', role: 'USER' },
  // Admin
  { id: 'c0000000-0000-0000-0000-000000000001', email: 'admin@ticketfest.com', name: 'Admin TicketFest', cpf: '00000000000', phone: '11999999999', role: 'ADMIN' },
];

const events = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    name: 'Rock in Rio 2026',
    slug: 'rock-in-rio-2026',
    description: 'O maior festival de música do mundo está de volta! Prepare-se para uma experiência inesquecível com os maiores artistas internacionais e nacionais. São 7 dias de muita música, arte e entretenimento na Cidade do Rock.',
    date: '2026-09-12T16:00:00.000Z',
    end_date: '2026-09-21T23:59:00.000Z',
    location: 'Cidade do Rock',
    address: 'Av. Salvador Allende, 6555 - Barra da Tijuca, Rio de Janeiro - RJ',
    latitude: -22.9756,
    longitude: -43.3927,
    images: ['https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'],
    category: 'FESTIVAL',
    status: 'PUBLISHED',
    organizer_id: 'a0000000-0000-0000-0000-000000000001',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    name: 'Show do Coldplay',
    slug: 'coldplay-tour-2026',
    description: 'A banda britânica Coldplay traz sua turnê mundial "Music of the Spheres" para o Brasil. Uma experiência visual e sonora única com os maiores hits da banda.',
    date: '2026-03-15T20:00:00.000Z',
    end_date: null,
    location: 'Allianz Parque',
    address: 'Av. Francisco Matarazzo, 1705 - Água Branca, São Paulo - SP',
    latitude: -23.5275,
    longitude: -46.6781,
    images: ['https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'],
    category: 'SHOW',
    status: 'PUBLISHED',
    organizer_id: 'a0000000-0000-0000-0000-000000000002',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    name: 'Lollapalooza Brasil 2026',
    slug: 'lollapalooza-brasil-2026',
    description: 'O Lollapalooza Brasil retorna com uma lineup incrível! Três dias de festival com os melhores artistas do rock, pop, eletrônico e muito mais.',
    date: '2026-03-28T12:00:00.000Z',
    end_date: '2026-03-30T23:00:00.000Z',
    location: 'Autódromo de Interlagos',
    address: 'Av. Sen. Teotônio Vilela, 261 - Interlagos, São Paulo - SP',
    latitude: -23.7036,
    longitude: -46.6975,
    images: ['https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800'],
    category: 'FESTIVAL',
    status: 'PUBLISHED',
    organizer_id: 'a0000000-0000-0000-0000-000000000003',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    name: 'Teatro - O Fantasma da Ópera',
    slug: 'fantasma-da-opera-sp',
    description: 'O musical mais icônico de todos os tempos! Uma produção espetacular que conta a história de amor e obsessão nos subterrâneos da Ópera de Paris.',
    date: '2026-02-14T20:00:00.000Z',
    end_date: null,
    location: 'Teatro Renault',
    address: 'Av. Brigadeiro Luís Antônio, 411 - Bela Vista, São Paulo - SP',
    latitude: -23.5536,
    longitude: -46.6416,
    images: ['https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800'],
    category: 'TEATRO',
    status: 'PUBLISHED',
    organizer_id: 'a0000000-0000-0000-0000-000000000004',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    name: 'Final da Copa do Brasil',
    slug: 'final-copa-brasil-2026',
    description: 'A grande final da Copa do Brasil 2026! Dois gigantes do futebol brasileiro se enfrentam pela taça mais cobiçada do país.',
    date: '2026-11-12T16:00:00.000Z',
    end_date: null,
    location: 'Maracanã',
    address: 'Av. Pres. Castelo Branco - Maracanã, Rio de Janeiro - RJ',
    latitude: -22.9121,
    longitude: -43.2302,
    images: ['https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800'],
    category: 'ESPORTE',
    status: 'PUBLISHED',
    organizer_id: 'a0000000-0000-0000-0000-000000000005',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000006',
    name: 'Réveillon Copacabana 2027',
    slug: 'reveillon-copacabana-2027',
    description: 'A maior festa de Ano Novo do mundo! Shows, fogos de artifício e muita energia positiva na praia mais famosa do Brasil.',
    date: '2026-12-31T20:00:00.000Z',
    end_date: null,
    location: 'Praia de Copacabana',
    address: 'Av. Atlântica - Copacabana, Rio de Janeiro - RJ',
    latitude: -22.9711,
    longitude: -43.1822,
    images: ['https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800'],
    category: 'FESTA',
    status: 'PUBLISHED',
    organizer_id: 'a0000000-0000-0000-0000-000000000006',
  },
];

const tickets = [
  // Rock in Rio 2026
  { id: 'd0000000-0000-0000-0001-000000000001', event_id: 'e0000000-0000-0000-0000-000000000001', name: 'Pista', description: 'Acesso à área de pista geral', price: 595.00, quantity: 50000, sold: 35000, sales_start: '2024-04-01T10:00:00.000Z', sales_end: '2026-09-11T23:59:00.000Z', features: ['Acesso à pista', 'Área de alimentação', 'Banheiros'] },
  { id: 'd0000000-0000-0000-0001-000000000002', event_id: 'e0000000-0000-0000-0000-000000000001', name: 'Pista Premium', description: 'Área mais próxima ao palco com visão privilegiada', price: 995.00, quantity: 10000, sold: 8500, sales_start: '2024-04-01T10:00:00.000Z', sales_end: '2026-09-11T23:59:00.000Z', features: ['Área exclusiva próxima ao palco', 'Bar exclusivo', 'Banheiros VIP', 'Entrada prioritária'] },
  { id: 'd0000000-0000-0000-0001-000000000003', event_id: 'e0000000-0000-0000-0000-000000000001', name: 'Camarote', description: 'Experiência VIP com open bar e vista privilegiada', price: 2500.00, quantity: 2000, sold: 1800, sales_start: '2024-04-01T10:00:00.000Z', sales_end: '2026-09-11T23:59:00.000Z', features: ['Open bar premium', 'Buffet completo', 'Vista privilegiada', 'Estacionamento VIP', 'Acesso ao backstage'] },

  // Show do Coldplay
  { id: 'd0000000-0000-0000-0002-000000000001', event_id: 'e0000000-0000-0000-0000-000000000002', name: 'Pista', description: 'Acesso à área de pista', price: 450.00, quantity: 30000, sold: 25000, sales_start: '2024-06-01T10:00:00.000Z', sales_end: '2026-03-14T23:59:00.000Z', features: ['Acesso à pista', 'Área de alimentação'] },
  { id: 'd0000000-0000-0000-0002-000000000002', event_id: 'e0000000-0000-0000-0000-000000000002', name: 'Cadeira Inferior', description: 'Assento numerado no anel inferior', price: 680.00, quantity: 15000, sold: 12000, sales_start: '2024-06-01T10:00:00.000Z', sales_end: '2026-03-14T23:59:00.000Z', features: ['Assento numerado', 'Boa visibilidade', 'Acesso a bares'] },
  { id: 'd0000000-0000-0000-0002-000000000003', event_id: 'e0000000-0000-0000-0000-000000000002', name: 'Cadeira Superior', description: 'Assento numerado no anel superior', price: 380.00, quantity: 20000, sold: 15000, sales_start: '2024-06-01T10:00:00.000Z', sales_end: '2026-03-14T23:59:00.000Z', features: ['Assento numerado', 'Vista panorâmica'] },

  // Lollapalooza Brasil 2026
  { id: 'd0000000-0000-0000-0003-000000000001', event_id: 'e0000000-0000-0000-0000-000000000003', name: 'Lolla Pass (3 dias)', description: 'Acesso aos 3 dias de festival', price: 1650.00, quantity: 40000, sold: 30000, sales_start: '2024-09-01T10:00:00.000Z', sales_end: '2026-03-27T23:59:00.000Z', features: ['Acesso aos 3 dias', 'Todas as áreas gerais', 'Área de alimentação'] },
  { id: 'd0000000-0000-0000-0003-000000000002', event_id: 'e0000000-0000-0000-0000-000000000003', name: 'Lolla Lounge (3 dias)', description: 'Experiência premium com área exclusiva', price: 3200.00, quantity: 5000, sold: 4200, sales_start: '2024-09-01T10:00:00.000Z', sales_end: '2026-03-27T23:59:00.000Z', features: ['Acesso aos 3 dias', 'Área lounge exclusiva', 'Open bar', 'Buffet', 'Banheiros VIP'] },
  { id: 'd0000000-0000-0000-0003-000000000003', event_id: 'e0000000-0000-0000-0000-000000000003', name: 'Day Pass - Sexta', description: 'Acesso apenas na sexta-feira', price: 650.00, quantity: 15000, sold: 10000, sales_start: '2024-09-01T10:00:00.000Z', sales_end: '2026-03-27T23:59:00.000Z', features: ['Acesso dia 28/03', 'Todas as áreas gerais'] },

  // Teatro - O Fantasma da Ópera
  { id: 'd0000000-0000-0000-0004-000000000001', event_id: 'e0000000-0000-0000-0000-000000000004', name: 'Plateia A', description: 'Melhores lugares da casa', price: 450.00, quantity: 200, sold: 100, sales_start: '2024-10-01T10:00:00.000Z', sales_end: '2026-02-13T23:59:00.000Z', features: ['Melhor visibilidade', 'Assento numerado', 'Programa do espetáculo'] },
  { id: 'd0000000-0000-0000-0004-000000000002', event_id: 'e0000000-0000-0000-0000-000000000004', name: 'Plateia B', description: 'Ótima visão do palco', price: 320.00, quantity: 300, sold: 150, sales_start: '2024-10-01T10:00:00.000Z', sales_end: '2026-02-13T23:59:00.000Z', features: ['Boa visibilidade', 'Assento numerado'] },
  { id: 'd0000000-0000-0000-0004-000000000003', event_id: 'e0000000-0000-0000-0000-000000000004', name: 'Balcão', description: 'Vista panorâmica do espetáculo', price: 180.00, quantity: 400, sold: 200, sales_start: '2024-10-01T10:00:00.000Z', sales_end: '2026-02-13T23:59:00.000Z', features: ['Vista panorâmica', 'Assento numerado'] },

  // Final da Copa do Brasil
  { id: 'd0000000-0000-0000-0005-000000000001', event_id: 'e0000000-0000-0000-0000-000000000005', name: 'Arquibancada', description: 'Setor de arquibancada geral', price: 250.00, quantity: 50000, sold: 35000, sales_start: '2024-10-01T10:00:00.000Z', sales_end: '2026-11-11T23:59:00.000Z', features: ['Acesso à arquibancada', 'Vista do campo'] },
  { id: 'd0000000-0000-0000-0005-000000000002', event_id: 'e0000000-0000-0000-0000-000000000005', name: 'Cadeira Numerada', description: 'Assento numerado com melhor conforto', price: 450.00, quantity: 20000, sold: 15000, sales_start: '2024-10-01T10:00:00.000Z', sales_end: '2026-11-11T23:59:00.000Z', features: ['Assento numerado', 'Maior conforto', 'Boa visibilidade'] },
  { id: 'd0000000-0000-0000-0005-000000000003', event_id: 'e0000000-0000-0000-0000-000000000005', name: 'Camarote', description: 'Experiência VIP com serviço completo', price: 1500.00, quantity: 3000, sold: 2000, sales_start: '2024-10-01T10:00:00.000Z', sales_end: '2026-11-11T23:59:00.000Z', features: ['Open bar', 'Buffet', 'Estacionamento VIP', 'Vista privilegiada'] },

  // Réveillon Copacabana 2027
  { id: 'd0000000-0000-0000-0006-000000000001', event_id: 'e0000000-0000-0000-0000-000000000006', name: 'Área Geral', description: 'Acesso à área de shows na praia', price: 0.00, quantity: 1000000, sold: 500000, sales_start: '2024-11-01T10:00:00.000Z', sales_end: '2026-12-31T18:00:00.000Z', features: ['Acesso livre', 'Shows gratuitos'] },
  { id: 'd0000000-0000-0000-0006-000000000002', event_id: 'e0000000-0000-0000-0000-000000000006', name: 'Área VIP Copacabana Palace', description: 'Experiência exclusiva no hotel mais famoso do Brasil', price: 5000.00, quantity: 500, sold: 300, sales_start: '2024-11-01T10:00:00.000Z', sales_end: '2026-12-30T23:59:00.000Z', features: ['Open bar premium', 'Buffet internacional', 'Vista privilegiada dos fogos', 'DJ exclusivo'] },
];

const coupons = [
  { id: 'c0000000-0000-0000-0000-000000000001', code: 'ROCK10', description: '10% de desconto no Rock in Rio', discount_type: 'PERCENTAGE', discount_value: 10.00, max_uses: 1000, used_count: 150, valid_from: '2024-04-01T00:00:00.000Z', valid_until: '2026-09-11T23:59:00.000Z', event_id: 'e0000000-0000-0000-0000-000000000001', min_purchase: 100.00 },
  { id: 'c0000000-0000-0000-0000-000000000002', code: 'COLDPLAY50', description: 'R$50 de desconto no show do Coldplay', discount_type: 'FIXED', discount_value: 50.00, max_uses: 500, used_count: 200, valid_from: '2024-06-01T00:00:00.000Z', valid_until: '2026-03-14T23:59:00.000Z', event_id: 'e0000000-0000-0000-0000-000000000002', min_purchase: 200.00 },
  { id: 'c0000000-0000-0000-0000-000000000003', code: 'LOLLA15', description: '15% de desconto no Lollapalooza', discount_type: 'PERCENTAGE', discount_value: 15.00, max_uses: 2000, used_count: 500, valid_from: '2024-09-01T00:00:00.000Z', valid_until: '2026-03-27T23:59:00.000Z', event_id: 'e0000000-0000-0000-0000-000000000003', min_purchase: 500.00 },
  { id: 'c0000000-0000-0000-0000-000000000004', code: 'BEMVINDO', description: 'R$20 de desconto para novos usuários', discount_type: 'FIXED', discount_value: 20.00, max_uses: 10000, used_count: 0, valid_from: '2024-01-01T00:00:00.000Z', valid_until: '2027-12-31T23:59:00.000Z', event_id: null, min_purchase: 50.00 },
];

const promoterLists = [
  { id: 'f0000000-0000-0000-0000-000000000001', event_id: 'e0000000-0000-0000-0000-000000000001', promoter_id: 'b0000000-0000-0000-0000-000000000001', type: 'vip', name: 'Lista VIP Rock in Rio', max_items: 50, current_items: 3, expires_at: '2026-09-12T14:00:00.000Z' },
  { id: 'f0000000-0000-0000-0000-000000000002', event_id: 'e0000000-0000-0000-0000-000000000002', promoter_id: 'b0000000-0000-0000-0000-000000000001', type: 'desconto', name: 'Lista Desconto Coldplay', max_items: 30, current_items: 2, expires_at: '2026-03-15T18:00:00.000Z' },
  { id: 'f0000000-0000-0000-0000-000000000003', event_id: 'e0000000-0000-0000-0000-000000000003', promoter_id: 'b0000000-0000-0000-0000-000000000001', type: 'divulgador', name: 'Lista Divulgador Lollapalooza', max_items: 100, current_items: 1, expires_at: '2026-03-28T10:00:00.000Z' },
];

const listItems = [
  { id: 'f1000000-0000-0000-0000-000000000001', list_id: 'f0000000-0000-0000-0000-000000000001', name: 'João Silva', phone: '11999887766', cpf: '12345678900', checked_in: false, checked_in_at: null, created_by: 'b0000000-0000-0000-0000-000000000001' },
  { id: 'f1000000-0000-0000-0000-000000000002', list_id: 'f0000000-0000-0000-0000-000000000001', name: 'Maria Santos', phone: '11988776655', cpf: null, checked_in: true, checked_in_at: '2026-09-12T17:30:00.000Z', created_by: 'b0000000-0000-0000-0000-000000000001' },
  { id: 'f1000000-0000-0000-0000-000000000003', list_id: 'f0000000-0000-0000-0000-000000000001', name: 'Pedro Oliveira', phone: '11977665544', cpf: null, checked_in: false, checked_in_at: null, created_by: 'b0000000-0000-0000-0000-000000000001' },
  { id: 'f1000000-0000-0000-0000-000000000004', list_id: 'f0000000-0000-0000-0000-000000000002', name: 'Ana Costa', phone: '11966554433', cpf: '98765432100', checked_in: false, checked_in_at: null, created_by: 'b0000000-0000-0000-0000-000000000001' },
  { id: 'f1000000-0000-0000-0000-000000000005', list_id: 'f0000000-0000-0000-0000-000000000002', name: 'Carlos Ferreira', phone: '11955443322', cpf: null, checked_in: false, checked_in_at: null, created_by: 'b0000000-0000-0000-0000-000000000001' },
  { id: 'f1000000-0000-0000-0000-000000000006', list_id: 'f0000000-0000-0000-0000-000000000003', name: 'Fernanda Lima', phone: '11944332211', cpf: null, checked_in: false, checked_in_at: null, created_by: 'b0000000-0000-0000-0000-000000000001' },
];

// Hash de senha padrão (senha: "123456")
const DEFAULT_PASSWORD_HASH = '$2b$10$XdMkN5S8VXJt1vM/lDvQpOqzJK8K0hZ6I2mQz1vI3n5NhQj8K8Cke';

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    await client.query('BEGIN');

    // 1. Inserir usuários
    console.log('👤 Inserindo usuários...');
    for (const user of users) {
      await client.query(`
        INSERT INTO users (id, email, password_hash, name, cpf, phone, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          updated_at = NOW()
      `, [user.id, user.email, DEFAULT_PASSWORD_HASH, user.name, user.cpf, user.phone, user.role]);
    }
    console.log(`   ✅ ${users.length} usuários inseridos\n`);

    // 2. Inserir eventos
    console.log('🎉 Inserindo eventos...');
    for (const event of events) {
      await client.query(`
        INSERT INTO events (id, name, slug, description, date, end_date, location, address, latitude, longitude, images, category, status, organizer_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          updated_at = NOW()
      `, [event.id, event.name, event.slug, event.description, event.date, event.end_date, event.location, event.address, event.latitude, event.longitude, event.images, event.category, event.status, event.organizer_id]);
    }
    console.log(`   ✅ ${events.length} eventos inseridos\n`);

    // 3. Inserir tickets
    console.log('🎫 Inserindo tickets...');
    for (const ticket of tickets) {
      await client.query(`
        INSERT INTO tickets (id, event_id, name, description, price, quantity, sold, sales_start, sales_end, features, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          quantity = EXCLUDED.quantity,
          sold = EXCLUDED.sold,
          updated_at = NOW()
      `, [ticket.id, ticket.event_id, ticket.name, ticket.description, ticket.price, ticket.quantity, ticket.sold, ticket.sales_start, ticket.sales_end, ticket.features]);
    }
    console.log(`   ✅ ${tickets.length} tickets inseridos\n`);

    // 4. Inserir cupons
    console.log('🏷️  Inserindo cupons...');
    for (const coupon of coupons) {
      await client.query(`
        INSERT INTO coupons (id, code, description, discount_type, discount_value, max_uses, used_count, valid_from, valid_until, event_id, min_purchase, active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, NOW())
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          description = EXCLUDED.description,
          discount_value = EXCLUDED.discount_value
      `, [coupon.id, coupon.code, coupon.description, coupon.discount_type, coupon.discount_value, coupon.max_uses, coupon.used_count, coupon.valid_from, coupon.valid_until, coupon.event_id, coupon.min_purchase]);
    }
    console.log(`   ✅ ${coupons.length} cupons inseridos\n`);

    // 5. Criar tabelas de promoter se não existirem
    console.log('📋 Criando/atualizando tabelas de promoter...');

    // Verifica se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'promoter_lists'
      )
    `);

    if (!tableExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE promoter_lists (
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
        )
      `);
    } else {
      // Adiciona colunas faltantes se a tabela já existir
      const columns = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'promoter_lists'
      `);
      const existingCols = columns.rows.map(r => r.column_name);

      if (!existingCols.includes('max_items')) {
        await client.query(`ALTER TABLE promoter_lists ADD COLUMN max_items INTEGER NOT NULL DEFAULT 50`);
      }
      if (!existingCols.includes('current_items')) {
        await client.query(`ALTER TABLE promoter_lists ADD COLUMN current_items INTEGER NOT NULL DEFAULT 0`);
      }
      if (!existingCols.includes('expires_at')) {
        await client.query(`ALTER TABLE promoter_lists ADD COLUMN expires_at TIMESTAMP`);
      }
      if (!existingCols.includes('type')) {
        await client.query(`ALTER TABLE promoter_lists ADD COLUMN type VARCHAR(50) DEFAULT 'vip'`);
      }
    }

    await client.query(`CREATE INDEX IF NOT EXISTS idx_promoter_lists_event_id ON promoter_lists(event_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_promoter_lists_promoter_id ON promoter_lists(promoter_id)`);

    // Verifica se list_items existe
    const listItemsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'list_items'
      )
    `);

    if (!listItemsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE list_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          list_id UUID NOT NULL REFERENCES promoter_lists(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          cpf VARCHAR(14),
          checked_in BOOLEAN DEFAULT FALSE NOT NULL,
          checked_in_at TIMESTAMP,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
    } else {
      // Adiciona colunas faltantes
      const listItemCols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'list_items'
      `);
      const existingListItemCols = listItemCols.rows.map(r => r.column_name);

      if (!existingListItemCols.includes('created_by')) {
        await client.query(`ALTER TABLE list_items ADD COLUMN created_by UUID REFERENCES users(id)`);
      }
      if (!existingListItemCols.includes('cpf')) {
        await client.query(`ALTER TABLE list_items ADD COLUMN cpf VARCHAR(14)`);
      }
      if (!existingListItemCols.includes('checked_in')) {
        await client.query(`ALTER TABLE list_items ADD COLUMN checked_in BOOLEAN DEFAULT FALSE`);
      }
      if (!existingListItemCols.includes('checked_in_at')) {
        await client.query(`ALTER TABLE list_items ADD COLUMN checked_in_at TIMESTAMP`);
      }
    }
    await client.query(`CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id)`);
    console.log('   ✅ Tabelas de promoter criadas/atualizadas\n');

    // 6. Inserir listas de promoters
    console.log('📝 Inserindo listas de promoters...');
    for (const list of promoterLists) {
      await client.query(`
        INSERT INTO promoter_lists (id, event_id, promoter_id, type, name, max_items, current_items, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          max_items = EXCLUDED.max_items,
          current_items = EXCLUDED.current_items
      `, [list.id, list.event_id, list.promoter_id, list.type, list.name, list.max_items, list.current_items, list.expires_at]);
    }
    console.log(`   ✅ ${promoterLists.length} listas inseridas\n`);

    // 7. Inserir itens das listas
    console.log('👥 Inserindo itens das listas...');
    for (const item of listItems) {
      await client.query(`
        INSERT INTO list_items (id, list_id, name, phone, cpf, checked_in, checked_in_at, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          checked_in = EXCLUDED.checked_in
      `, [item.id, item.list_id, item.name, item.phone, item.cpf, item.checked_in, item.checked_in_at, item.created_by]);
    }
    console.log(`   ✅ ${listItems.length} itens inseridos\n`);

    // 8. Inserir contas de organizadores
    console.log('🏦 Inserindo contas de organizadores...');
    const organizerAccounts = [
      { user_id: 'a0000000-0000-0000-0000-000000000001', available_balance: 1500000.00, pending_balance: 250000.00 },
      { user_id: 'a0000000-0000-0000-0000-000000000002', available_balance: 800000.00, pending_balance: 150000.00 },
      { user_id: 'a0000000-0000-0000-0000-000000000003', available_balance: 2000000.00, pending_balance: 500000.00 },
      { user_id: 'a0000000-0000-0000-0000-000000000004', available_balance: 50000.00, pending_balance: 15000.00 },
      { user_id: 'a0000000-0000-0000-0000-000000000005', available_balance: 3000000.00, pending_balance: 800000.00 },
      { user_id: 'a0000000-0000-0000-0000-000000000006', available_balance: 500000.00, pending_balance: 100000.00 },
    ];

    for (const account of organizerAccounts) {
      await client.query(`
        INSERT INTO organizer_accounts (user_id, verified, verified_at, available_balance, pending_balance, created_at, updated_at)
        VALUES ($1, TRUE, NOW(), $2, $3, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          verified = TRUE,
          available_balance = EXCLUDED.available_balance,
          pending_balance = EXCLUDED.pending_balance,
          updated_at = NOW()
      `, [account.user_id, account.available_balance, account.pending_balance]);
    }
    console.log(`   ✅ ${organizerAccounts.length} contas de organizadores inseridas\n`);

    await client.query('COMMIT');

    // Mostrar resumo
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════\n');

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM events) as events,
        (SELECT COUNT(*) FROM tickets) as tickets,
        (SELECT COUNT(*) FROM coupons) as coupons,
        (SELECT COUNT(*) FROM promoter_lists) as promoter_lists,
        (SELECT COUNT(*) FROM list_items) as list_items,
        (SELECT COUNT(*) FROM organizer_accounts) as organizer_accounts
    `);

    console.log('📊 Resumo dos dados:');
    console.log(`   • Usuários: ${counts.rows[0].users}`);
    console.log(`   • Eventos: ${counts.rows[0].events}`);
    console.log(`   • Tickets: ${counts.rows[0].tickets}`);
    console.log(`   • Cupons: ${counts.rows[0].coupons}`);
    console.log(`   • Listas de Promoters: ${counts.rows[0].promoter_lists}`);
    console.log(`   • Itens de Listas: ${counts.rows[0].list_items}`);
    console.log(`   • Contas de Organizadores: ${counts.rows[0].organizer_accounts}`);
    console.log('\n📌 Senha padrão para todos os usuários: 123456');
    console.log('📌 Email do admin: admin@ticketfest.com');
    console.log('📌 Email do usuário teste: usuario@teste.com\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
