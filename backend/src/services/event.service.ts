import { query } from '../config/database.js';
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

interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  date: Date;
  end_date: Date | null;
  location: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  venue_id: string | null;
  images: string[];
  category: string;
  status: string;
  organizer_id: string;
  rules: string | null;
  age_restriction: number | null;
  dress_code: string | null;
  created_at: Date;
  updated_at: Date;
}

interface Ticket {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold: number;
  sales_start: Date;
  sales_end: Date;
  features: string[];
}

export class EventService {
  async createEvent(data: CreateEventData, organizerId: string) {
    // Generate unique slug
    const baseSlug = slugify(data.name);
    const slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
      const existing = await query('SELECT id FROM events WHERE slug = $1', [testSlug]);
      return existing.rows.length > 0;
    });

    const result = await query<Event>(
      `INSERT INTO events (name, slug, description, date, end_date, location, address, latitude, longitude, category, images, status, organizer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        data.name,
        slug,
        data.description,
        new Date(data.date),
        data.endDate ? new Date(data.endDate) : null,
        data.location,
        data.address,
        data.latitude || null,
        data.longitude || null,
        data.category,
        data.images || [],
        data.status || 'DRAFT',
        organizerId,
      ]
    );

    const event = result.rows[0];

    // Get organizer info
    const organizerResult = await query<{ id: string; name: string; email: string }>(
      'SELECT id, name, email FROM users WHERE id = $1',
      [organizerId]
    );

    return {
      ...event,
      endDate: event.end_date,
      venueId: event.venue_id,
      organizerId: event.organizer_id,
      ageRestriction: event.age_restriction,
      dressCode: event.dress_code,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      organizer: organizerResult.rows[0],
      tickets: [],
    };
  }

  async getAllEvents(filters?: {
    category?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions: string[] = ['status = $1', 'date >= $2'];
    const params: any[] = [filters?.status || 'PUBLISHED', new Date()];
    let paramIndex = 3;

    if (filters?.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }

    if (filters?.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    // Get events with organizer
    const eventsResult = await query<Event & { organizer_name: string }>(
      `SELECT e.*, u.name as organizer_name
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.date ASC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM events WHERE ${conditions.join(' AND ')}`,
      params
    );

    // Get tickets for each event
    const eventIds = eventsResult.rows.map((e) => e.id);
    let ticketsMap: Map<string, Ticket[]> = new Map();

    if (eventIds.length > 0) {
      const ticketsResult = await query<Ticket & { event_id: string }>(
        `SELECT id, event_id, name, price, quantity, sold
         FROM tickets
         WHERE event_id = ANY($1)`,
        [eventIds]
      );

      ticketsResult.rows.forEach((ticket) => {
        if (!ticketsMap.has(ticket.event_id)) {
          ticketsMap.set(ticket.event_id, []);
        }
        ticketsMap.get(ticket.event_id)!.push(ticket);
      });
    }

    const events = eventsResult.rows.map((event) => ({
      ...event,
      endDate: event.end_date,
      venueId: event.venue_id,
      organizerId: event.organizer_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      organizer: { id: event.organizer_id, name: event.organizer_name },
      tickets: ticketsMap.get(event.id) || [],
    }));

    return {
      events,
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset,
    };
  }

  async getEventById(id: string) {
    const eventResult = await query<Event & { organizer_name: string; organizer_email: string }>(
      `SELECT e.*, u.name as organizer_name, u.email as organizer_email
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE e.id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    const event = eventResult.rows[0];

    // Get available tickets (within sales period)
    const ticketsResult = await query<Ticket>(
      `SELECT * FROM tickets
       WHERE event_id = $1 AND sales_start <= NOW() AND sales_end >= NOW()
       ORDER BY price ASC`,
      [id]
    );

    return {
      ...event,
      endDate: event.end_date,
      venueId: event.venue_id,
      organizerId: event.organizer_id,
      ageRestriction: event.age_restriction,
      dressCode: event.dress_code,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      organizer: {
        id: event.organizer_id,
        name: event.organizer_name,
        email: event.organizer_email,
      },
      tickets: ticketsResult.rows.map((t) => ({
        ...t,
        salesStart: t.sales_start,
        salesEnd: t.sales_end,
      })),
    };
  }

  async getEventBySlug(slug: string) {
    const eventResult = await query<Event & { organizer_name: string; organizer_email: string }>(
      `SELECT e.*, u.name as organizer_name, u.email as organizer_email
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE e.slug = $1`,
      [slug]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    const event = eventResult.rows[0];

    // Get available tickets
    const ticketsResult = await query<Ticket>(
      `SELECT * FROM tickets
       WHERE event_id = $1 AND sales_start <= NOW() AND sales_end >= NOW()
       ORDER BY price ASC`,
      [event.id]
    );

    return {
      ...event,
      endDate: event.end_date,
      venueId: event.venue_id,
      organizerId: event.organizer_id,
      ageRestriction: event.age_restriction,
      dressCode: event.dress_code,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      organizer: {
        id: event.organizer_id,
        name: event.organizer_name,
        email: event.organizer_email,
      },
      tickets: ticketsResult.rows.map((t) => ({
        ...t,
        salesStart: t.sales_start,
        salesEnd: t.sales_end,
      })),
    };
  }

  async updateEvent(id: string, data: Partial<CreateEventData>, userId: string, userRole: string) {
    const eventResult = await query<Event>('SELECT * FROM events WHERE id = $1', [id]);

    if (eventResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    const event = eventResult.rows[0];

    // Check permission
    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      throw new AppError(403, 'You do not have permission to update this event');
    }

    // Update slug if name changed
    let slug = event.slug;
    if (data.name && data.name !== event.name) {
      const baseSlug = slugify(data.name);
      slug = await generateUniqueSlug(baseSlug, async (testSlug) => {
        const existing = await query('SELECT id FROM events WHERE slug = $1 AND id != $2', [testSlug, id]);
        return existing.rows.length > 0;
      });
    }

    // Build dynamic update query
    const updates: string[] = ['slug = $1'];
    const values: any[] = [slug];
    let paramIndex = 2;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      values.push(new Date(data.date));
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate ? new Date(data.endDate) : null);
    }
    if (data.location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      values.push(data.location);
    }
    if (data.address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(data.address);
    }
    if (data.latitude !== undefined) {
      updates.push(`latitude = $${paramIndex++}`);
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      updates.push(`longitude = $${paramIndex++}`);
      values.push(data.longitude);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.images !== undefined) {
      updates.push(`images = $${paramIndex++}`);
      values.push(data.images);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await query<Event>(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const updated = result.rows[0];

    // Get organizer and tickets
    const [organizerResult, ticketsResult] = await Promise.all([
      query<{ id: string; name: string; email: string }>('SELECT id, name, email FROM users WHERE id = $1', [updated.organizer_id]),
      query<Ticket>('SELECT * FROM tickets WHERE event_id = $1', [id]),
    ]);

    return {
      ...updated,
      endDate: updated.end_date,
      venueId: updated.venue_id,
      organizerId: updated.organizer_id,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      organizer: organizerResult.rows[0],
      tickets: ticketsResult.rows,
    };
  }

  async deleteEvent(id: string, userId: string, userRole: string) {
    const eventResult = await query<Event>('SELECT * FROM events WHERE id = $1', [id]);

    if (eventResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    const event = eventResult.rows[0];

    // Check permission
    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      throw new AppError(403, 'You do not have permission to delete this event');
    }

    // Check if there are paid orders
    const ordersCount = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM orders WHERE event_id = $1 AND payment_status = 'PAID'",
      [id]
    );

    if (parseInt(ordersCount.rows[0].count, 10) > 0) {
      throw new AppError(400, 'Cannot delete event with existing paid orders');
    }

    await query('DELETE FROM events WHERE id = $1', [id]);

    return { message: 'Event deleted successfully' };
  }

  async getFeaturedEvents() {
    const eventsResult = await query<Event & { organizer_name: string }>(
      `SELECT e.*, u.name as organizer_name
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE e.status = 'PUBLISHED' AND e.date >= NOW()
       ORDER BY e.date ASC
       LIMIT 10`
    );

    // Get min price tickets for each event
    const eventIds = eventsResult.rows.map((e) => e.id);
    let ticketPrices: Map<string, number> = new Map();

    if (eventIds.length > 0) {
      const ticketsResult = await query<{ event_id: string; min_price: number }>(
        `SELECT event_id, MIN(price) as min_price
         FROM tickets
         WHERE event_id = ANY($1)
         GROUP BY event_id`,
        [eventIds]
      );

      ticketsResult.rows.forEach((t) => {
        ticketPrices.set(t.event_id, t.min_price);
      });
    }

    return eventsResult.rows.map((event) => ({
      ...event,
      endDate: event.end_date,
      venueId: event.venue_id,
      organizerId: event.organizer_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      organizer: { id: event.organizer_id, name: event.organizer_name },
      tickets: ticketPrices.has(event.id) ? [{ price: ticketPrices.get(event.id) }] : [],
    }));
  }

  async getEventsByCategory(category: string) {
    const eventsResult = await query<Event & { organizer_name: string }>(
      `SELECT e.*, u.name as organizer_name
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE e.category = $1 AND e.status = 'PUBLISHED' AND e.date >= NOW()
       ORDER BY e.date ASC`,
      [category]
    );

    // Get min price tickets
    const eventIds = eventsResult.rows.map((e) => e.id);
    let ticketPrices: Map<string, number> = new Map();

    if (eventIds.length > 0) {
      const ticketsResult = await query<{ event_id: string; min_price: number }>(
        `SELECT event_id, MIN(price) as min_price
         FROM tickets
         WHERE event_id = ANY($1)
         GROUP BY event_id`,
        [eventIds]
      );

      ticketsResult.rows.forEach((t) => {
        ticketPrices.set(t.event_id, t.min_price);
      });
    }

    return eventsResult.rows.map((event) => ({
      ...event,
      endDate: event.end_date,
      venueId: event.venue_id,
      organizerId: event.organizer_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      organizer: { id: event.organizer_id, name: event.organizer_name },
      tickets: ticketPrices.has(event.id) ? [{ price: ticketPrices.get(event.id) }] : [],
    }));
  }
}
