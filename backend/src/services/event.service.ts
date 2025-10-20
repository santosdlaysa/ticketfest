import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { slugify, generateUniqueSlug } from '../utils/slugify.js';

export interface CreateEventData {
  name: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  category: string;
  images?: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
}

export class EventService {
  async createEvent(data: CreateEventData, organizerId: string) {
    // Generate unique slug
    const baseSlug = slugify(data.name);
    const slug = await generateUniqueSlug(baseSlug, async (slug) => {
      const existing = await prisma.event.findUnique({ where: { slug } });
      return !!existing;
    });

    const event = await prisma.event.create({
      data: {
        ...data,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        slug,
        organizerId,
        images: data.images || [],
        status: data.status || 'DRAFT',
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tickets: true,
      },
    });

    return event;
  }

  async getAllEvents(filters?: {
    category?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      status: 'PUBLISHED',
      date: { gte: new Date() },
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
            },
          },
          tickets: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              sold: true,
            },
          },
        },
        orderBy: { date: 'asc' },
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tickets: {
          where: {
            salesStart: { lte: new Date() },
            salesEnd: { gte: new Date() },
          },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    return event;
  }

  async getEventBySlug(slug: string) {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tickets: {
          where: {
            salesStart: { lte: new Date() },
            salesEnd: { gte: new Date() },
          },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    return event;
  }

  async updateEvent(id: string, data: Partial<CreateEventData>, userId: string, userRole: string) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    // Check permission
    if (userRole !== 'ADMIN' && event.organizerId !== userId) {
      throw new AppError(403, 'You do not have permission to update this event');
    }

    // Update slug if name changed
    let slug = event.slug;
    if (data.name && data.name !== event.name) {
      const baseSlug = slugify(data.name);
      slug = await generateUniqueSlug(baseSlug, async (slug) => {
        const existing = await prisma.event.findUnique({ where: { slug } });
        return !!existing && existing.id !== id;
      });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        slug,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tickets: true,
      },
    });

    return updatedEvent;
  }

  async deleteEvent(id: string, userId: string, userRole: string) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    // Check permission
    if (userRole !== 'ADMIN' && event.organizerId !== userId) {
      throw new AppError(403, 'You do not have permission to delete this event');
    }

    // Check if there are orders
    const ordersCount = await prisma.order.count({
      where: { eventId: id, paymentStatus: 'PAID' },
    });

    if (ordersCount > 0) {
      throw new AppError(400, 'Cannot delete event with existing paid orders');
    }

    await prisma.event.delete({ where: { id } });

    return { message: 'Event deleted successfully' };
  }

  async getFeaturedEvents() {
    const events = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        date: { gte: new Date() },
      },
      include: {
        tickets: {
          select: {
            price: true,
          },
          orderBy: { price: 'asc' },
          take: 1,
        },
      },
      orderBy: { date: 'asc' },
      take: 10,
    });

    return events;
  }

  async getEventsByCategory(category: string) {
    const events = await prisma.event.findMany({
      where: {
        category,
        status: 'PUBLISHED',
        date: { gte: new Date() },
      },
      include: {
        tickets: {
          select: {
            price: true,
          },
          orderBy: { price: 'asc' },
          take: 1,
        },
      },
      orderBy: { date: 'asc' },
    });

    return events;
  }
}
