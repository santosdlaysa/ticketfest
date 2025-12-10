import { prisma } from '../config/database.js';

export interface OrganizerStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  cancelledEvents: number;
  completedEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  todayCheckIns: number;
  upcomingEvents: any[];
  draftEventsList: any[];
  salesByDay: { date: string; amount: number; tickets: number }[];
}

export class StatsService {
  async getOrganizerStats(organizerId: string): Promise<OrganizerStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get event counts by status
    const [
      totalEvents,
      publishedEvents,
      draftEvents,
      cancelledEvents,
      completedEvents,
    ] = await Promise.all([
      prisma.event.count({ where: { organizerId } }),
      prisma.event.count({ where: { organizerId, status: 'PUBLISHED' } }),
      prisma.event.count({ where: { organizerId, status: 'DRAFT' } }),
      prisma.event.count({ where: { organizerId, status: 'CANCELLED' } }),
      prisma.event.count({ where: { organizerId, status: 'COMPLETED' } }),
    ]);

    // Get organizer's events IDs for filtering orders
    const organizerEvents = await prisma.event.findMany({
      where: { organizerId },
      select: { id: true },
    });
    const eventIds = organizerEvents.map((e) => e.id);

    // Get total tickets sold and revenue
    const salesStats = await prisma.order.aggregate({
      where: {
        eventId: { in: eventIds },
        paymentStatus: 'PAID',
      },
      _sum: {
        total: true,
      },
    });

    const ticketsSold = await prisma.orderItem.aggregate({
      where: {
        order: {
          eventId: { in: eventIds },
          paymentStatus: 'PAID',
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Get today's check-ins
    const todayCheckIns = await prisma.ticketInstance.count({
      where: {
        ticket: {
          eventId: { in: eventIds },
        },
        checkedIn: true,
        checkedInAt: { gte: startOfToday },
      },
    });

    // Get upcoming events (next 30 days, published)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        organizerId,
        status: 'PUBLISHED',
        date: { gte: now },
      },
      include: {
        tickets: {
          select: {
            quantity: true,
            sold: true,
            price: true,
          },
        },
        _count: {
          select: {
            orders: {
              where: { paymentStatus: 'PAID' },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
      take: 5,
    });

    // Get draft events
    const draftEventsList = await prisma.event.findMany({
      where: {
        organizerId,
        status: 'DRAFT',
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    // Get sales by day (last 7 days)
    const orders = await prisma.order.findMany({
      where: {
        eventId: { in: eventIds },
        paymentStatus: 'PAID',
        paidAt: { gte: sevenDaysAgo },
      },
      include: {
        items: {
          select: { quantity: true },
        },
      },
      orderBy: { paidAt: 'asc' },
    });

    // Group orders by day
    const salesByDayMap = new Map<string, { amount: number; tickets: number }>();

    // Initialize last 7 days with zeros
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      salesByDayMap.set(dateStr, { amount: 0, tickets: 0 });
    }

    // Fill with actual sales data
    orders.forEach((order) => {
      if (order.paidAt) {
        const dateStr = order.paidAt.toISOString().split('T')[0];
        const current = salesByDayMap.get(dateStr) || { amount: 0, tickets: 0 };
        const ticketCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        salesByDayMap.set(dateStr, {
          amount: current.amount + order.total,
          tickets: current.tickets + ticketCount,
        });
      }
    });

    const salesByDay = Array.from(salesByDayMap.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      tickets: data.tickets,
    }));

    return {
      totalEvents,
      publishedEvents,
      draftEvents,
      cancelledEvents,
      completedEvents,
      totalTicketsSold: ticketsSold._sum.quantity || 0,
      totalRevenue: salesStats._sum.total || 0,
      todayCheckIns,
      upcomingEvents: upcomingEvents.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        date: event.date,
        location: event.location,
        status: event.status,
        totalTickets: event.tickets.reduce((sum, t) => sum + t.quantity, 0),
        soldTickets: event.tickets.reduce((sum, t) => sum + t.sold, 0),
        revenue: event.tickets.reduce((sum, t) => sum + t.price * t.sold, 0),
        ordersCount: event._count.orders,
      })),
      draftEventsList: draftEventsList.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        date: event.date,
        updatedAt: event.updatedAt,
      })),
      salesByDay,
    };
  }

  async getEventStats(eventId: string, organizerId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId },
    });

    if (!event) {
      throw new Error('Event not found or you do not have permission');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      tickets,
      orders,
      todayCheckIns,
      totalCheckIns,
    ] = await Promise.all([
      prisma.ticket.findMany({
        where: { eventId },
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          sold: true,
        },
      }),
      prisma.order.aggregate({
        where: { eventId, paymentStatus: 'PAID' },
        _sum: { total: true },
        _count: true,
      }),
      prisma.ticketInstance.count({
        where: {
          ticket: { eventId },
          checkedIn: true,
          checkedInAt: { gte: startOfToday },
        },
      }),
      prisma.ticketInstance.count({
        where: {
          ticket: { eventId },
          checkedIn: true,
        },
      }),
    ]);

    const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);
    const soldTickets = tickets.reduce((sum, t) => sum + t.sold, 0);

    return {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        status: event.status,
      },
      tickets: tickets.map((t) => ({
        ...t,
        available: t.quantity - t.sold,
        percentSold: t.quantity > 0 ? Math.round((t.sold / t.quantity) * 100) : 0,
      })),
      summary: {
        totalTickets,
        soldTickets,
        availableTickets: totalTickets - soldTickets,
        percentSold: totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0,
        totalRevenue: orders._sum.total || 0,
        ordersCount: orders._count,
        todayCheckIns,
        totalCheckIns,
      },
    };
  }
}
