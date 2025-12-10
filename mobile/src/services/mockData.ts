import type { Event, Ticket, Cart, CartItem, Order, PromoterList, ListItem, PromoterStats, ListActionLog } from '../types';

// Mock Events
export const mockEvents: Event[] = [
  {
    id: 'event-1',
    name: 'Rock in Rio 2026',
    slug: 'rock-in-rio-2026',
    description: 'O maior festival de música do mundo está de volta! Prepare-se para uma experiência inesquecível com os maiores artistas internacionais e nacionais. São 7 dias de muita música, arte e entretenimento na Cidade do Rock.',
    date: '2026-09-12T16:00:00.000Z',
    endDate: '2026-09-21T23:59:00.000Z',
    location: 'Cidade do Rock',
    address: 'Av. Salvador Allende, 6555 - Barra da Tijuca, Rio de Janeiro - RJ',
    latitude: -22.9756,
    longitude: -43.3927,
    images: ['https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'],
    category: 'FESTIVAL',
    status: 'PUBLISHED',
    organizerId: 'org-1',
    organizer: {
      id: 'org-1',
      name: 'Rock World S.A.',
      email: 'contato@rockinrio.com',
    },
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-06-01T15:30:00.000Z',
  },
  {
    id: 'event-2',
    name: 'Show do Coldplay',
    slug: 'coldplay-tour-2026',
    description: 'A banda britânica Coldplay traz sua turnê mundial "Music of the Spheres" para o Brasil. Uma experiência visual e sonora única com os maiores hits da banda.',
    date: '2026-03-15T20:00:00.000Z',
    location: 'Allianz Parque',
    address: 'Av. Francisco Matarazzo, 1705 - Água Branca, São Paulo - SP',
    latitude: -23.5275,
    longitude: -46.6781,
    images: ['https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'],
    category: 'SHOW',
    status: 'PUBLISHED',
    organizerId: 'org-2',
    organizer: {
      id: 'org-2',
      name: 'Live Nation Brasil',
      email: 'contato@livenation.com.br',
    },
    createdAt: '2024-02-20T10:00:00.000Z',
    updatedAt: '2024-05-15T12:00:00.000Z',
  },
  {
    id: 'event-3',
    name: 'Lollapalooza Brasil 2026',
    slug: 'lollapalooza-brasil-2026',
    description: 'O Lollapalooza Brasil retorna com uma lineup incrível! Três dias de festival com os melhores artistas do rock, pop, eletrônico e muito mais.',
    date: '2026-03-28T12:00:00.000Z',
    endDate: '2026-03-30T23:00:00.000Z',
    location: 'Autódromo de Interlagos',
    address: 'Av. Sen. Teotônio Vilela, 261 - Interlagos, São Paulo - SP',
    images: ['https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800'],
    category: 'FESTIVAL',
    status: 'PUBLISHED',
    organizerId: 'org-3',
    organizer: {
      id: 'org-3',
      name: 'Time For Fun',
      email: 'contato@t4f.com.br',
    },
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-04-20T14:00:00.000Z',
  },
  {
    id: 'event-4',
    name: 'Teatro - O Fantasma da Ópera',
    slug: 'fantasma-da-opera-sp',
    description: 'O musical mais icônico de todos os tempos! Uma produção espetacular que conta a história de amor e obsessão nos subterrâneos da Ópera de Paris.',
    date: '2026-02-14T20:00:00.000Z',
    location: 'Teatro Renault',
    address: 'Av. Brigadeiro Luís Antônio, 411 - Bela Vista, São Paulo - SP',
    images: ['https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800'],
    category: 'TEATRO',
    status: 'PUBLISHED',
    organizerId: 'org-4',
    organizer: {
      id: 'org-4',
      name: 'Broadway Brasil',
      email: 'contato@broadwaybrasil.com.br',
    },
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-05-10T16:00:00.000Z',
  },
  {
    id: 'event-5',
    name: 'Final da Copa do Brasil',
    slug: 'final-copa-brasil-2026',
    description: 'A grande final da Copa do Brasil 2026! Dois gigantes do futebol brasileiro se enfrentam pela taça mais cobiçada do país.',
    date: '2026-11-12T16:00:00.000Z',
    location: 'Maracanã',
    address: 'Av. Pres. Castelo Branco - Maracanã, Rio de Janeiro - RJ',
    images: ['https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800'],
    category: 'ESPORTE',
    status: 'PUBLISHED',
    organizerId: 'org-5',
    organizer: {
      id: 'org-5',
      name: 'CBF',
      email: 'contato@cbf.com.br',
    },
    createdAt: '2024-04-01T10:00:00.000Z',
    updatedAt: '2024-06-15T18:00:00.000Z',
  },
  {
    id: 'event-6',
    name: 'Réveillon Copacabana 2027',
    slug: 'reveillon-copacabana-2027',
    description: 'A maior festa de Ano Novo do mundo! Shows, fogos de artifício e muita energia positiva na praia mais famosa do Brasil.',
    date: '2026-12-31T20:00:00.000Z',
    location: 'Praia de Copacabana',
    address: 'Av. Atlântica - Copacabana, Rio de Janeiro - RJ',
    images: ['https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800'],
    category: 'FESTA',
    status: 'PUBLISHED',
    organizerId: 'org-6',
    organizer: {
      id: 'org-6',
      name: 'Prefeitura do Rio',
      email: 'eventos@rio.rj.gov.br',
    },
    createdAt: '2024-05-01T10:00:00.000Z',
    updatedAt: '2024-06-20T10:00:00.000Z',
  },
];

