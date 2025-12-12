import { PrismaClient } from '@prisma/client';
import {
  ICheckinRepository,
  CheckinStats,
  CheckinHistoryItem,
  TicketForCheckin,
  CheckinSearchParams,
  CheckinSearchResult,
} from '../../../domain/repositories/ICheckinRepository.js';

export class PrismaCheckinRepository implements ICheckinRepository {
  constructor(private prisma: PrismaClient) {}

  async getEventStats(eventId: string): Promise<CheckinStats> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tickets: {
          include: {
            ticketInstances: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const allInstances = event.tickets.flatMap((t) => t.ticketInstances);
    const total = allInstances.length;
    const checkedIn = allInstances.filter((i) => i.checkedIn).length;
    const pending = total - checkedIn;
    const percentageCheckedIn = total > 0 ? (checkedIn / total) * 100 : 0;

    return {
      total,
      checkedIn,
      pending,
      percentageCheckedIn: Math.round(percentageCheckedIn * 100) / 100,
    };
  }

  async getCheckinHistory(eventId: string, limit: number = 50): Promise<CheckinHistoryItem[]> {
    const instances = await this.prisma.ticketInstance.findMany({
      where: {
        checkedIn: true,
        orderItem: {
          order: {
            eventId,
          },
        },
      },
      include: {
        ticket: true,
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
      orderBy: { checkedInAt: 'desc' },
      take: limit,
    });

    return instances.map((instance) => ({
      id: instance.id,
      ticketInstanceId: instance.id,
      ticketName: instance.ticket.name,
      attendeeName: instance.orderItem.order.user.name,
      attendeeEmail: instance.orderItem.order.user.email,
      checkedInAt: instance.checkedInAt!,
      checkedInBy: undefined, // Could add this field to the schema if needed
    }));
  }

  async searchTickets(params: CheckinSearchParams): Promise<CheckinSearchResult> {
    const { eventId, query, status = 'all', page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      orderItem: {
        order: {
          eventId,
          status: 'CONFIRMED',
        },
      },
    };

    // Filter by status
    if (status === 'checked_in') {
      whereClause.checkedIn = true;
    } else if (status === 'pending') {
      whereClause.checkedIn = false;
    }

    // Search by query
    if (query) {
      whereClause.OR = [
        { qrCode: { contains: query, mode: 'insensitive' } },
        {
          orderItem: {
            order: {
              user: {
                name: { contains: query, mode: 'insensitive' },
              },
            },
          },
        },
        {
          orderItem: {
            order: {
              user: {
                email: { contains: query, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    const [total, instances] = await Promise.all([
      this.prisma.ticketInstance.count({ where: whereClause }),
      this.prisma.ticketInstance.findMany({
        where: whereClause,
        include: {
          ticket: true,
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
        orderBy: [
          { checkedIn: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
    ]);

    const tickets: TicketForCheckin[] = instances.map((instance) => ({
      id: instance.id,
      qrCode: instance.qrCode,
      ticketName: instance.ticket.name,
      attendeeName: instance.orderItem.order.user.name,
      attendeeEmail: instance.orderItem.order.user.email,
      orderDate: instance.orderItem.order.createdAt,
      checkedIn: instance.checkedIn,
      checkedInAt: instance.checkedInAt ?? undefined,
    }));

    return {
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTicketByQRCode(qrCode: string): Promise<TicketForCheckin | null> {
    const instance = await this.prisma.ticketInstance.findUnique({
      where: { qrCode },
      include: {
        ticket: true,
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

    if (!instance) return null;

    return {
      id: instance.id,
      qrCode: instance.qrCode,
      ticketName: instance.ticket.name,
      attendeeName: instance.orderItem.order.user.name,
      attendeeEmail: instance.orderItem.order.user.email,
      orderDate: instance.orderItem.order.createdAt,
      checkedIn: instance.checkedIn,
      checkedInAt: instance.checkedInAt ?? undefined,
    };
  }

  async findTicketById(ticketInstanceId: string): Promise<TicketForCheckin | null> {
    const instance = await this.prisma.ticketInstance.findUnique({
      where: { id: ticketInstanceId },
      include: {
        ticket: true,
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

    if (!instance) return null;

    return {
      id: instance.id,
      qrCode: instance.qrCode,
      ticketName: instance.ticket.name,
      attendeeName: instance.orderItem.order.user.name,
      attendeeEmail: instance.orderItem.order.user.email,
      orderDate: instance.orderItem.order.createdAt,
      checkedIn: instance.checkedIn,
      checkedInAt: instance.checkedInAt ?? undefined,
    };
  }

  async performCheckin(ticketInstanceId: string, _checkedInBy?: string): Promise<void> {
    const instance = await this.prisma.ticketInstance.findUnique({
      where: { id: ticketInstanceId },
      include: {
        orderItem: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!instance) {
      throw new Error('Ticket not found');
    }

    if (instance.checkedIn) {
      throw new Error('Ticket already checked in');
    }

    if (instance.orderItem.order.status !== 'CONFIRMED') {
      throw new Error('Order not confirmed');
    }

    await this.prisma.ticketInstance.update({
      where: { id: ticketInstanceId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });
  }

  async undoCheckin(ticketInstanceId: string): Promise<void> {
    const instance = await this.prisma.ticketInstance.findUnique({
      where: { id: ticketInstanceId },
    });

    if (!instance) {
      throw new Error('Ticket not found');
    }

    if (!instance.checkedIn) {
      throw new Error('Ticket not checked in');
    }

    await this.prisma.ticketInstance.update({
      where: { id: ticketInstanceId },
      data: {
        checkedIn: false,
        checkedInAt: null,
      },
    });
  }

  async getEventTicketsByStatus(eventId: string, checkedIn: boolean): Promise<TicketForCheckin[]> {
    const instances = await this.prisma.ticketInstance.findMany({
      where: {
        checkedIn,
        orderItem: {
          order: {
            eventId,
            status: 'CONFIRMED',
          },
        },
      },
      include: {
        ticket: true,
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
      orderBy: { createdAt: 'desc' },
    });

    return instances.map((instance) => ({
      id: instance.id,
      qrCode: instance.qrCode,
      ticketName: instance.ticket.name,
      attendeeName: instance.orderItem.order.user.name,
      attendeeEmail: instance.orderItem.order.user.email,
      orderDate: instance.orderItem.order.createdAt,
      checkedIn: instance.checkedIn,
      checkedInAt: instance.checkedInAt ?? undefined,
    }));
  }
}
