import { query, transaction } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { PaymentService } from './payment.service.js';
import { EmailService } from './email.service.js';
import { OrderService } from './order.service.js';
import { payoutService } from './payout.service.js';

const paymentService = new PaymentService();
const emailService = new EmailService();
const orderService = new OrderService();

interface OrdersFilters {
  page: number;
  limit: number;
  status?: string;
  paymentStatus?: string;
  eventId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  userId?: string;
}

interface SalesReportFilters {
  startDate?: string;
  endDate?: string;
  eventId?: string;
  userId?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export class AdminService {
  async getAllOrders(filters: OrdersFilters) {
    const { page, limit, status, paymentStatus, eventId, startDate, endDate, search, userId } = filters;
    const skip = (page - 1) * limit;

    let conditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`e.organizer_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (status) {
      conditions.push(`o.status = $${paramIndex++}`);
      params.push(status);
    }

    if (paymentStatus) {
      conditions.push(`o.payment_status = $${paramIndex++}`);
      params.push(paymentStatus);
    }

    if (eventId) {
      conditions.push(`o.event_id = $${paramIndex++}`);
      params.push(eventId);
    }

    if (startDate) {
      conditions.push(`o.created_at >= $${paramIndex++}`);
      params.push(new Date(startDate));
    }

    if (endDate) {
      conditions.push(`o.created_at <= $${paramIndex++}`);
      params.push(new Date(endDate));
    }

    if (search) {
      conditions.push(`(o.id::text ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR e.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const ordersResult = await query<any>(
      `SELECT o.*, u.id as user_id, u.name as user_name, u.email as user_email, u.phone as user_phone,
              e.id as event_id, e.name as event_name, e.date as event_date, e.location as event_location
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ${limit} OFFSET ${skip}`,
      params
    );

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       ${whereClause}`,
      params
    );

    // Get items for each order
    const orderIds = ordersResult.rows.map((o: any) => o.id);
    let itemsByOrder = new Map<string, any[]>();

    if (orderIds.length > 0) {
      const itemsResult = await query<any>(
        `SELECT oi.*, t.id as ticket_id, t.name as ticket_name, t.price as ticket_price
         FROM order_items oi
         JOIN tickets t ON oi.ticket_id = t.id
         WHERE oi.order_id = ANY($1)`,
        [orderIds]
      );

      itemsResult.rows.forEach((item: any) => {
        if (!itemsByOrder.has(item.order_id)) {
          itemsByOrder.set(item.order_id, []);
        }
        itemsByOrder.get(item.order_id)!.push({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          ticket: {
            id: item.ticket_id,
            name: item.ticket_name,
            price: item.ticket_price,
          },
        });
      });
    }

    const orders = ordersResult.rows.map((o: any) => ({
      id: o.id,
      subtotal: o.subtotal,
      discount: o.discount,
      total: o.total,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      status: o.status,
      createdAt: o.created_at,
      user: {
        id: o.user_id,
        name: o.user_name,
        email: o.user_email,
        phone: o.user_phone,
      },
      event: {
        id: o.event_id,
        name: o.event_name,
        date: o.event_date,
        location: o.event_location,
      },
      items: itemsByOrder.get(o.id) || [],
    }));

    const total = parseInt(countResult.rows[0].count, 10);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderDetails(orderId: string, userId: string, userRole: string) {
    const orderResult = await query<any>(
      `SELECT o.*, u.id as user_id, u.name as user_name, u.email as user_email, u.phone as user_phone, u.cpf as user_cpf,
              e.id as event_id, e.name as event_name, e.date as event_date, e.location as event_location, e.address as event_address, e.organizer_id
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, 'Order not found');
    }

    const order = orderResult.rows[0];

    if (userRole === 'ORGANIZER' && order.organizer_id !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    // Get items with ticket instances
    const itemsResult = await query<any>(
      `SELECT oi.*, t.id as ticket_id, t.name as ticket_name, t.price as ticket_price, t.description as ticket_description
       FROM order_items oi
       JOIN tickets t ON oi.ticket_id = t.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const instancesResult = await query<any>(
      `SELECT ti.* FROM ticket_instances ti
       JOIN order_items oi ON ti.order_item_id = oi.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const instancesByItem = new Map<string, any[]>();
    instancesResult.rows.forEach((instance: any) => {
      if (!instancesByItem.has(instance.order_item_id)) {
        instancesByItem.set(instance.order_item_id, []);
      }
      instancesByItem.get(instance.order_item_id)!.push(instance);
    });

    return {
      id: order.id,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      paymentId: order.payment_id,
      status: order.status,
      couponCode: order.coupon_code,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      user: {
        id: order.user_id,
        name: order.user_name,
        email: order.user_email,
        phone: order.user_phone,
        cpf: order.user_cpf,
      },
      event: {
        id: order.event_id,
        name: order.event_name,
        date: order.event_date,
        location: order.event_location,
        address: order.event_address,
        organizerId: order.organizer_id,
      },
      items: itemsResult.rows.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        ticket: {
          id: item.ticket_id,
          name: item.ticket_name,
          price: item.ticket_price,
          description: item.ticket_description,
        },
        ticketInstances: instancesByItem.get(item.id) || [],
      })),
    };
  }

  async refundOrder(orderId: string, userId: string, userRole: string) {
    const orderResult = await query<any>(
      `SELECT o.*, e.organizer_id
       FROM orders o
       JOIN events e ON o.event_id = e.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, 'Order not found');
    }

    const order = orderResult.rows[0];

    if (userRole === 'ORGANIZER' && order.organizer_id !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    if (order.payment_status !== 'PAID') {
      throw new AppError(400, 'Order is not paid');
    }

    if (order.status === 'CANCELLED') {
      throw new AppError(400, 'Order already cancelled');
    }

    if (order.payment_id) {
      await paymentService.processRefund(order.payment_id);
    }

    await transaction(async (client) => {
      await client.query(
        `UPDATE orders SET status = 'CANCELLED', payment_status = 'REFUNDED' WHERE id = $1`,
        [orderId]
      );

      const itemsResult = await client.query<{ ticket_id: string; quantity: number }>(
        'SELECT ticket_id, quantity FROM order_items WHERE order_id = $1',
        [orderId]
      );

      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE tickets SET sold = sold - $1 WHERE id = $2',
          [item.quantity, item.ticket_id]
        );
      }
    });

    return { message: 'Order refunded successfully' };
  }

  async getSalesReport(filters: SalesReportFilters) {
    const { startDate, endDate, groupBy = 'day', eventId, userId } = filters;

    let conditions: string[] = ["o.payment_status = 'PAID'"];
    let params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`e.organizer_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (eventId) {
      conditions.push(`o.event_id = $${paramIndex++}`);
      params.push(eventId);
    }

    if (startDate) {
      conditions.push(`o.paid_at >= $${paramIndex++}`);
      params.push(new Date(startDate));
    }

    if (endDate) {
      conditions.push(`o.paid_at <= $${paramIndex++}`);
      params.push(new Date(endDate));
    }

    const whereClause = conditions.join(' AND ');

    const ordersResult = await query<any>(
      `SELECT o.*, e.id as event_id, e.name as event_name
       FROM orders o
       JOIN events e ON o.event_id = e.id
       WHERE ${whereClause}
       ORDER BY o.paid_at ASC`,
      params
    );

    const itemsResult = await query<any>(
      `SELECT oi.order_id, oi.quantity
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN events e ON o.event_id = e.id
       WHERE ${whereClause}`,
      params
    );

    const ticketsByOrder = new Map<string, number>();
    itemsResult.rows.forEach((item: any) => {
      ticketsByOrder.set(item.order_id, (ticketsByOrder.get(item.order_id) || 0) + item.quantity);
    });

    const salesByPeriod: { [key: string]: { revenue: number; tickets: number; orders: number } } = {};
    const salesByEvent: { [key: string]: { name: string; revenue: number; tickets: number; orders: number } } = {};
    const salesByPaymentMethod: { [key: string]: { revenue: number; count: number } } = {};

    let totalRevenue = 0;
    let totalTickets = 0;
    let totalOrders = ordersResult.rows.length;

    for (const order of ordersResult.rows) {
      const date = new Date(order.paid_at);
      let periodKey: string;

      if (groupBy === 'day') {
        periodKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!salesByPeriod[periodKey]) {
        salesByPeriod[periodKey] = { revenue: 0, tickets: 0, orders: 0 };
      }

      const ticketCount = ticketsByOrder.get(order.id) || 0;

      salesByPeriod[periodKey].revenue += order.total;
      salesByPeriod[periodKey].tickets += ticketCount;
      salesByPeriod[periodKey].orders += 1;

      if (!salesByEvent[order.event_id]) {
        salesByEvent[order.event_id] = { name: order.event_name, revenue: 0, tickets: 0, orders: 0 };
      }
      salesByEvent[order.event_id].revenue += order.total;
      salesByEvent[order.event_id].tickets += ticketCount;
      salesByEvent[order.event_id].orders += 1;

      if (!salesByPaymentMethod[order.payment_method]) {
        salesByPaymentMethod[order.payment_method] = { revenue: 0, count: 0 };
      }
      salesByPaymentMethod[order.payment_method].revenue += order.total;
      salesByPaymentMethod[order.payment_method].count += 1;

      totalRevenue += order.total;
      totalTickets += ticketCount;
    }

    return {
      summary: {
        totalRevenue,
        totalTickets,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      salesByPeriod: Object.entries(salesByPeriod).map(([date, data]) => ({
        date,
        ...data,
      })),
      salesByEvent: Object.entries(salesByEvent).map(([id, data]) => ({
        eventId: id,
        ...data,
      })),
      salesByPaymentMethod: Object.entries(salesByPaymentMethod).map(([method, data]) => ({
        method,
        ...data,
      })),
    };
  }

  async getDashboardData(userId?: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let eventCondition = '';
    let orderCondition = '';
    const params: any[] = [];

    if (userId) {
      eventCondition = 'AND e.organizer_id = $1';
      orderCondition = 'JOIN events e ON o.event_id = e.id WHERE e.organizer_id = $1';
      params.push(userId);
    }

    const summaryResult = await query<any>(
      `SELECT
        COALESCE(SUM(CASE WHEN o.paid_at >= $${params.length + 1} THEN o.total END), 0) as today_revenue,
        COUNT(CASE WHEN o.paid_at >= $${params.length + 1} THEN 1 END) as today_orders,
        COALESCE(SUM(CASE WHEN o.paid_at >= $${params.length + 2} AND o.paid_at < $${params.length + 1} THEN o.total END), 0) as yesterday_revenue,
        COALESCE(SUM(CASE WHEN o.paid_at >= $${params.length + 3} THEN o.total END), 0) as week_revenue,
        COUNT(CASE WHEN o.paid_at >= $${params.length + 3} THEN 1 END) as week_orders,
        COALESCE(SUM(CASE WHEN o.paid_at >= $${params.length + 4} THEN o.total END), 0) as month_revenue,
        COUNT(CASE WHEN o.paid_at >= $${params.length + 4} THEN 1 END) as month_orders,
        COALESCE(SUM(o.total), 0) as total_revenue,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN o.payment_status = 'PENDING' THEN 1 END) as pending_orders
       FROM orders o
       ${userId ? orderCondition : ''}
       ${userId ? 'AND' : 'WHERE'} o.payment_status = 'PAID'`,
      [...params, today, yesterday, thisWeekStart, thisMonthStart]
    );

    const summary = summaryResult.rows[0];

    const todayRevenue = parseFloat(summary.today_revenue);
    const yesterdayRevenue = parseFloat(summary.yesterday_revenue);
    const dailyGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    // Get recent orders
    const recentOrdersResult = await query<any>(
      `SELECT o.*, u.name as user_name, u.email as user_email, e.name as event_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       ${userId ? 'WHERE e.organizer_id = $1' : ''}
       ORDER BY o.created_at DESC
       LIMIT 10`,
      params
    );

    // Get upcoming events
    const upcomingEventsResult = await query<any>(
      `SELECT e.id, e.name, e.date, e.location,
              COALESCE(SUM(t.sold), 0) as tickets_sold,
              COALESCE(SUM(t.quantity), 0) as total_capacity
       FROM events e
       LEFT JOIN tickets t ON e.id = t.event_id
       WHERE e.date >= $${params.length + 1} AND e.status = 'PUBLISHED' ${eventCondition}
       GROUP BY e.id, e.name, e.date, e.location
       ORDER BY e.date ASC
       LIMIT 5`,
      [...params, now]
    );

    return {
      summary: {
        todayRevenue,
        todayOrders: parseInt(summary.today_orders, 10),
        todayTickets: 0,
        pendingOrders: parseInt(summary.pending_orders, 10),
        weekRevenue: parseFloat(summary.week_revenue),
        weekOrders: parseInt(summary.week_orders, 10),
        monthRevenue: parseFloat(summary.month_revenue),
        monthOrders: parseInt(summary.month_orders, 10),
        totalRevenue: parseFloat(summary.total_revenue),
        totalOrders: parseInt(summary.total_orders, 10),
        dailyGrowth,
      },
      recentOrders: recentOrdersResult.rows.map((order: any) => ({
        id: order.id,
        customer: order.user_name,
        email: order.user_email,
        event: order.event_name,
        total: order.total,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
      })),
      upcomingEvents: upcomingEventsResult.rows.map((event: any) => ({
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        ticketsSold: parseInt(event.tickets_sold, 10),
        totalCapacity: parseInt(event.total_capacity, 10),
        occupancy: event.total_capacity > 0 ? (event.tickets_sold / event.total_capacity) * 100 : 0,
      })),
      topEvents: [],
    };
  }

  async exportEventAttendees(eventId: string, userId: string, userRole: string) {
    const eventResult = await query<any>(
      'SELECT id, name, organizer_id FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    const event = eventResult.rows[0];

    if (userRole === 'ORGANIZER' && event.organizer_id !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    const attendeesResult = await query<any>(
      `SELECT u.name, u.email, u.phone, u.cpf, t.name as ticket_name,
              ti.id as ticket_instance_id, ti.checked_in, ti.checked_in_at, o.created_at as purchase_date
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN tickets t ON oi.ticket_id = t.id
       JOIN ticket_instances ti ON oi.id = ti.order_item_id
       WHERE o.event_id = $1 AND o.payment_status = 'PAID'
       ORDER BY o.created_at ASC`,
      [eventId]
    );

    const headers = [
      'Nome',
      'Email',
      'Telefone',
      'CPF',
      'Tipo de Ingresso',
      'Codigo do Ingresso',
      'Data da Compra',
      'Check-in Realizado',
      'Data do Check-in',
    ];

    const rows = attendeesResult.rows.map((row: any) => [
      row.name,
      row.email,
      row.phone || '',
      row.cpf || '',
      row.ticket_name,
      row.ticket_instance_id.slice(0, 8).toUpperCase(),
      new Date(row.purchase_date).toLocaleDateString('pt-BR'),
      row.checked_in ? 'Sim' : 'Nao',
      row.checked_in_at ? new Date(row.checked_in_at).toLocaleString('pt-BR') : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const filename = `participantes_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      data: csvContent,
      filename,
      contentType: 'text/csv; charset=utf-8',
      summary: {
        totalAttendees: rows.length,
        checkedIn: rows.filter((r: string[]) => r[7] === 'Sim').length,
        notCheckedIn: rows.filter((r: string[]) => r[7] === 'Nao').length,
      },
    };
  }

  async confirmPaymentManual(orderId: string) {
    return orderService.confirmPaymentManual(orderId);
  }

  async resendOrderEmail(orderId: string) {
    const orderResult = await query<any>(
      `SELECT o.*, u.email as user_email, e.name as event_name, e.date as event_date
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, 'Pedido não encontrado');
    }

    const order = orderResult.rows[0];

    if (order.payment_status !== 'PAID') {
      throw new AppError(400, 'Pedido ainda não foi pago');
    }

    // Get order items
    const itemsResult = await query<any>(
      `SELECT t.name as ticket_name, oi.quantity, oi.price
       FROM order_items oi
       JOIN tickets t ON oi.ticket_id = t.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    // Send confirmation email
    await emailService.sendOrderConfirmation(order.user_email, {
      orderId: order.id,
      eventName: order.event_name,
      eventDate: new Date(order.event_date).toLocaleDateString('pt-BR'),
      tickets: itemsResult.rows.map((item: any) => ({
        name: item.ticket_name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
    });

    // Get ticket instances and send tickets email
    const instancesResult = await query<any>(
      `SELECT ti.qr_code, t.name as ticket_name
       FROM ticket_instances ti
       JOIN order_items oi ON ti.order_item_id = oi.id
       JOIN tickets t ON ti.ticket_id = t.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const tickets = instancesResult.rows.map((instance: any) => ({
      eventName: order.event_name,
      ticketName: instance.ticket_name,
      qrCode: instance.qr_code,
    }));

    await emailService.sendTickets(order.user_email, tickets);

    return { message: 'Emails reenviados com sucesso!' };
  }

  async getFinancialSummary(filters: { startDate?: string; endDate?: string; userId?: string }) {
    const { startDate, endDate, userId } = filters;

    let dateConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      dateConditions.push(`e.organizer_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (startDate) {
      dateConditions.push(`o.created_at >= $${paramIndex++}`);
      params.push(new Date(startDate));
    }

    if (endDate) {
      dateConditions.push(`o.created_at <= $${paramIndex++}`);
      params.push(new Date(endDate));
    }

    const dateWhereClause = dateConditions.length > 0 ? `WHERE ${dateConditions.join(' AND ')}` : '';

    // Get revenue by payment status
    const revenueResult = await query<any>(
      `SELECT
        COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN o.payment_status = 'PENDING' THEN o.total ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN o.payment_status = 'REFUNDED' THEN o.total ELSE 0 END), 0) as refunded
       FROM orders o
       JOIN events e ON o.event_id = e.id
       ${dateWhereClause}`,
      params
    );

    // Get orders count by payment status
    const ordersResult = await query<any>(
      `SELECT
        COUNT(CASE WHEN o.payment_status = 'PAID' THEN 1 END) as paid,
        COUNT(CASE WHEN o.payment_status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN o.payment_status = 'REFUNDED' THEN 1 END) as refunded,
        COUNT(CASE WHEN o.payment_status = 'FAILED' THEN 1 END) as failed
       FROM orders o
       JOIN events e ON o.event_id = e.id
       ${dateWhereClause}`,
      params
    );

    const revenue = revenueResult.rows[0];
    const orders = ordersResult.rows[0];

    const paidRevenue = parseFloat(revenue.paid);
    const refundedRevenue = parseFloat(revenue.refunded);

    // Calculate splits (platform fee = 10%)
    const platformFeeRate = 0.10;
    const platformRevenue = paidRevenue * platformFeeRate;
    const organizerRevenue = paidRevenue * (1 - platformFeeRate);
    const pendingAmount = parseFloat(revenue.pending);

    return {
      revenue: {
        paid: paidRevenue,
        pending: pendingAmount,
        refunded: refundedRevenue,
      },
      orders: {
        paid: parseInt(orders.paid || '0', 10),
        pending: parseInt(orders.pending || '0', 10),
        refunded: parseInt(orders.refunded || '0', 10),
        failed: parseInt(orders.failed || '0', 10),
      },
      splits: {
        platformRevenue,
        organizerRevenue,
        pendingAmount,
      },
      organizerBalance: userId ? {
        availableBalance: organizerRevenue,
        pendingBalance: pendingAmount * (1 - platformFeeRate),
      } : undefined,
    };
  }

  async getRevenueReport(filters: { startDate?: string; endDate?: string; eventId?: string; userId?: string }) {
    const { startDate, endDate, eventId, userId } = filters;

    let conditions: string[] = ["o.payment_status = 'PAID'"];
    let params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`e.organizer_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (eventId) {
      conditions.push(`o.event_id = $${paramIndex++}`);
      params.push(eventId);
    }

    if (startDate) {
      conditions.push(`o.paid_at >= $${paramIndex++}`);
      params.push(new Date(startDate));
    }

    if (endDate) {
      conditions.push(`o.paid_at <= $${paramIndex++}`);
      params.push(new Date(endDate));
    }

    const whereClause = conditions.join(' AND ');

    const revenueResult = await query<any>(
      `SELECT
        COALESCE(SUM(o.subtotal), 0) as gross_revenue,
        COALESCE(SUM(o.discount), 0) as discounts,
        COALESCE(SUM(o.total), 0) as net_revenue
       FROM orders o
       JOIN events e ON o.event_id = e.id
       WHERE ${whereClause}`,
      params
    );

    // Get refunds separately (orders that were refunded)
    let refundConditions: string[] = ["o.payment_status = 'REFUNDED'"];
    let refundParams: any[] = [];
    let refundParamIndex = 1;

    if (userId) {
      refundConditions.push(`e.organizer_id = $${refundParamIndex++}`);
      refundParams.push(userId);
    }

    if (eventId) {
      refundConditions.push(`o.event_id = $${refundParamIndex++}`);
      refundParams.push(eventId);
    }

    if (startDate) {
      refundConditions.push(`o.created_at >= $${refundParamIndex++}`);
      refundParams.push(new Date(startDate));
    }

    if (endDate) {
      refundConditions.push(`o.created_at <= $${refundParamIndex++}`);
      refundParams.push(new Date(endDate));
    }

    const refundWhereClause = refundConditions.join(' AND ');

    const refundsResult = await query<any>(
      `SELECT COALESCE(SUM(o.total), 0) as refunds
       FROM orders o
       JOIN events e ON o.event_id = e.id
       WHERE ${refundWhereClause}`,
      refundParams
    );

    const revenue = revenueResult.rows[0];
    const grossRevenue = parseFloat(revenue.gross_revenue);
    const discounts = parseFloat(revenue.discounts);
    const netRevenue = parseFloat(revenue.net_revenue);
    const refunds = parseFloat(refundsResult.rows[0]?.refunds || '0');

    return {
      grossRevenue,
      discounts,
      netRevenue,
      refunds,
      finalRevenue: netRevenue - refunds,
    };
  }

  async getTransactions(filters: {
    page: number;
    limit: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
  }) {
    const { page, limit, status, startDate, endDate, userId } = filters;
    const skip = (page - 1) * limit;

    let conditions: string[] = ["o.payment_status = 'PAID'"];
    let params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`e.organizer_id = $${paramIndex++}`);
      params.push(userId);
    }

    // Map frontend status to transaction status
    if (status) {
      if (status === 'COMPLETED') {
        conditions.push(`o.payment_status = 'PAID'`);
      } else if (status === 'REFUNDED') {
        conditions = conditions.filter(c => c !== "o.payment_status = 'PAID'");
        conditions.push(`o.payment_status = 'REFUNDED'`);
      }
    }

    if (startDate) {
      conditions.push(`o.created_at >= $${paramIndex++}`);
      params.push(new Date(startDate));
    }

    if (endDate) {
      conditions.push(`o.created_at <= $${paramIndex++}`);
      params.push(new Date(endDate));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const transactionsResult = await query<any>(
      `SELECT o.id, o.total, o.subtotal, o.discount, o.payment_method, o.payment_status, o.payment_id,
              o.created_at, o.paid_at, u.id as user_id, u.name as user_name, u.email as user_email,
              e.id as event_id, e.name as event_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ${limit} OFFSET ${skip}`,
      params
    );

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM orders o
       JOIN events e ON o.event_id = e.id
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // Platform fee rate (10%)
    const platformFeeRate = 0.10;

    return {
      transactions: transactionsResult.rows.map((row: any) => {
        const totalAmount = parseFloat(row.total);
        const platformAmount = totalAmount * platformFeeRate;
        const organizerAmount = totalAmount * (1 - platformFeeRate);

        // Map payment_status to transaction status
        let transactionStatus = 'COMPLETED';
        if (row.payment_status === 'REFUNDED') transactionStatus = 'REFUNDED';
        else if (row.payment_status === 'PENDING') transactionStatus = 'PENDING';
        else if (row.payment_status === 'FAILED') transactionStatus = 'FAILED';

        return {
          id: row.id,
          orderId: row.id,
          totalAmount,
          platformAmount,
          platformFee: 0,
          organizerAmount,
          status: transactionStatus,
          createdAt: row.created_at,
          processedAt: row.paid_at,
          order: {
            id: row.id,
            event: {
              id: row.event_id,
              name: row.event_name,
            },
            user: {
              id: row.user_id,
              name: row.user_name,
              email: row.user_email,
            },
          },
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllPayouts(filters: { page: number; limit: number; status?: string; startDate?: string; endDate?: string; userId?: string }) {
    return payoutService.getAllPayouts({
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  }

  async approvePayout(payoutId: string, adminId: string) {
    return payoutService.approvePayout(payoutId, adminId);
  }

  async rejectPayout(payoutId: string, adminId: string, reason: string) {
    return payoutService.rejectPayout(payoutId, adminId, reason);
  }

  async exportReport(filters: {
    type: 'orders' | 'sales' | 'revenue';
    format: 'csv' | 'xlsx';
    startDate?: string;
    endDate?: string;
    eventId?: string;
    userId?: string;
  }) {
    const { type, startDate, endDate, eventId, userId } = filters;

    let data: any;
    if (type === 'orders') {
      data = await this.getAllOrders({ page: 1, limit: 10000, startDate, endDate, eventId, userId });
    } else {
      data = await this.getSalesReport({ startDate, endDate, eventId, userId });
    }

    let csvContent: string;
    let filename: string;

    if (type === 'orders') {
      const headers = ['ID', 'Cliente', 'Email', 'Evento', 'Total', 'Status', 'Pagamento', 'Data'];
      const rows = data.orders.map((o: any) => [
        o.id,
        o.user.name,
        o.user.email,
        o.event.name,
        o.total,
        o.status,
        o.paymentStatus,
        new Date(o.createdAt).toLocaleDateString('pt-BR'),
      ]);
      csvContent = [headers.join(','), ...rows.map((r: any[]) => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      filename = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Data', 'Receita', 'Ingressos', 'Pedidos'];
      const rows = data.salesByPeriod.map((s: any) => [s.date, s.revenue, s.tickets, s.orders]);
      csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
      filename = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
    }

    return {
      data: csvContent,
      filename,
      contentType: 'text/csv; charset=utf-8',
    };
  }
}
