import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { PaymentService } from './payment.service.js';
import { EmailService } from './email.service.js';

const paymentService = new PaymentService();
const emailService = new EmailService();

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

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  eventId?: string;
  userId?: string;
}

interface SalesReportFilters extends ReportFilters {
  groupBy?: 'day' | 'week' | 'month';
}

interface ExportFilters extends ReportFilters {
  type: 'orders' | 'sales' | 'revenue';
  format: 'csv' | 'xlsx';
}

interface TransactionsFilters {
  page: number;
  limit: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

interface PayoutsFilters {
  page: number;
  limit: number;
  status?: string;
  userId?: string;
}

export class AdminService {
  // Orders Management
  async getAllOrders(filters: OrdersFilters) {
    const { page, limit, status, paymentStatus, eventId, startDate, endDate, search, userId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by organizer if not admin
    if (userId) {
      where.event = { organizerId: userId };
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { event: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              date: true,
              location: true,
            },
          },
          items: {
            include: {
              ticket: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderDetails(orderId: string, userId: string, userRole: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            address: true,
            organizerId: true,
          },
        },
        items: {
          include: {
            ticket: true,
            ticketInstances: true,
          },
        },
        splitTransactions: true,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Check permission for organizers
    if (userRole === 'ORGANIZER' && order.event.organizerId !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    return order;
  }

  async refundOrder(orderId: string, userId: string, userRole: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        items: true,
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Check permission for organizers
    if (userRole === 'ORGANIZER' && order.event.organizerId !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new AppError(400, 'Order is not paid');
    }

    if (order.status === 'CANCELLED') {
      throw new AppError(400, 'Order already cancelled');
    }

    // Process refund
    if (order.paymentId) {
      await paymentService.processRefund(order.paymentId);
    }

    // Update order and restore ticket counts
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        },
      });

      // Restore ticket counts
      for (const item of order.items) {
        await tx.ticket.update({
          where: { id: item.ticketId },
          data: { sold: { decrement: item.quantity } },
        });
      }
    });

