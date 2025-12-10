import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

export interface CreateVenueData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  description?: string;
  images?: string[];
  phone?: string;
  email?: string;
}

export class VenueService {
  async createVenue(data: CreateVenueData, organizerId: string) {
    const venue = await prisma.venue.create({
      data: {
        ...data,
        images: data.images || [],
        organizerId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return venue;
  }

  async getAllVenues(organizerId: string) {
    const venues = await prisma.venue.findMany({
      where: { organizerId },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return venues;
  }

  async getVenueById(id: string, organizerId: string) {
    const venue = await prisma.venue.findFirst({
      where: { id, organizerId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        events: {
          select: {
            id: true,
            name: true,
            date: true,
            status: true,
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    return venue;
  }

  async updateVenue(id: string, data: Partial<CreateVenueData>, userId: string, userRole: string) {
    const venue = await prisma.venue.findUnique({ where: { id } });

    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    // Check permission
    if (userRole !== 'ADMIN' && venue.organizerId !== userId) {
      throw new AppError(403, 'You do not have permission to update this venue');
    }

    const updatedVenue = await prisma.venue.update({
      where: { id },
      data,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedVenue;
  }

  async deleteVenue(id: string, userId: string, userRole: string) {
    const venue = await prisma.venue.findUnique({ where: { id } });

    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    // Check permission
    if (userRole !== 'ADMIN' && venue.organizerId !== userId) {
      throw new AppError(403, 'You do not have permission to delete this venue');
    }

    // Check if there are events using this venue
    const eventsCount = await prisma.event.count({
      where: { venueId: id },
    });

    if (eventsCount > 0) {
      throw new AppError(400, 'Cannot delete venue with associated events. Remove the events first or unlink them from this venue.');
    }

    await prisma.venue.delete({ where: { id } });

    return { message: 'Venue deleted successfully' };
  }

  async searchVenues(organizerId: string, query?: string) {
    const where: any = { organizerId };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ];
    }

    const venues = await prisma.venue.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        capacity: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return venues;
  }
}