// Mock Tickets for each event
export const mockTickets: Record<string, Ticket[]> = {
  'event-1': [
    {
      id: 'ticket-1-1',
      eventId: 'event-1',
      name: 'Pista',
      description: 'Acesso à área de pista geral',
      price: 595.00,
      quantity: 50000,
      sold: 35000,
      salesStart: '2024-04-01T10:00:00.000Z',
      salesEnd: '2026-09-11T23:59:00.000Z',
      features: ['Acesso à pista', 'Área de alimentação', 'Banheiros'],
    },
    {
      id: 'ticket-1-2',
      eventId: 'event-1',
      name: 'Pista Premium',
      description: 'Área mais próxima ao palco com visão privilegiada',
      price: 995.00,
      quantity: 10000,
      sold: 8500,
      salesStart: '2024-04-01T10:00:00.000Z',
      salesEnd: '2026-09-11T23:59:00.000Z',
      features: ['Área exclusiva próxima ao palco', 'Bar exclusivo', 'Banheiros VIP', 'Entrada prioritária'],
    },
    {
      id: 'ticket-1-3',
      eventId: 'event-1',
      name: 'Camarote',
      description: 'Experiência VIP com open bar e vista privilegiada',
      price: 2500.00,
      quantity: 2000,
      sold: 1800,
      salesStart: '2024-04-01T10:00:00.000Z',
      salesEnd: '2026-09-11T23:59:00.000Z',
      features: ['Open bar premium', 'Buffet completo', 'Vista privilegiada', 'Estacionamento VIP', 'Acesso ao backstage'],
    },
  ],
  'event-2': [
    {
      id: 'ticket-2-1',
      eventId: 'event-2',
      name: 'Pista',
      description: 'Acesso à área de pista',
      price: 450.00,
      quantity: 30000,
      sold: 25000,
      salesStart: '2024-06-01T10:00:00.000Z',
      salesEnd: '2026-03-14T23:59:00.000Z',
      features: ['Acesso à pista', 'Área de alimentação'],
    },
    {
      id: 'ticket-2-2',
      eventId: 'event-2',
      name: 'Cadeira Inferior',
      description: 'Assento numerado no anel inferior',
      price: 680.00,
      quantity: 15000,
      sold: 12000,
      salesStart: '2024-06-01T10:00:00.000Z',
      salesEnd: '2026-03-14T23:59:00.000Z',
      features: ['Assento numerado', 'Boa visibilidade', 'Acesso a bares'],
    },
    {
      id: 'ticket-2-3',
      eventId: 'event-2',
      name: 'Cadeira Superior',
      description: 'Assento numerado no anel superior',
      price: 380.00,
      quantity: 20000,
      sold: 15000,
      salesStart: '2024-06-01T10:00:00.000Z',
      salesEnd: '2026-03-14T23:59:00.000Z',
      features: ['Assento numerado', 'Vista panorâmica'],
    },
  ],
  'event-3': [
    {
      id: 'ticket-3-1',
      eventId: 'event-3',
      name: 'Lolla Pass (3 dias)',
      description: 'Acesso aos 3 dias de festival',
      price: 1650.00,
      quantity: 40000,
      sold: 30000,
      salesStart: '2024-09-01T10:00:00.000Z',
      salesEnd: '2026-03-27T23:59:00.000Z',
      features: ['Acesso aos 3 dias', 'Todas as áreas gerais', 'Área de alimentação'],
    },
    {
      id: 'ticket-3-2',
      eventId: 'event-3',
      name: 'Lolla Lounge (3 dias)',
      description: 'Experiência premium com área exclusiva',
      price: 3200.00,
      quantity: 5000,
      sold: 4200,
      salesStart: '2024-09-01T10:00:00.000Z',
      salesEnd: '2026-03-27T23:59:00.000Z',
      features: ['Acesso aos 3 dias', 'Área lounge exclusiva', 'Open bar', 'Buffet', 'Banheiros VIP'],
    },
    {
      id: 'ticket-3-3',
      eventId: 'event-3',
      name: 'Day Pass - Sexta',
      description: 'Acesso apenas na sexta-feira',
      price: 650.00,
      quantity: 15000,
      sold: 10000,
      salesStart: '2024-09-01T10:00:00.000Z',
      salesEnd: '2026-03-27T23:59:00.000Z',
      features: ['Acesso dia 28/03', 'Todas as áreas gerais'],
    },
  ],
  'event-4': [
    {
      id: 'ticket-4-1',
      eventId: 'event-4',
      name: 'Plateia A',
      description: 'Melhores lugares da casa',
      price: 450.00,
      quantity: 200,
      sold: 100,
      salesStart: '2024-10-01T10:00:00.000Z',
      salesEnd: '2026-02-13T23:59:00.000Z',
      features: ['Melhor visibilidade', 'Assento numerado', 'Programa do espetáculo'],
    },
    {
      id: 'ticket-4-2',
      eventId: 'event-4',
      name: 'Plateia B',
      description: 'Ótima visão do palco',
      price: 320.00,
      quantity: 300,
      sold: 150,
      salesStart: '2024-10-01T10:00:00.000Z',
      salesEnd: '2026-02-13T23:59:00.000Z',
      features: ['Boa visibilidade', 'Assento numerado'],
    },
    {
      id: 'ticket-4-3',
      eventId: 'event-4',
      name: 'Balcão',
      description: 'Vista panorâmica do espetáculo',
      price: 180.00,
      quantity: 400,
      sold: 200,
      salesStart: '2024-10-01T10:00:00.000Z',
      salesEnd: '2026-02-13T23:59:00.000Z',
      features: ['Vista panorâmica', 'Assento numerado'],
    },
  ],
  'event-5': [
    {
      id: 'ticket-5-1',
      eventId: 'event-5',
      name: 'Arquibancada',
      description: 'Setor de arquibancada geral',
      price: 250.00,
      quantity: 50000,
      sold: 35000,
      salesStart: '2024-10-01T10:00:00.000Z',
      salesEnd: '2026-11-11T23:59:00.000Z',
      features: ['Acesso à arquibancada', 'Vista do campo'],
    },
    {
      id: 'ticket-5-2',
      eventId: 'event-5',
      name: 'Cadeira Numerada',
      description: 'Assento numerado com melhor conforto',
      price: 450.00,
      quantity: 20000,
      sold: 15000,
      salesStart: '2024-10-01T10:00:00.000Z',
      salesEnd: '2026-11-11T23:59:00.000Z',
      features: ['Assento numerado', 'Maior conforto', 'Boa visibilidade'],
    },
    {
      id: 'ticket-5-3',
      eventId: 'event-5',
      name: 'Camarote',
      description: 'Experiência VIP com serviço completo',
      price: 1500.00,
      quantity: 3000,
      sold: 2000,
      salesStart: '2024-10-01T10:00:00.000Z',
      salesEnd: '2026-11-11T23:59:00.000Z',
      features: ['Open bar', 'Buffet', 'Estacionamento VIP', 'Vista privilegiada'],
    },
  ],
  'event-6': [
    {
      id: 'ticket-6-1',
      eventId: 'event-6',
      name: 'Área Geral',
      description: 'Acesso à área de shows na praia',
      price: 0,
      quantity: 1000000,
      sold: 500000,
      salesStart: '2024-11-01T10:00:00.000Z',
      salesEnd: '2026-12-31T18:00:00.000Z',
      features: ['Acesso livre', 'Shows gratuitos'],
    },
    {
      id: 'ticket-6-2',
      eventId: 'event-6',
      name: 'Área VIP Copacabana Palace',
      description: 'Experiência exclusiva no hotel mais famoso do Brasil',
      price: 5000.00,
      quantity: 500,
      sold: 300,
      salesStart: '2024-11-01T10:00:00.000Z',
      salesEnd: '2026-12-30T23:59:00.000Z',
      features: ['Open bar premium', 'Buffet internacional', 'Vista privilegiada dos fogos', 'DJ exclusivo'],
    },
  ],
};

