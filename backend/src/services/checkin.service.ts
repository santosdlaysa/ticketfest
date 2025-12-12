import { query } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { QRCodeService } from './qrcode.service.js';

const qrCodeService = new QRCodeService();

interface TicketInstance {
  id: string;
  order_item_id: string;
  ticket_id: string;
  qr_code: string;
  qr_code_data: string;
  checked_in: boolean;
  checked_in_at: Date | null;
}

export class CheckinService {
  async validateTicket(qrCodeData: string, eventId?: string) {
    // Validate QR code
    const validation = qrCodeService.validateQRCode(qrCodeData);

    if (!validation.valid || !validation.data) {
      throw new AppError(400, validation.error || 'Invalid QR code');
    }

    const { ticketId, orderId, userId } = validation.data;

    // Get ticket instance with all related data
    const result = await query<TicketInstance & {
      event_id: string;
      event_name: string;
      ticket_name: string;
      order_payment_status: string;
      order_status: string;
      order_user_id: string;
      user_name: string;
      user_email: string;
    }>(
      `SELECT ti.*, t.event_id, t.name as ticket_name, e.name as event_name,
              o.payment_status as order_payment_status, o.status as order_status, o.user_id as order_user_id,
              u.name as user_name, u.email as user_email
       FROM ticket_instances ti
       JOIN tickets t ON ti.ticket_id = t.id
       JOIN events e ON t.event_id = e.id
       JOIN order_items oi ON ti.order_item_id = oi.id
       JOIN orders o ON oi.order_id = o.id
       JOIN users u ON o.user_id = u.id
       WHERE ti.qr_code_data = $1 AND ti.ticket_id = $2`,
      [qrCodeData, ticketId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Ticket not found');
    }

    const ticketInstance = result.rows[0];

    // Verify event if provided
    if (eventId && ticketInstance.event_id !== eventId) {
      throw new AppError(400, 'Ticket is not for this event');
    }

    // Check if order is confirmed
    if (ticketInstance.order_payment_status !== 'PAID') {
      throw new AppError(400, 'Order not paid');
    }

    if (ticketInstance.order_status === 'CANCELLED') {
      throw new AppError(400, 'Order cancelled');
    }

    // Check if already checked in
    if (ticketInstance.checked_in) {
      return {
        valid: false,
        alreadyCheckedIn: true,
        checkedInAt: ticketInstance.checked_in_at,
        message: `Ticket already used at ${ticketInstance.checked_in_at?.toLocaleString('pt-BR')}`,
        ticket: {
          eventName: ticketInstance.event_name,
          ticketName: ticketInstance.ticket_name,
          holderName: ticketInstance.user_name,
        },
      };
    }

    // Perform check-in
    await query(
      'UPDATE ticket_instances SET checked_in = true, checked_in_at = NOW() WHERE id = $1',
      [ticketInstance.id]
    );

    return {
      valid: true,
      alreadyCheckedIn: false,
      checkedInAt: new Date(),
      message: 'Check-in successful',
      ticket: {
        eventName: ticketInstance.event_name,
        ticketName: ticketInstance.ticket_name,
        holderName: ticketInstance.user_name,
        holderEmail: ticketInstance.user_email,
      },
    };
  }

  async getEventCheckinStats(eventId: string, userId: string, userRole: string) {
    // Verify permission
    const eventResult = await query<{ id: string; name: string; organizer_id: string }>(
      'SELECT id, name, organizer_id FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    const event = eventResult.rows[0];

    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    // Get statistics
    const [totalResult, checkedInResult, ticketsResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ticket_instances ti
         JOIN tickets t ON ti.ticket_id = t.id
         WHERE t.event_id = $1`,
        [eventId]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ticket_instances ti
         JOIN tickets t ON ti.ticket_id = t.id
         WHERE t.event_id = $1 AND ti.checked_in = true`,
        [eventId]
      ),
      query<{ id: string; name: string; quantity: number; sold: number; checked_in_count: string }>(
        `SELECT t.id, t.name, t.quantity, t.sold,
                COALESCE(COUNT(ti.id) FILTER (WHERE ti.checked_in = true), 0) as checked_in_count
         FROM tickets t
         LEFT JOIN ticket_instances ti ON t.id = ti.ticket_id
         WHERE t.event_id = $1
         GROUP BY t.id, t.name, t.quantity, t.sold`,
        [eventId]
      ),
    ]);

    const totalTickets = parseInt(totalResult.rows[0].count, 10);
    const checkedInTickets = parseInt(checkedInResult.rows[0].count, 10);

    const ticketBreakdown = ticketsResult.rows.map((ticket) => ({
      name: ticket.name,
      sold: ticket.sold,
      checkedIn: parseInt(ticket.checked_in_count, 10),
      pending: ticket.sold - parseInt(ticket.checked_in_count, 10),
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
    const eventResult = await query<{ id: string; organizer_id: string }>(
      'SELECT id, organizer_id FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    const event = eventResult.rows[0];

    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    const historyResult = await query<{
      ticket_name: string;
      user_name: string;
      user_email: string;
      checked_in_at: Date;
    }>(
      `SELECT t.name as ticket_name, u.name as user_name, u.email as user_email, ti.checked_in_at
       FROM ticket_instances ti
       JOIN tickets t ON ti.ticket_id = t.id
       JOIN order_items oi ON ti.order_item_id = oi.id
       JOIN orders o ON oi.order_id = o.id
       JOIN users u ON o.user_id = u.id
       WHERE t.event_id = $1 AND ti.checked_in = true
       ORDER BY ti.checked_in_at DESC
       LIMIT 100`,
      [eventId]
    );

    return historyResult.rows.map((item) => ({
      ticketType: item.ticket_name,
      holderName: item.user_name,
      holderEmail: item.user_email,
      checkedInAt: item.checked_in_at,
    }));
  }
}
