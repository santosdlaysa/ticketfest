import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean database
  await prisma.ticketInstance.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleaned');

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ticketfest.com',
      passwordHash,
      name: 'Admin User',
      cpf: '12345678901',
      phone: '+5511999999999',
      role: 'ADMIN',
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@ticketfest.com',
      passwordHash,
      name: 'Event Organizer',
      cpf: '98765432101',
      phone: '+5511988888888',
      role: 'ORGANIZER',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@ticketfest.com',
      passwordHash,
      name: 'Regular User',
      cpf: '11122233344',
      phone: '+5511977777777',
      role: 'USER',
    },
  });

  console.log('✅ Users created');

  // Create Events
  const event1 = await prisma.event.create({
    data: {
      name: 'Festival de Verão 2025',
      slug: 'festival-verao-2025',
      description:
        'O maior festival de música do verão com os melhores artistas nacionais e internacionais. 3 dias de muita música, diversão e entretenimento.',
      date: new Date('2025-01-15T18:00:00'),
      endDate: new Date('2025-01-17T23:59:00'),
      location: 'Parque Ibirapuera',
      address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP, 04094-050',
      latitude: -23.5878,
      longitude: -46.6572,
      category: 'Música',
      status: 'PUBLISHED',
      organizerId: organizer.id,
      images: [
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
      ],
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: 'Tech Conference 2025',
      slug: 'tech-conference-2025',
      description:
        'Conferência de tecnologia com palestras sobre IA, Web3, Cloud Computing e as últimas tendências do mercado tech.',
      date: new Date('2025-02-20T09:00:00'),
      endDate: new Date('2025-02-22T18:00:00'),
      location: 'Centro de Convenções',
      address: 'Rua Funchal, 65 - Vila Olímpia, São Paulo - SP, 04551-060',
      latitude: -23.5963,
      longitude: -46.6846,
      category: 'Tecnologia',
      status: 'PUBLISHED',
      organizerId: organizer.id,
      images: [
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
      ],
    },
  });

  const event3 = await prisma.event.create({
    data: {
      name: 'Stand-Up Comedy Night',
      slug: 'standup-comedy-night',
      description: 'Uma noite de muitas risadas com os melhores comediantes do Brasil.',
      date: new Date('2025-01-25T20:00:00'),
      location: 'Teatro Riachuelo',
      address: 'Rua do Riachuelo, 89 - Centro, Rio de Janeiro - RJ, 20230-010',
      latitude: -22.9133,
      longitude: -43.1897,
      category: 'Comédia',
      status: 'PUBLISHED',
      organizerId: organizer.id,
      images: ['https://images.unsplash.com/photo-1585699324551-f6c309eedeca'],
    },
  });

  console.log('✅ Events created');

  // Create Tickets
  await prisma.ticket.createMany({
    data: [
      // Festival de Verão
      {
        eventId: event1.id,
        name: 'Pista',
        description: 'Ingresso para área de pista',
        price: 150.0,
        quantity: 5000,
        sold: 1234,
        salesStart: new Date('2024-11-01'),
        salesEnd: new Date('2025-01-15'),
        features: ['Acesso à pista', 'Bebidas não inclusas'],
      },
      {
        eventId: event1.id,
        name: 'Camarote',
        description: 'Ingresso para camarote VIP',
        price: 350.0,
        quantity: 500,
        sold: 250,
        salesStart: new Date('2024-11-01'),
        salesEnd: new Date('2025-01-15'),
        features: [
          'Acesso ao camarote',
          'Open bar',
          'Alimentação inclusa',
          'Estacionamento grátis',
        ],
      },
      // Tech Conference
      {
        eventId: event2.id,
        name: 'Ingresso Individual',
        description: 'Acesso a todos os dias do evento',
        price: 299.0,
        quantity: 1000,
        sold: 456,
        salesStart: new Date('2024-12-01'),
        salesEnd: new Date('2025-02-20'),
        features: ['Certificado de participação', 'Coffee break incluso', 'Kit do participante'],
      },
      {
        eventId: event2.id,
        name: 'Ingresso Corporativo (5 pessoas)',
        description: 'Pacote para empresas com 5 ingressos',
        price: 1200.0,
        quantity: 100,
        sold: 23,
        salesStart: new Date('2024-12-01'),
        salesEnd: new Date('2025-02-20'),
        features: [
          '5 certificados',
          'Coffee break incluso',
          '5 kits do participante',
          'Área de networking exclusiva',
        ],
      },
      // Stand-Up Comedy
      {
        eventId: event3.id,
        name: 'Plateia',
        description: 'Assento na plateia',
        price: 80.0,
        quantity: 300,
        sold: 150,
        salesStart: new Date('2024-12-15'),
        salesEnd: new Date('2025-01-25'),
        features: ['Assento marcado'],
      },
      {
        eventId: event3.id,
        name: 'VIP Front Row',
        description: 'Primeira fileira + meet & greet',
        price: 200.0,
        quantity: 20,
        sold: 15,
        salesStart: new Date('2024-12-15'),
        salesEnd: new Date('2025-01-25'),
        features: ['Primeira fileira', 'Meet & Greet com os comediantes', '1 bebida cortesia'],
      },
    ],
  });

  console.log('✅ Tickets created');

  // Create Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'BEMVINDO',
        description: '10% de desconto para novos usuários',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxUses: 1000,
        usedCount: 145,
        validFrom: new Date('2024-11-01'),
        validUntil: new Date('2025-12-31'),
        minPurchase: 50,
        active: true,
      },
      {
        code: 'VERAO50',
        description: 'R$ 50 de desconto no Festival de Verão',
        discountType: 'FIXED',
        discountValue: 50,
        maxUses: 500,
        usedCount: 89,
        validFrom: new Date('2024-11-01'),
        validUntil: new Date('2025-01-15'),
        eventId: event1.id,
        minPurchase: 150,
        active: true,
      },
    ],
  });

  console.log('✅ Coupons created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('👤 Test users:');
  console.log('   Admin: admin@ticketfest.com / password123');
  console.log('   Organizer: organizer@ticketfest.com / password123');
  console.log('   User: user@ticketfest.com / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