    return { message: 'Order refunded successfully' };
  }

  async resendOrderEmail(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        event: true,
        items: {
          include: {
            ticket: true,
            ticketInstances: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new AppError(400, 'Order is not paid');
    }

    // Resend confirmation email
    await emailService.sendOrderConfirmation(order.user.email, {
      orderId: order.id,
      eventName: order.event.name,
      eventDate: order.event.date.toLocaleDateString('pt-BR'),
      tickets: order.items.map((item) => ({
        name: item.ticket.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
    });

    // Resend tickets
    const tickets = order.items.flatMap((item) =>
      item.ticketInstances.map((instance) => ({
        eventName: order.event.name,
        eventDate: order.event.date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        eventLocation: order.event.location,
        ticketName: item.ticket.name,
        qrCode: instance.qrCode,
        ticketCode: instance.id.slice(0, 8).toUpperCase(),
      }))
    );

    await emailService.sendTickets(order.user.email, tickets);

    return { message: 'Email sent successfully' };
  }

  // Reports
  async getSalesReport(filters: SalesReportFilters) {
    const { startDate, endDate, groupBy = 'day', eventId, userId } = filters;

    const where: any = {
      paymentStatus: 'PAID',
    };

    if (userId) {
      where.event = { organizerId: userId };
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.paidAt.lte = new Date(endDate);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { paidAt: 'asc' },
    });

    // Group by period
    const salesByPeriod: { [key: string]: { revenue: number; tickets: number; orders: number } } = {};
    const salesByEvent: { [key: string]: { name: string; revenue: number; tickets: number; orders: number } } = {};
    const salesByPaymentMethod: { [key: string]: { revenue: number; count: number } } = {};

    let totalRevenue = 0;
    let totalTickets = 0;
    let totalOrders = orders.length;

    for (const order of orders) {
      const date = order.paidAt!;
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

      const ticketCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

      salesByPeriod[periodKey].revenue += order.total;
      salesByPeriod[periodKey].tickets += ticketCount;
      salesByPeriod[periodKey].orders += 1;

      // By event
      if (!salesByEvent[order.eventId]) {
        salesByEvent[order.eventId] = { name: order.event.name, revenue: 0, tickets: 0, orders: 0 };
      }
      salesByEvent[order.eventId].revenue += order.total;
      salesByEvent[order.eventId].tickets += ticketCount;
      salesByEvent[order.eventId].orders += 1;

      // By payment method
      if (!salesByPaymentMethod[order.paymentMethod]) {
        salesByPaymentMethod[order.paymentMethod] = { revenue: 0, count: 0 };
      }
      salesByPaymentMethod[order.paymentMethod].revenue += order.total;
      salesByPaymentMethod[order.paymentMethod].count += 1;

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

  async getRevenueReport(filters: ReportFilters) {
    const { startDate, endDate, eventId, userId } = filters;

    const where: any = {
      paymentStatus: 'PAID',
    };

    if (userId) {
      where.event = { organizerId: userId };
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.paidAt.lte = new Date(endDate);
      }
    }

    const [orders, refundedOrders] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          total: true,
          discount: true,
          subtotal: true,
        },
      }),
      prisma.order.findMany({
        where: {
          ...where,
          paymentStatus: 'REFUNDED',
        },
        select: {
          total: true,
        },
      }),
    ]);

    const grossRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const discounts = orders.reduce((sum, o) => sum + o.discount, 0);
    const netRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const refunds = refundedOrders.reduce((sum, o) => sum + o.total, 0);

    // Get split transactions for platform fees
    const splitTransactions = await prisma.splitTransaction.findMany({
      where: {
        order: where,
        status: 'COMPLETED',
      },
      select: {
        platformAmount: true,
        organizerAmount: true,
        platformFee: true,
      },
    });

    const platformFees = splitTransactions.reduce((sum, t) => sum + t.platformAmount + t.platformFee, 0);
    const organizerRevenue = splitTransactions.reduce((sum, t) => sum + t.organizerAmount, 0);

    return {
      grossRevenue,
      discounts,
      netRevenue,
      refunds,
      platformFees,
      organizerRevenue,
      finalRevenue: netRevenue - refunds,
    };
  }

  async exportReport(filters: ExportFilters) {
    const { type, format, startDate, endDate, eventId, userId } = filters;

    const where: any = {};

    if (userId) {
      where.event = { organizerId: userId };
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    let data: string;
    let filename: string;

    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          event: {
            select: {
              name: true,
            },
          },
          items: {
            include: {
              ticket: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Generate CSV
      const headers = ['ID', 'Data', 'Cliente', 'Email', 'Evento', 'Itens', 'Subtotal', 'Desconto', 'Total', 'Pagamento', 'Status', 'Status Pagamento'];
      const rows = orders.map((o) => [
        o.id,
        o.createdAt.toISOString(),
        o.user.name,
        o.user.email,
        o.event.name,
        o.items.map((i) => `${i.ticket.name} x${i.quantity}`).join('; '),
        o.subtotal.toFixed(2),
        o.discount.toFixed(2),
        o.total.toFixed(2),
        o.paymentMethod,
        o.status,
        o.paymentStatus,
      ]);

      data = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
      filename = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Sales report
      const salesData = await this.getSalesReport({
        startDate,
        endDate,
        eventId,
        userId,
        groupBy: 'day',
      });

      const headers = ['Data', 'Receita', 'Ingressos', 'Pedidos'];
      const rows = salesData.salesByPeriod.map((s) => [
        s.date,
        s.revenue.toFixed(2),
        s.tickets.toString(),
        s.orders.toString(),
      ]);

      data = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
      filename = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
    }

    return {
      data,
      filename,
      contentType: 'text/csv',
    };
  }

  // Financial Dashboard
  async getFinancialSummary(filters: { startDate?: string; endDate?: string; userId?: string }) {
    const { startDate, endDate, userId } = filters;

    const where: any = {};
    const orderWhere: any = {};

    if (userId) {
      where.organizerAccount = { userId };
      orderWhere.event = { organizerId: userId };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      orderWhere.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
        orderWhere.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
        orderWhere.createdAt.lte = new Date(endDate);
      }
    }

    const [
      paidOrders,
      pendingOrders,
      refundedOrders,
      failedOrders,
      completedTransactions,
      pendingTransactions,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { ...orderWhere, paymentStatus: 'PAID' },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { ...orderWhere, paymentStatus: 'PENDING' },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { ...orderWhere, paymentStatus: 'REFUNDED' },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { ...orderWhere, paymentStatus: 'FAILED' },
        _count: true,
      }),
      prisma.splitTransaction.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { platformAmount: true, organizerAmount: true },
      }),
      prisma.splitTransaction.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { totalAmount: true },
      }),
    ]);

    // Get organizer balance if applicable
    let organizerBalance = null;
    if (userId) {
      const account = await prisma.organizerAccount.findUnique({
        where: { userId },
        select: {
          availableBalance: true,
          pendingBalance: true,
        },
      });
      organizerBalance = account;
    }

    return {
      revenue: {
        paid: paidOrders._sum.total || 0,
        pending: pendingOrders._sum.total || 0,
        refunded: refundedOrders._sum.total || 0,
      },
      orders: {
        paid: paidOrders._count,
        pending: pendingOrders._count,
        refunded: refundedOrders._count,
        failed: failedOrders._count,
      },
      splits: {
        platformRevenue: completedTransactions._sum.platformAmount || 0,
        organizerRevenue: completedTransactions._sum.organizerAmount || 0,
        pendingAmount: pendingTransactions._sum.totalAmount || 0,
      },
      organizerBalance,
    };
  }

  async getTransactions(filters: TransactionsFilters) {
    const { page, limit, status, startDate, endDate, userId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.organizerAccount = { userId };
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.splitTransaction.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              createdAt: true,
              user: {
                select: {
                  name: true,
                },
              },
              event: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.splitTransaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Payouts Management
  async getAllPayouts(filters: PayoutsFilters) {
    const { page, limit, status, userId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.organizerAccount = { userId };
    }

    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          organizerAccount: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    return {
      payouts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approvePayout(payoutId: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new AppError(404, 'Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new AppError(400, 'Payout is not pending');
    }

    // Update payout status
    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSING',
        processedAt: new Date(),
      },
    });

    // Here you would integrate with your payment provider to process the payout
    // For now, we'll just mark it as processing

    return updatedPayout;
  }

  async rejectPayout(payoutId: string, reason: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new AppError(404, 'Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new AppError(400, 'Payout is not pending');
    }

    // Restore balance to organizer account
    await prisma.$transaction(async (tx) => {
      await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'CANCELLED',
          failedAt: new Date(),
          failureReason: reason,
        },
      });

      await tx.organizerAccount.update({
        where: { id: payout.organizerAccountId },
        data: {
          availableBalance: { increment: payout.amount },
        },
      });
    });

    return { message: 'Payout rejected' };
  }

  // Real-time Dashboard
  async getDashboardData(userId?: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const eventFilter = userId ? { organizerId: userId } : {};
    const orderFilter: any = userId ? { event: { organizerId: userId } } : {};

    // Get all time periods in parallel
    const [
      todaySales,
      yesterdaySales,
      thisWeekSales,
      thisMonthSales,
      totalSales,
      recentOrders,
      upcomingEvents,
      topEvents,
      ticketsSoldToday,
      pendingOrders,
    ] = await Promise.all([
      // Today's sales
      prisma.order.aggregate({
        where: {
          ...orderFilter,
          paymentStatus: 'PAID',
          paidAt: { gte: today },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Yesterday's sales
      prisma.order.aggregate({
        where: {
          ...orderFilter,
          paymentStatus: 'PAID',
          paidAt: { gte: yesterday, lt: today },
        },
        _sum: { total: true },
        _count: true,
      }),
      // This week's sales
      prisma.order.aggregate({
        where: {
          ...orderFilter,
          paymentStatus: 'PAID',
          paidAt: { gte: thisWeekStart },
        },
        _sum: { total: true },
        _count: true,
      }),
      // This month's sales
      prisma.order.aggregate({
        where: {
          ...orderFilter,
          paymentStatus: 'PAID',
          paidAt: { gte: thisMonthStart },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Total sales (all time)
      prisma.order.aggregate({
        where: {
          ...orderFilter,
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
        _count: true,
      }),
      // Recent orders (last 10)
      prisma.order.findMany({
        where: orderFilter,
        include: {
          user: {
            select: { name: true, email: true },
          },
          event: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Upcoming events
      prisma.event.findMany({
        where: {
          ...eventFilter,
          date: { gte: now },
          status: 'PUBLISHED',
        },
        include: {
          tickets: {
            select: { quantity: true, sold: true },
          },
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      // Top selling events this month
      prisma.event.findMany({
        where: {
          ...eventFilter,
          orders: {
            some: {
              paymentStatus: 'PAID',
              paidAt: { gte: thisMonthStart },
            },
          },
        },
        include: {
          orders: {
            where: {
              paymentStatus: 'PAID',
              paidAt: { gte: thisMonthStart },
            },
            select: { total: true },
          },
        },
        take: 5,
      }),
      // Tickets sold today
      prisma.orderItem.aggregate({
        where: {
          order: {
            ...orderFilter,
            paymentStatus: 'PAID',
            paidAt: { gte: today },
          },
        },
        _sum: { quantity: true },
      }),
      // Pending orders
      prisma.order.count({
        where: {
          ...orderFilter,
          paymentStatus: 'PENDING',
        },
      }),
    ]);

    // Calculate growth percentages
    const todayRevenue = todaySales._sum.total || 0;
    const yesterdayRevenue = yesterdaySales._sum.total || 0;
    const dailyGrowth = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;

    // Process top events
    const topEventsProcessed = topEvents.map((event) => ({
      id: event.id,
      name: event.name,
      revenue: event.orders.reduce((sum, o) => sum + o.total, 0),
      orders: event.orders.length,
    })).sort((a, b) => b.revenue - a.revenue);

    // Process upcoming events
    const upcomingEventsProcessed = upcomingEvents.map((event) => {
      const totalCapacity = event.tickets.reduce((sum, t) => sum + t.quantity, 0);
      const totalSold = event.tickets.reduce((sum, t) => sum + t.sold, 0);
      return {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        ticketsSold: totalSold,
        totalCapacity,
        occupancy: totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0,
      };
    });

    return {
      summary: {
        todayRevenue,
        todayOrders: todaySales._count,
        todayTickets: ticketsSoldToday._sum.quantity || 0,
        pendingOrders,
        weekRevenue: thisWeekSales._sum.total || 0,
        weekOrders: thisWeekSales._count,
        monthRevenue: thisMonthSales._sum.total || 0,
        monthOrders: thisMonthSales._count,
        totalRevenue: totalSales._sum.total || 0,
        totalOrders: totalSales._count,
        dailyGrowth,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        customer: order.user.name,
        email: order.user.email,
        event: order.event.name,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      })),
      upcomingEvents: upcomingEventsProcessed,
      topEvents: topEventsProcessed,
    };
  }

  // Export Attendees/Participants
  async exportEventAttendees(eventId: string, userId: string, userRole: string) {
    // Get event to verify ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    // Check permission for organizers
    if (userRole === 'ORGANIZER' && event.organizerId !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    // Get all paid orders for this event with ticket instances
    const orders = await prisma.order.findMany({
      where: {
        eventId,
        paymentStatus: 'PAID',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
        items: {
          include: {
            ticket: {
              select: {
                name: true,
              },
            },
            ticketInstances: {
              select: {
                id: true,
                checkedIn: true,
                checkedInAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build CSV data
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

    const rows: string[][] = [];

    for (const order of orders) {
      for (const item of order.items) {
        for (const instance of item.ticketInstances) {
          rows.push([
            order.user.name,
            order.user.email,
            order.user.phone || '',
            order.user.cpf || '',
            item.ticket.name,
            instance.id.slice(0, 8).toUpperCase(),
            order.createdAt.toLocaleDateString('pt-BR'),
            instance.checkedIn ? 'Sim' : 'Nao',
            instance.checkedInAt
              ? new Date(instance.checkedInAt).toLocaleString('pt-BR')
              : '',
          ]);
        }
      }
    }

    // Generate CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const filename = `participantes_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      data: csvContent,
      filename,
      contentType: 'text/csv; charset=utf-8',
      summary: {
        totalAttendees: rows.length,
        checkedIn: rows.filter((r) => r[7] === 'Sim').length,
        notCheckedIn: rows.filter((r) => r[7] === 'Nao').length,
      },
    };
  }
}
