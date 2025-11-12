import { PrismaClient } from '@prisma/client';
import { Ticket } from '../../../domain/entities/Ticket.js';
import { ITicketRepository } from '../../../domain/repositories/ITicketRepository.js';

export class PrismaTicketRepository implements ITicketRepository {
  constructor(private prisma: PrismaClient) {}

  async create(ticket: Ticket): Promise<Ticket> {
    const ticketData = ticket.toJSON();

    const createdTicket = await this.prisma.ticket.create({
      data: {
        id: ticketData.id,
        eventId: ticketData.eventId,
        name: ticketData.name,
        description: ticketData.description,
        price: ticketData.price,
        quantity: ticketData.quantity,
        sold: ticketData.sold,
        salesStart: ticketData.salesStart,
        salesEnd: ticketData.salesEnd,
        features: ticketData.features,
      },
    });

    return this.toEntity(createdTicket);
  }

  async findById(id: string): Promise<Ticket | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) return null;
    return this.toEntity(ticket);
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { eventId },
    });

    return tickets.map((ticket) => this.toEntity(ticket));
  }

  async findManyByIds(ids: string[]): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { id: { in: ids } },
    });

    return tickets.map((ticket) => this.toEntity(ticket));
  }

  async update(ticket: Ticket): Promise<Ticket> {
    const ticketData = ticket.toJSON();

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketData.id },
      data: {
        name: ticketData.name,
        description: ticketData.description,
        price: ticketData.price,
        quantity: ticketData.quantity,
        sold: ticketData.sold,
        salesStart: ticketData.salesStart,
        salesEnd: ticketData.salesEnd,
        features: ticketData.features,
      },
    });

    return this.toEntity(updatedTicket);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ticket.delete({
      where: { id },
    });
  }

  private toEntity(data: any): Ticket {
    return Ticket.restore({
      id: data.id,
      eventId: data.eventId,
      name: data.name,
      description: data.description || undefined,
      price: data.price,
      quantity: data.quantity,
      sold: data.sold,
      salesStart: data.salesStart,
      salesEnd: data.salesEnd,
      features: data.features,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