// In-memory cart storage
let mockCart: Cart = {
  id: 'cart-1',
  items: [],
  subtotal: 0,
  total: 0,
  itemCount: 0,
};

// In-memory orders storage
let mockOrders: Order[] = [];

// Helper to get event by id
const getEventById = (eventId: string): Event | undefined => {
  return mockEvents.find(e => e.id === eventId);
};

// Helper to get ticket by id
const getTicketById = (ticketId: string): Ticket | undefined => {
  for (const tickets of Object.values(mockTickets)) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) return ticket;
  }
  return undefined;
};

// Cart operations
export const mockCartOperations = {
  getCart: (): Cart => {
    return { ...mockCart };
  },

  addToCart: (ticketId: string, quantity: number): Cart => {
    const ticket = getTicketById(ticketId);
    if (!ticket) throw new Error('Ingresso não encontrado');

    const event = getEventById(ticket.eventId);

    // Check if item already exists
    const existingItemIndex = mockCart.items.findIndex(
      item => item.ticket.id === ticketId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      mockCart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `cart-item-${Date.now()}`,
        quantity,
        ticket: {
          ...ticket,
          event: event ? {
            id: event.id,
            name: event.name,
            date: event.date,
            location: event.location,
            images: event.images,
          } : undefined,
        } as CartItem['ticket'],
      };
      mockCart.items.push(newItem);
    }

    // Recalculate totals
    mockCart.subtotal = mockCart.items.reduce(
      (sum, item) => sum + item.ticket.price * item.quantity,
      0
    );
    mockCart.total = mockCart.subtotal;
    mockCart.itemCount = mockCart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...mockCart };
  },

  updateItemQuantity: (itemId: string, quantity: number): Cart => {
    const itemIndex = mockCart.items.findIndex(item => item.id === itemId);
    if (itemIndex < 0) throw new Error('Item não encontrado no carrinho');

    if (quantity <= 0) {
      mockCart.items.splice(itemIndex, 1);
    } else {
      mockCart.items[itemIndex].quantity = quantity;
    }

    // Recalculate totals
    mockCart.subtotal = mockCart.items.reduce(
      (sum, item) => sum + item.ticket.price * item.quantity,
      0
    );
    mockCart.total = mockCart.subtotal;
    mockCart.itemCount = mockCart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...mockCart };
  },

  removeItem: (itemId: string): Cart => {
    mockCart.items = mockCart.items.filter(item => item.id !== itemId);

    // Recalculate totals
    mockCart.subtotal = mockCart.items.reduce(
      (sum, item) => sum + item.ticket.price * item.quantity,
      0
    );
    mockCart.total = mockCart.subtotal;
    mockCart.itemCount = mockCart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...mockCart };
  },

  clearCart: (): void => {
    mockCart = {
      id: 'cart-1',
      items: [],
      subtotal: 0,
      total: 0,
      itemCount: 0,
    };
  },
};

