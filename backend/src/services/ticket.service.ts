import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

export interface CreateTicketData {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  salesStart: string;
  salesEnd: string;
  features?: string[];
}

export class TicketService {
  async createTicket(data: CreateTicketData, userId: string, userRole: string) {
    // Verify event exists and user has permission
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (userRole !== 'ADMIN' && event.organizerId !== userId) {
      throw new AppError(403, 'You do not have permission to create tickets for this event');
    }

    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        salesStart: new Date(data.salesStart),
        salesEnd: new Date(data.salesEnd),
        features: data.features || [],
      },
    });

    return ticket;
  }

  async getTicketsByEvent(eventId: string) {
    const tickets = await prisma.ticket.findMany({
      where: { eventId },
      orderBy: { price: 'asc' },
    });

    // Calculate available tickets
    return tickets.map((ticket) => ({
      ...ticket,
      available: ticket.quantity - ticket.sold,
    }));
  }

  async getTicketById(id: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError(404, 'Ticket not found');
    }

    return {
      ...ticket,
      available: ticket.quantity - ticket.sold,
    };
  }

  async updateTicket(
    id: string,
    data: Partial<CreateTicketData>,
    userId: string,
    userRole: string
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!ticket) {
      throw new AppError(404, 'Ticket not found');
    }

    if (userRole !== 'ADMIN' && ticket.event.organizerId !== userId) {
      throw new AppError(403, 'You do not have permission to update this ticket');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        salesStart: data.salesStart ? new Date(data.salesStart) : undefined,
        salesEnd: data.salesEnd ? new Date(data.salesEnd) : undefined,
      },
    });

    return updatedTicket;
  }

  async deleteTicket(id: string, userId: string, userRole: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!ticket) {
      throw new AppError(404, 'Ticket not found');
    }

    if (userRole !== 'ADMIN' && ticket.event.organizerId !== userId) {
      throw new AppError(403, 'You do not have permission to delete this ticket');
    }

    if (ticket.sold > 0) {
      throw new AppError(400, 'Cannot delete ticket with sales');
    }

    await prisma.ticket.delete({ where: { id } });

    return { message: 'Ticket deleted successfully' };
  }
}
