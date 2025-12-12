import { query } from '../config/database.js';

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
    const countsResult = await query<{
      total: string;
      published: string;
      draft: string;
      cancelled: string;
      completed: string;
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PUBLISHED') as published,
        COUNT(*) FILTER (WHERE status = 'DRAFT') as draft,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed
       FROM events WHERE organizer_id = $1`,
      [organizerId]
    );

    const counts = countsResult.rows[0];

    // Get total revenue and tickets sold
    const salesResult = await query<{ total_revenue: string | null; total_tickets: string | null }>(
      `SELECT COALESCE(SUM(o.total), 0) as total_revenue,
              COALESCE(SUM(oi.quantity), 0) as total_tickets
       FROM orders o
       JOIN events e ON o.event_id = e.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE e.organizer_id = $1 AND o.payment_status = 'PAID'`,
      [organizerId]
    );

    // Get today's check-ins
    const checkInsResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM ticket_instances ti
       JOIN tickets t ON ti.ticket_id = t.id
       JOIN events e ON t.event_id = e.id
       WHERE e.organizer_id = $1 AND ti.checked_in = true AND ti.checked_in_at >= $2`,
      [organizerId, startOfToday]
    );

    // Get upcoming events
    const upcomingResult = await query<{
      id: string;
      name: string;
      slug: string;
      date: Date;
      location: string;
      status: string;
      total_tickets: string;
      sold_tickets: string;
      total_revenue: string;
      orders_count: string;
    }>(
      `SELECT e.id, e.name, e.slug, e.date, e.location, e.status,
              COALESCE(SUM(t.quantity), 0) as total_tickets,
              COALESCE(SUM(t.sold), 0) as sold_tickets,
              COALESCE(SUM(t.price * t.sold), 0) as total_revenue,
              COUNT(DISTINCT CASE WHEN o.payment_status = 'PAID' THEN o.id END) as orders_count
       FROM events e
       LEFT JOIN tickets t ON e.id = t.event_id
       LEFT JOIN orders o ON e.id = o.event_id
       WHERE e.organizer_id = $1 AND e.status = 'PUBLISHED' AND e.date >= $2
       GROUP BY e.id, e.name, e.slug, e.date, e.location, e.status
       ORDER BY e.date ASC
       LIMIT 5`,
      [organizerId, now]
    );

    // Get draft events
    const draftResult = await query<{
      id: string;
      name: string;
      slug: string;
      date: Date;
      updated_at: Date;
    }>(
      `SELECT id, name, slug, date, updated_at
       FROM events
       WHERE organizer_id = $1 AND status = 'DRAFT'
       ORDER BY updated_at DESC
       LIMIT 5`,
      [organizerId]
    );

    // Get sales by day (last 7 days)
    const salesByDayResult = await query<{
      order_date: string;
      amount: string;
      tickets: string;
    }>(
      `SELECT DATE(o.paid_at) as order_date,
              COALESCE(SUM(o.total), 0) as amount,
              COALESCE(SUM(oi.quantity), 0) as tickets
       FROM orders o
       JOIN events e ON o.event_id = e.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE e.organizer_id = $1 AND o.payment_status = 'PAID' AND o.paid_at >= $2
       GROUP BY DATE(o.paid_at)
       ORDER BY order_date ASC`,
      [organizerId, sevenDaysAgo]
    );

    // Initialize last 7 days with zeros
    const salesByDayMap = new Map<string, { amount: number; tickets: number }>();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      salesByDayMap.set(dateStr, { amount: 0, tickets: 0 });
    }

    // Fill with actual sales data
    salesByDayResult.rows.forEach((row) => {
      if (row.order_date) {
        salesByDayMap.set(row.order_date, {
          amount: parseFloat(row.amount),
          tickets: parseInt(row.tickets, 10),
        });
      }
    });

    const salesByDay = Array.from(salesByDayMap.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      tickets: data.tickets,
    }));

    return {
      totalEvents: parseInt(counts.total, 10),
      publishedEvents: parseInt(counts.published, 10),
      draftEvents: parseInt(counts.draft, 10),
      cancelledEvents: parseInt(counts.cancelled, 10),
      completedEvents: parseInt(counts.completed, 10),
      totalTicketsSold: parseInt(salesResult.rows[0].total_tickets || '0', 10),
      totalRevenue: parseFloat(salesResult.rows[0].total_revenue || '0'),
      todayCheckIns: parseInt(checkInsResult.rows[0].count, 10),
      upcomingEvents: upcomingResult.rows.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        date: event.date,
        location: event.location,
        status: event.status,
        totalTickets: parseInt(event.total_tickets, 10),
        soldTickets: parseInt(event.sold_tickets, 10),
        revenue: parseFloat(event.total_revenue),
        ordersCount: parseInt(event.orders_count, 10),
      })),
      draftEventsList: draftResult.rows.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        date: event.date,
        updatedAt: event.updated_at,
      })),
      salesByDay,
    };
  }

  async getEventStats(eventId: string, organizerId: string) {
    // Verify event exists and belongs to organizer
    const eventResult = await query<{
      id: string;
      name: string;
      date: Date;
      status: string;
      organizer_id: string;
    }>(
      'SELECT id, name, date, status, organizer_id FROM events WHERE id = $1 AND organizer_id = $2',
      [eventId, organizerId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error('Event not found or you do not have permission');
    }

    const event = eventResult.rows[0];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get tickets
    const ticketsResult = await query<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      sold: number;
    }>(
      'SELECT id, name, price, quantity, sold FROM tickets WHERE event_id = $1',
      [eventId]
    );

    // Get orders summary
    const ordersResult = await query<{ total_revenue: string | null; orders_count: string }>(
      `SELECT COALESCE(SUM(total), 0) as total_revenue, COUNT(*) as orders_count
       FROM orders WHERE event_id = $1 AND payment_status = 'PAID'`,
      [eventId]
    );

    // Get check-ins
    const checkInsResult = await query<{ today_checkins: string; total_checkins: string }>(
      `SELECT
        COUNT(*) FILTER (WHERE ti.checked_in_at >= $2) as today_checkins,
        COUNT(*) FILTER (WHERE ti.checked_in = true) as total_checkins
       FROM ticket_instances ti
       JOIN tickets t ON ti.ticket_id = t.id
       WHERE t.event_id = $1`,
      [eventId, startOfToday]
    );

    const tickets = ticketsResult.rows;
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
        totalRevenue: parseFloat(ordersResult.rows[0].total_revenue || '0'),
        ordersCount: parseInt(ordersResult.rows[0].orders_count, 10),
        todayCheckIns: parseInt(checkInsResult.rows[0].today_checkins, 10),
        totalCheckIns: parseInt(checkInsResult.rows[0].total_checkins, 10),
      },
    };
  }
}
