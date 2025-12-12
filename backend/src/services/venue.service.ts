import { query } from '../config/database.js';
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

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  description: string | null;
  images: string[];
  phone: string | null;
  email: string | null;
  organizer_id: string;
  created_at: Date;
  updated_at: Date;
}

export class VenueService {
  async createVenue(data: CreateVenueData, organizerId: string) {
    const result = await query<Venue & { organizer_name: string; organizer_email: string }>(
      `INSERT INTO venues (name, address, city, state, zip_code, latitude, longitude, capacity, description, images, phone, email, organizer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *,
         (SELECT name FROM users WHERE id = $13) as organizer_name,
         (SELECT email FROM users WHERE id = $13) as organizer_email`,
      [
        data.name,
        data.address,
        data.city,
        data.state,
        data.zipCode || null,
        data.latitude || null,
        data.longitude || null,
        data.capacity || null,
        data.description || null,
        data.images || [],
        data.phone || null,
        data.email || null,
        organizerId,
      ]
    );

    const venue = result.rows[0];
    return {
      ...venue,
      zipCode: venue.zip_code,
      organizerId: venue.organizer_id,
      createdAt: venue.created_at,
      updatedAt: venue.updated_at,
      organizer: {
        id: venue.organizer_id,
        name: venue.organizer_name,
        email: venue.organizer_email,
      },
    };
  }

  async getAllVenues(organizerId: string) {
    const result = await query<Venue & { events_count: string }>(
      `SELECT v.*, COUNT(e.id) as events_count
       FROM venues v
       LEFT JOIN events e ON e.venue_id = v.id
       WHERE v.organizer_id = $1
       GROUP BY v.id
       ORDER BY v.name ASC`,
      [organizerId]
    );

    return result.rows.map((venue) => ({
      ...venue,
      zipCode: venue.zip_code,
      organizerId: venue.organizer_id,
      createdAt: venue.created_at,
      updatedAt: venue.updated_at,
      _count: { events: parseInt(venue.events_count, 10) },
    }));
  }

  async getVenueById(id: string, organizerId: string) {
    // Get venue with organizer
    const venueResult = await query<Venue & { organizer_name: string; organizer_email: string }>(
      `SELECT v.*, u.name as organizer_name, u.email as organizer_email
       FROM venues v
       JOIN users u ON v.organizer_id = u.id
       WHERE v.id = $1 AND v.organizer_id = $2`,
      [id, organizerId]
    );

    if (venueResult.rows.length === 0) {
      throw new AppError(404, 'Venue not found');
    }

    const venue = venueResult.rows[0];

    // Get recent events
    const eventsResult = await query<{ id: string; name: string; date: Date; status: string }>(
      `SELECT id, name, date, status
       FROM events
       WHERE venue_id = $1
       ORDER BY date DESC
       LIMIT 10`,
      [id]
    );

    return {
      ...venue,
      zipCode: venue.zip_code,
      organizerId: venue.organizer_id,
      createdAt: venue.created_at,
      updatedAt: venue.updated_at,
      organizer: {
        id: venue.organizer_id,
        name: venue.organizer_name,
        email: venue.organizer_email,
      },
      events: eventsResult.rows,
    };
  }

  async updateVenue(id: string, data: Partial<CreateVenueData>, userId: string, userRole: string) {
    // Check if venue exists
    const venueResult = await query<Venue>('SELECT * FROM venues WHERE id = $1', [id]);

    if (venueResult.rows.length === 0) {
      throw new AppError(404, 'Venue not found');
    }

    const venue = venueResult.rows[0];

    // Check permission
    if (userRole !== 'ADMIN' && venue.organizer_id !== userId) {
      throw new AppError(403, 'You do not have permission to update this venue');
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(data.address);
    }
    if (data.city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(data.city);
    }
    if (data.state !== undefined) {
      updates.push(`state = $${paramIndex++}`);
      values.push(data.state);
    }
    if (data.zipCode !== undefined) {
      updates.push(`zip_code = $${paramIndex++}`);
      values.push(data.zipCode);
    }
    if (data.latitude !== undefined) {
      updates.push(`latitude = $${paramIndex++}`);
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      updates.push(`longitude = $${paramIndex++}`);
      values.push(data.longitude);
    }
    if (data.capacity !== undefined) {
      updates.push(`capacity = $${paramIndex++}`);
      values.push(data.capacity);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.images !== undefined) {
      updates.push(`images = $${paramIndex++}`);
      values.push(data.images);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<Venue & { organizer_name: string; organizer_email: string }>(
      `UPDATE venues SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *,
         (SELECT name FROM users WHERE id = organizer_id) as organizer_name,
         (SELECT email FROM users WHERE id = organizer_id) as organizer_email`,
      values
    );

    const updated = result.rows[0];
    return {
      ...updated,
      zipCode: updated.zip_code,
      organizerId: updated.organizer_id,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      organizer: {
        id: updated.organizer_id,
        name: updated.organizer_name,
        email: updated.organizer_email,
      },
    };
  }

  async deleteVenue(id: string, userId: string, userRole: string) {
    const venueResult = await query<Venue>('SELECT * FROM venues WHERE id = $1', [id]);

    if (venueResult.rows.length === 0) {
      throw new AppError(404, 'Venue not found');
    }

    const venue = venueResult.rows[0];

    // Check permission
    if (userRole !== 'ADMIN' && venue.organizer_id !== userId) {
      throw new AppError(403, 'You do not have permission to delete this venue');
    }

    // Check if there are events using this venue
    const eventsCount = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM events WHERE venue_id = $1',
      [id]
    );

    if (parseInt(eventsCount.rows[0].count, 10) > 0) {
      throw new AppError(400, 'Cannot delete venue with associated events. Remove the events first or unlink them from this venue.');
    }

    await query('DELETE FROM venues WHERE id = $1', [id]);

    return { message: 'Venue deleted successfully' };
  }

  async searchVenues(organizerId: string, searchQuery?: string) {
    let sql = `SELECT id, name, address, city, state, capacity
               FROM venues
               WHERE organizer_id = $1`;
    const params: any[] = [organizerId];

    if (searchQuery) {
      sql += ` AND (name ILIKE $2 OR address ILIKE $2 OR city ILIKE $2)`;
      params.push(`%${searchQuery}%`);
    }

    sql += ` ORDER BY name ASC LIMIT 20`;

    const result = await query<{ id: string; name: string; address: string; city: string; state: string; capacity: number | null }>(sql, params);

    return result.rows;
  }
}
