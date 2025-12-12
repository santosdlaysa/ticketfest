import { PrismaClient } from '@prisma/client';
import { TicketBatch } from '../../../domain/entities/TicketBatch.js';
import { ITicketBatchRepository } from '../../../domain/repositories/ITicketBatchRepository.js';

export class PrismaTicketBatchRepository implements ITicketBatchRepository {
  constructor(private prisma: PrismaClient) {}

  async create(batch: TicketBatch): Promise<TicketBatch> {
    const data = batch.toJSON();

    const created = await this.prisma.ticketBatch.create({
      data: {
        id: data.id,
        ticketId: data.ticketId,
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        sold: data.sold,
        salesStart: data.salesStart,
        salesEnd: data.salesEnd,
        isActive: data.isActive,
        order: data.order,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<TicketBatch | null> {
    const batch = await this.prisma.ticketBatch.findUnique({
      where: { id },
    });

    return batch ? this.toDomain(batch) : null;
  }

  async findByTicketId(ticketId: string): Promise<TicketBatch[]> {
    const batches = await this.prisma.ticketBatch.findMany({
      where: { ticketId },
      orderBy: { order: 'asc' },
    });

    return batches.map((b) => this.toDomain(b));
  }

  async findActiveByTicketId(ticketId: string): Promise<TicketBatch[]> {
    const batches = await this.prisma.ticketBatch.findMany({
      where: {
        ticketId,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });

    return batches.map((b) => this.toDomain(b));
  }

  async findCurrentBatch(ticketId: string): Promise<TicketBatch | null> {
    const now = new Date();

    const batch = await this.prisma.ticketBatch.findFirst({
      where: {
        ticketId,
        isActive: true,
        salesStart: { lte: now },
        salesEnd: { gte: now },
        sold: {
          lt: this.prisma.ticketBatch.fields.quantity,
        },
      },
      orderBy: { order: 'asc' },
    });

    // Fallback: query with raw comparison for sold < quantity
    if (!batch) {
      const batches = await this.prisma.ticketBatch.findMany({
        where: {
          ticketId,
          isActive: true,
          salesStart: { lte: now },
          salesEnd: { gte: now },
        },
        orderBy: { order: 'asc' },
      });

      const availableBatch = batches.find((b) => b.sold < b.quantity);
      return availableBatch ? this.toDomain(availableBatch) : null;
    }

    return this.toDomain(batch);
  }

  async update(batch: TicketBatch): Promise<TicketBatch> {
    const data = batch.toJSON();

    const updated = await this.prisma.ticketBatch.update({
      where: { id: data.id },
      data: {
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        sold: data.sold,
        salesStart: data.salesStart,
        salesEnd: data.salesEnd,
        isActive: data.isActive,
        order: data.order,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ticketBatch.delete({
      where: { id },
    });
  }

  async deleteByTicketId(ticketId: string): Promise<void> {
    await this.prisma.ticketBatch.deleteMany({
      where: { ticketId },
    });
  }

  async incrementSold(id: string, quantity: number): Promise<void> {
    await this.prisma.ticketBatch.update({
      where: { id },
      data: {
        sold: {
          increment: quantity,
        },
      },
    });
  }

  async decrementSold(id: string, quantity: number): Promise<void> {
    await this.prisma.ticketBatch.update({
      where: { id },
      data: {
        sold: {
          decrement: quantity,
        },
      },
    });
  }

  private toDomain(data: any): TicketBatch {
    return TicketBatch.restore({
      id: data.id,
      ticketId: data.ticketId,
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      sold: data.sold,
      salesStart: data.salesStart,
      salesEnd: data.salesEnd,
      isActive: data.isActive,
      order: data.order,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
