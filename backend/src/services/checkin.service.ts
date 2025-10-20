import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { QRCodeService } from './qrcode.service.js';

const qrCodeService = new QRCodeService();

export class CheckinService {
  async validateTicket(qrCodeData: string, eventId?: string) {
    // Validate QR code
    const validation = qrCodeService.validateQRCode(qrCodeData);

    if (!validation.valid || !validation.data) {
      throw new AppError(400, validation.error || 'Invalid QR code');
    }

    const { ticketId, orderId, userId } = validation.data;

    // Get ticket instance
    const ticketInstance = await prisma.ticketInstance.findFirst({
      where: {
        qrCodeData,
        ticketId,
      },
      include: {
        ticket: {
          include: {
            event: true,
          },
        },
        orderItem: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!ticketInstance) {
      throw new AppError(404, 'Ticket not found');
    }

    // Verify event if provided
    if (eventId && ticketInstance.ticket.eventId !== eventId) {
      throw new AppError(400, 'Ticket is not for this event');
    }

    // Check if order is confirmed
    if (ticketInstance.orderItem.order.paymentStatus !== 'PAID') {
      throw new AppError(400, 'Order not paid');
    }

    if (ticketInstance.orderItem.order.status === 'CANCELLED') {
      throw new AppError(400, 'Order cancelled');
    }

    // Check if already checked in
    if (ticketInstance.checkedIn) {
      return {
        valid: false,
        alreadyCheckedIn: true,
        checkedInAt: ticketInstance.checkedInAt,
        message: `Ticket already used at ${ticketInstance.checkedInAt?.toLocaleString('pt-BR')}`,
        ticket: {
          eventName: ticketInstance.ticket.event.name,
          ticketName: ticketInstance.ticket.name,
          holderName: ticketInstance.orderItem.order.userId, // You might want to join user here
        },
      };
    }

    // Perform check-in
    const updatedTicket = await prisma.ticketInstance.update({
      where: { id: ticketInstance.id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
      include: {
        ticket: {
          include: {
            event: true,
          },
        },
        orderItem: {
          include: {
            order: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return {
      valid: true,
      alreadyCheckedIn: false,
      checkedInAt: updatedTicket.checkedInAt,
      message: 'Check-in successful',
      ticket: {
        eventName: updatedTicket.ticket.event.name,
        ticketName: updatedTicket.ticket.name,
        holderName: updatedTicket.orderItem.order.user.name,
        holderEmail: updatedTicket.orderItem.order.user.email,
      },
    };
  }

  async getEventCheckinStats(eventId: string, userId: string, userRole: string) {
    // Verify permission
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (userRole !== 'ADMIN' && event.organizerId !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    // Get statistics
    const [totalTickets, checkedInTickets, tickets] = await Promise.all([
      prisma.ticketInstance.count({
        where: {
          ticket: { eventId },
        },
      }),
      prisma.ticketInstance.count({
        where: {
          ticket: { eventId },
          checkedIn: true,
        },
      }),
      prisma.ticket.findMany({
        where: { eventId },
        select: {
          id: true,
          name: true,
          quantity: true,
          sold: true,
          _count: {
            select: {
              ticketInstances: {
                where: { checkedIn: true },
              },
            },
          },
        },
      }),
    ]);

    const ticketBreakdown = tickets.map((ticket) => ({
      name: ticket.name,
      sold: ticket.sold,
      checkedIn: ticket._count.ticketInstances,
      pending: ticket.sold - ticket._count.ticketInstances,
    }));

    return {
      eventId,
      eventName: event.name,
      totalTickets,
      checkedIn: checkedInTickets,
      pending: totalTickets - checkedInTickets,
      checkInRate: totalTickets > 0 ? (checkedInTickets / totalTickets) * 100 : 0,
      ticketBreakdown,
    };
  }

  async getCheckinHistory(eventId: string, userId: string, userRole: string) {
    // Verify permission
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (userRole !== 'ADMIN' && event.organizerId !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    const history = await prisma.ticketInstance.findMany({
      where: {
        ticket: { eventId },
        checkedIn: true,
      },
      include: {
        ticket: {
          select: {
            name: true,
          },
        },
        orderItem: {
          include: {
            order: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        checkedInAt: 'desc',
      },
      take: 100,
    });

    return history.map((item) => ({
      ticketType: item.ticket.name,
      holderName: item.orderItem.order.user.name,
      holderEmail: item.orderItem.order.user.email,
      checkedInAt: item.checkedInAt,
    }));
  }
}