// Order operations
export const mockOrderOperations = {
  createOrder: (data: {
    items: Array<{ ticketId: string; quantity: number }>;
    couponCode?: string;
    paymentMethod: string;
  }): { order: Order; payment: any } => {
    const orderItems = data.items.map((item, index) => {
      const ticket = getTicketById(item.ticketId);
      if (!ticket) throw new Error('Ingresso não encontrado');

      return {
        id: `order-item-${Date.now()}-${index}`,
        ticketId: item.ticketId,
        quantity: item.quantity,
        price: ticket.price,
        ticket: {
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
        },
        ticketInstances: Array.from({ length: item.quantity }, (_, i) => {
          const instanceId = `TKT-${Date.now()}-${index}-${i}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
          const validationCode = Math.random().toString(36).substr(2, 12).toUpperCase();
          const hashInput = `${instanceId}:${validationCode}:${ticket.eventId}`;
          const simpleHash = hashInput.split('').reduce((acc, char) => {
            return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
          }, 0).toString(16).toUpperCase();

          // Dados do QR Code para validação na entrada
          const qrData = {
            v: 1, // versão do formato
            id: instanceId,
            code: validationCode,
            evt: ticket.eventId,
            tkt: item.ticketId,
            type: ticket.name,
            ts: Date.now(),
            hash: simpleHash,
          };

          return {
            id: instanceId,
            qrCode: validationCode,
            qrCodeData: JSON.stringify(qrData),
            checkedIn: false,
          };
        }),
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Get event from first item
    const firstTicket = getTicketById(data.items[0].ticketId);
    const event = firstTicket ? getEventById(firstTicket.eventId) : undefined;

    const order: Order = {
      id: `order-${Date.now()}`,
      userId: 'demo-user-id',
      eventId: event?.id || '',
      subtotal,
      discount: 0,
      total: subtotal,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      couponCode: data.couponCode,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      event: event ? {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        images: event.images,
      } : {
        id: '',
        name: 'Evento',
        date: new Date().toISOString(),
        location: '',
        images: [],
      },
      items: orderItems,
    };

    mockOrders.unshift(order);

    // Clear cart after order
    mockCartOperations.clearCart();

    return {
      order,
      payment: {
        id: `payment-${Date.now()}`,
        status: 'approved',
        method: data.paymentMethod,
      },
    };
  },

  getOrders: (): Order[] => {
    return [...mockOrders];
  },

  getOrderById: (id: string): Order | undefined => {
    return mockOrders.find(o => o.id === id);
  },

  cancelOrder: (id: string): void => {
    const order = mockOrders.find(o => o.id === id);
    if (order) {
      order.status = 'CANCELLED';
      order.paymentStatus = 'REFUNDED';
    }
  },

  // Marcar instância de ingresso como check-in realizado
  checkInTicketInstance: (qrCodeData: string): {
    success: boolean;
    alreadyCheckedIn: boolean;
    ticketInstance?: any;
    orderItem?: any;
    order?: Order;
  } => {
    // Buscar em todos os pedidos
    for (const order of mockOrders) {
      if (!order.items) continue;

      for (const item of order.items) {
        if (!item.ticketInstances) continue;

        for (const instance of item.ticketInstances) {
          // Verificar se o qrCodeData corresponde (pode ser o JSON completo ou o ID)
          const isMatch =
            instance.qrCodeData === qrCodeData ||
            instance.id === qrCodeData ||
            instance.qrCode === qrCodeData ||
            (instance.qrCodeData && instance.qrCodeData.includes(qrCodeData));

          if (isMatch) {
            // Verificar se já foi usado
            if (instance.checkedIn) {
              return {
                success: false,
                alreadyCheckedIn: true,
                ticketInstance: instance,
                orderItem: item,
                order,
              };
            }

            // Marcar como check-in realizado
            instance.checkedIn = true;
            instance.checkedInAt = new Date().toISOString();

            return {
              success: true,
              alreadyCheckedIn: false,
              ticketInstance: instance,
              orderItem: item,
              order,
            };
          }
        }
      }
    }

    // Não encontrou o ingresso
    return {
      success: false,
      alreadyCheckedIn: false,
    };
  },

  // Buscar informações de um ingresso pelo QR Code
  getTicketInstanceByQrCode: (qrCodeData: string): {
    found: boolean;
    ticketInstance?: any;
    orderItem?: any;
    order?: Order;
    event?: any;
  } => {
    for (const order of mockOrders) {
      if (!order.items) continue;

      for (const item of order.items) {
        if (!item.ticketInstances) continue;

        for (const instance of item.ticketInstances) {
          const isMatch =
            instance.qrCodeData === qrCodeData ||
            instance.id === qrCodeData ||
            instance.qrCode === qrCodeData ||
            (instance.qrCodeData && instance.qrCodeData.includes(qrCodeData));

          if (isMatch) {
            return {
              found: true,
              ticketInstance: instance,
              orderItem: item,
              order,
              event: order.event,
            };
          }
        }
      }
    }

    return { found: false };
  },
};

// Featured events (first 3)
export const getMockFeaturedEvents = (): Event[] => {
  return mockEvents.slice(0, 3);
};

// Filter events
export const filterMockEvents = (params?: {
  category?: string;
  search?: string;
}): { events: Event[]; total: number } => {
  let filtered = [...mockEvents];

  if (params?.category && params.category !== 'all') {
    filtered = filtered.filter(e => e.category === params.category);
  }

  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      e =>
        e.name.toLowerCase().includes(searchLower) ||
        e.description.toLowerCase().includes(searchLower) ||
        e.location.toLowerCase().includes(searchLower)
    );
  }

  return { events: filtered, total: filtered.length };
};

// ==========================================
// PROMOTER / LISTS MOCK DATA
// ==========================================

// Mock Promoter Lists
const mockPromoterLists: PromoterList[] = [
  {
    id: 'list-1',
    eventId: 'event-1',
    promoterId: 'user-1',
    type: 'vip',
    name: 'Lista VIP Rock in Rio',
    maxItems: 50,
    currentItems: 12,
    expiresAt: '2026-09-12T14:00:00.000Z',
    createdAt: '2024-06-01T10:00:00.000Z',
    event: {
      id: 'event-1',
      name: 'Rock in Rio 2026',
      date: '2026-09-12T16:00:00.000Z',
      location: 'Cidade do Rock',
      images: ['https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'],
    },
    promoter: {
      id: 'user-1',
      name: 'Usuário Teste',
    },
  },
  {
    id: 'list-2',
    eventId: 'event-2',
    promoterId: 'user-1',
    type: 'desconto',
    name: 'Lista Desconto Coldplay',
    maxItems: 30,
    currentItems: 8,
    expiresAt: '2026-03-15T18:00:00.000Z',
    createdAt: '2024-07-15T10:00:00.000Z',
    event: {
      id: 'event-2',
      name: 'Show do Coldplay',
      date: '2026-03-15T20:00:00.000Z',
      location: 'Allianz Parque',
      images: ['https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'],
    },
    promoter: {
      id: 'user-1',
      name: 'Usuário Teste',
    },
  },
  {
    id: 'list-3',
    eventId: 'event-3',
    promoterId: 'user-1',
    type: 'divulgador',
    name: 'Lista Divulgador Lollapalooza',
    maxItems: 100,
    currentItems: 45,
    expiresAt: '2026-03-28T10:00:00.000Z',
    createdAt: '2024-08-01T10:00:00.000Z',
    event: {
      id: 'event-3',
      name: 'Lollapalooza Brasil 2026',
      date: '2026-03-28T12:00:00.000Z',
      location: 'Autódromo de Interlagos',
      images: ['https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800'],
    },
    promoter: {
      id: 'user-1',
      name: 'Usuário Teste',
    },
  },
];

// Mock List Items
let mockListItems: ListItem[] = [
  {
    id: 'item-1',
    listId: 'list-1',
    name: 'João Silva',
    phone: '11999887766',
    cpf: '123.456.789-00',
    checkedIn: false,
    createdBy: 'user-1',
    createdAt: '2024-06-15T14:30:00.000Z',
  },
  {
    id: 'item-2',
    listId: 'list-1',
    name: 'Maria Santos',
    phone: '11988776655',
    checkedIn: true,
    checkedInAt: '2026-09-12T17:30:00.000Z',
    createdBy: 'user-1',
    createdAt: '2024-06-16T10:00:00.000Z',
  },
  {
    id: 'item-3',
    listId: 'list-1',
    name: 'Pedro Oliveira',
    phone: '11977665544',
    checkedIn: false,
    createdBy: 'user-1',
    createdAt: '2024-06-17T09:15:00.000Z',
  },
  {
    id: 'item-4',
    listId: 'list-2',
    name: 'Ana Costa',
    phone: '11966554433',
    cpf: '987.654.321-00',
    checkedIn: false,
    createdBy: 'user-1',
    createdAt: '2024-07-20T11:00:00.000Z',
  },
  {
    id: 'item-5',
    listId: 'list-2',
    name: 'Carlos Ferreira',
    phone: '11955443322',
    checkedIn: false,
    createdBy: 'user-1',
    createdAt: '2024-07-21T16:45:00.000Z',
  },
  {
    id: 'item-6',
    listId: 'list-3',
    name: 'Fernanda Lima',
    phone: '11944332211',
    checkedIn: false,
    createdBy: 'user-1',
    createdAt: '2024-08-05T10:30:00.000Z',
  },
];

// Mock Action Logs (para anti-fraude)
let mockActionLogs: ListActionLog[] = [];

// Promoter Operations
export const mockPromoterOperations = {
  getMyLists: (): PromoterList[] => {
    return [...mockPromoterLists];
  },

  getListsByEvent: (eventId: string): PromoterList[] => {
    return mockPromoterLists.filter(list => list.eventId === eventId);
  },

  getListById: (listId: string): PromoterList | undefined => {
    return mockPromoterLists.find(list => list.id === listId);
  },

  getListItems: (listId: string): ListItem[] => {
    return mockListItems.filter(item => item.listId === listId);
  },

  addItem: (listId: string, data: { name: string; phone?: string; cpf?: string }): ListItem => {
    const list = mockPromoterLists.find(l => l.id === listId);
    if (!list) throw new Error('Lista não encontrada');

    // Check if list is full
    if (list.currentItems >= list.maxItems) {
      throw new Error('Lista atingiu o limite máximo de nomes');
    }

    // Check if list expired
    if (new Date(list.expiresAt) < new Date()) {
      throw new Error('Lista expirada. Não é possível adicionar novos nomes');
    }

    // Check for duplicate name in this list (anti-fraud)
    const existingName = mockListItems.find(
      item => item.listId === listId && item.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existingName) {
      throw new Error('Este nome já está cadastrado nesta lista');
    }

    // Create new item
    const newItem: ListItem = {
      id: `item-${Date.now()}`,
      listId,
      name: data.name,
      phone: data.phone || '',
      cpf: data.cpf,
      checkedIn: false,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
    };

    mockListItems.push(newItem);

    // Update list count
    const listIndex = mockPromoterLists.findIndex(l => l.id === listId);
    if (listIndex >= 0) {
      mockPromoterLists[listIndex].currentItems += 1;
    }

    // Log action (anti-fraud)
    mockActionLogs.push({
      id: `log-${Date.now()}`,
      listId,
      promoterId: 'user-1',
      action: 'add',
      itemName: data.name,
      timestamp: new Date().toISOString(),
    });

    return newItem;
  },

  removeItem: (itemId: string): void => {
    const item = mockListItems.find(i => i.id === itemId);
    if (!item) throw new Error('Item não encontrado');

    const list = mockPromoterLists.find(l => l.id === item.listId);
    if (!list) throw new Error('Lista não encontrada');

    // Check if list expired (can't remove after expiration)
    if (new Date(list.expiresAt) < new Date()) {
      throw new Error('Lista expirada. Não é possível remover nomes');
    }

    // Check if item was already checked in (can't remove)
    if (item.checkedIn) {
      throw new Error('Não é possível remover um nome que já fez check-in');
    }

    // Remove item
    mockListItems = mockListItems.filter(i => i.id !== itemId);

    // Update list count
    const listIndex = mockPromoterLists.findIndex(l => l.id === item.listId);
    if (listIndex >= 0) {
      mockPromoterLists[listIndex].currentItems = Math.max(0, mockPromoterLists[listIndex].currentItems - 1);
    }

    // Log action (anti-fraud)
    mockActionLogs.push({
      id: `log-${Date.now()}`,
      listId: item.listId,
      promoterId: 'user-1',
      action: 'remove',
      itemName: item.name,
      timestamp: new Date().toISOString(),
    });
  },

  getStats: (): PromoterStats => {
    const totalListItems = mockListItems.length;
    const activeLists = mockPromoterLists.filter(
      list => new Date(list.expiresAt) > new Date()
    ).length;

    // Group by event
    const eventStats = mockPromoterLists.reduce((acc, list) => {
      const existing = acc.find(e => e.eventId === list.eventId);
      const listItemCount = mockListItems.filter(item => item.listId === list.id).length;

      if (existing) {
        existing.listItems += listItemCount;
      } else {
        acc.push({
          eventId: list.eventId,
          eventName: list.event?.name || 'Evento',
          sales: 0,
          revenue: 0,
          listItems: listItemCount,
        });
      }
      return acc;
    }, [] as PromoterStats['events']);

    return {
      totalSales: 0,
      totalRevenue: 0,
      totalListItems,
      activeLists,
      events: eventStats,
    };
  },

  exportList: (listId: string): string => {
    const list = mockPromoterLists.find(l => l.id === listId);
    if (!list) throw new Error('Lista não encontrada');

    const items = mockListItems.filter(item => item.listId === listId);

    // Generate CSV
    const headers = 'Nome,Telefone,CPF,Check-in,Data Check-in,Adicionado em\n';
    const rows = items.map(item =>
      `"${item.name}","${item.phone}","${item.cpf || ''}","${item.checkedIn ? 'Sim' : 'Não'}","${item.checkedInAt || ''}","${item.createdAt}"`
    ).join('\n');

    return headers + rows;
  },

  getActionLogs: (listId: string): ListActionLog[] => {
    return mockActionLogs.filter(log => log.listId === listId);
  },

  checkInItem: (itemId: string): ListItem => {
    const itemIndex = mockListItems.findIndex(i => i.id === itemId);
    if (itemIndex < 0) throw new Error('Item não encontrado');

    const item = mockListItems[itemIndex];

    if (item.checkedIn) {
      throw new Error('Este nome já fez check-in');
    }

    // Update item with check-in
    mockListItems[itemIndex] = {
      ...item,
      checkedIn: true,
      checkedInAt: new Date().toISOString(),
    };

    // Log action
    mockActionLogs.push({
      id: `log-${Date.now()}`,
      listId: item.listId,
      promoterId: 'user-1',
      action: 'checkin',
      itemName: item.name,
      timestamp: new Date().toISOString(),
    });

    return mockListItems[itemIndex];
  },

  uncheckInItem: (itemId: string): ListItem => {
    const itemIndex = mockListItems.findIndex(i => i.id === itemId);
    if (itemIndex < 0) throw new Error('Item não encontrado');

    const item = mockListItems[itemIndex];

    if (!item.checkedIn) {
      throw new Error('Este nome não fez check-in');
    }

    // Update item - remove check-in
    mockListItems[itemIndex] = {
      ...item,
      checkedIn: false,
      checkedInAt: undefined,
    };

    // Log action
    mockActionLogs.push({
      id: `log-${Date.now()}`,
      listId: item.listId,
      promoterId: 'user-1',
      action: 'uncheckin',
      itemName: item.name,
      timestamp: new Date().toISOString(),
    });

    return mockListItems[itemIndex];
  },
};
