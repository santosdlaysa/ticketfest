import { query } from '../config/database.js';
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

interface Ticket {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold: number;
  sales_start: Date;
  sales_end: Date;
  features: string[];
  use_batches: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Event {
  id: string;
  name: string;
  date: Date;
  location: string;
  organizer_id: string;
}

export class TicketService {
  async createTicket(data: CreateTicketData, userId: string, userRole: string) {
    // Verify event exists and user has permission
    const eventResult = await query<Event>('SELECT * FROM events WHERE id = $1', [data.eventId]);

    if (eventResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    const event = eventResult.rows[0];

    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      throw new AppError(403, 'You do not have permission to create tickets for this event');
    }

    const result = await query<Ticket>(
      `INSERT INTO tickets (event_id, name, description, price, quantity, sales_start, sales_end, features)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.eventId,
        data.name,
        data.description || null,
        data.price,
        data.quantity,
        new Date(data.salesStart),
        new Date(data.salesEnd),
        data.features || [],
      ]
    );

    const ticket = result.rows[0];
    return {
      ...ticket,
      eventId: ticket.event_id,
      salesStart: ticket.sales_start,
      salesEnd: ticket.sales_end,
      useBatches: ticket.use_batches,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  }

  async getTicketsByEvent(eventId: string) {
    const result = await query<Ticket>(
      'SELECT * FROM tickets WHERE event_id = $1 ORDER BY price ASC',
      [eventId]
    );

    return result.rows.map((ticket) => ({
      ...ticket,
      eventId: ticket.event_id,
      salesStart: ticket.sales_start,
      salesEnd: ticket.sales_end,
      useBatches: ticket.use_batches,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      available: ticket.quantity - ticket.sold,
    }));
  }

  async getTicketById(id: string) {
    const result = await query<Ticket & { event_name: string; event_date: Date; event_location: string }>(
      `SELECT t.*, e.name as event_name, e.date as event_date, e.location as event_location
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Ticket not found');
    }

    const ticket = result.rows[0];
    return {
      ...ticket,
      eventId: ticket.event_id,
      salesStart: ticket.sales_start,
      salesEnd: ticket.sales_end,
      useBatches: ticket.use_batches,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      available: ticket.quantity - ticket.sold,
      event: {
        id: ticket.event_id,
        name: ticket.event_name,
        date: ticket.event_date,
        location: ticket.event_location,
      },
    };
  }

  async updateTicket(
    id: string,
    data: Partial<CreateTicketData>,
    userId: string,
    userRole: string
  ) {
    const ticketResult = await query<Ticket & { organizer_id: string }>(
      `SELECT t.*, e.organizer_id
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE t.id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      throw new AppError(404, 'Ticket not found');
    }

    const ticket = ticketResult.rows[0];

    if (userRole !== 'ADMIN' && ticket.organizer_id !== userId) {
      throw new AppError(403, 'You do not have permission to update this ticket');
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(data.price);
    }
    if (data.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      values.push(data.quantity);
    }
    if (data.salesStart !== undefined) {
      updates.push(`sales_start = $${paramIndex++}`);
      values.push(new Date(data.salesStart));
    }
    if (data.salesEnd !== undefined) {
      updates.push(`sales_end = $${paramIndex++}`);
      values.push(new Date(data.salesEnd));
    }
    if (data.features !== undefined) {
      updates.push(`features = $${paramIndex++}`);
      values.push(data.features);
    }

    if (updates.length === 0) {
      return {
        ...ticket,
        eventId: ticket.event_id,
        salesStart: ticket.sales_start,
        salesEnd: ticket.sales_end,
        useBatches: ticket.use_batches,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
      };
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await query<Ticket>(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const updated = result.rows[0];
    return {
      ...updated,
      eventId: updated.event_id,
      salesStart: updated.sales_start,
      salesEnd: updated.sales_end,
      useBatches: updated.use_batches,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  async deleteTicket(id: string, userId: string, userRole: string) {
    const ticketResult = await query<Ticket & { organizer_id: string }>(
      `SELECT t.*, e.organizer_id
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE t.id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      throw new AppError(404, 'Ticket not found');
    }

    const ticket = ticketResult.rows[0];

    if (userRole !== 'ADMIN' && ticket.organizer_id !== userId) {
      throw new AppError(403, 'You do not have permission to delete this ticket');
    }

    if (ticket.sold > 0) {
      throw new AppError(400, 'Cannot delete ticket with sales');
    }

    await query('DELETE FROM tickets WHERE id = $1', [id]);

    return { message: 'Ticket deleted successfully' };
  }
}
