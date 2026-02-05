import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { QRCodeService } from '../services/qrcode.service.js';

const qrCodeService = new QRCodeService();

export class CheckinWebController {
  /**
   * GET /checkin-web/events/:eventId/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      await this.verifyEventAccess(eventId, userId, userRole);

      const [totalResult, checkedInResult] = await Promise.all([
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
      ]);

      const total = parseInt(totalResult.rows[0].count, 10);
      const checkedIn = parseInt(checkedInResult.rows[0].count, 10);
      const pending = total - checkedIn;
      const percentageCheckedIn = total > 0 ? (checkedIn / total) * 100 : 0;

      return res.json({ total, checkedIn, pending, percentageCheckedIn });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /checkin-web/events/:eventId/tickets
   */
  async searchTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const {
        query: searchQuery,
        status = 'all',
        page = '1',
        limit = '50',
      } = req.query;

      await this.verifyEventAccess(eventId, userId, userRole);

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
      const offset = (pageNum - 1) * limitNum;

      let whereClause = 'WHERE t.event_id = $1';
      const params: any[] = [eventId];
      let paramIndex = 2;

      // Filtro de status
      if (status === 'checked_in') {
        whereClause += ' AND ti.checked_in = true';
      } else if (status === 'pending') {
        whereClause += ' AND ti.checked_in = false';
      }

      // Filtro de busca
      if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
        whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR ti.qr_code ILIKE $${paramIndex})`;
        params.push(`%${searchQuery.trim()}%`);
        paramIndex++;
      }

      const [ticketsResult, countResult] = await Promise.all([
        query(
          `SELECT ti.id, ti.qr_code, ti.checked_in, ti.checked_in_at,
                  t.name as ticket_name,
                  u.name as attendee_name, u.email as attendee_email,
                  o.created_at as order_date
           FROM ticket_instances ti
           JOIN tickets t ON ti.ticket_id = t.id
           JOIN order_items oi ON ti.order_item_id = oi.id
           JOIN orders o ON oi.order_id = o.id
           JOIN users u ON o.user_id = u.id
           ${whereClause}
           ORDER BY ti.checked_in ASC, u.name ASC
           LIMIT ${limitNum} OFFSET ${offset}`,
          params
        ),
        query(
          `SELECT COUNT(*) as count
           FROM ticket_instances ti
           JOIN tickets t ON ti.ticket_id = t.id
           JOIN order_items oi ON ti.order_item_id = oi.id
           JOIN orders o ON oi.order_id = o.id
           JOIN users u ON o.user_id = u.id
           ${whereClause}`,
          params
        ),
      ]);

      const total = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(total / limitNum);

      const tickets = ticketsResult.rows.map(row => ({
        id: row.id,
        qrCode: row.qr_code,
        ticketName: row.ticket_name,
        attendeeName: row.attendee_name,
        attendeeEmail: row.attendee_email,
        orderDate: row.order_date,
        checkedIn: row.checked_in,
        checkedInAt: row.checked_in_at,
      }));

      return res.json({ tickets, total, page: pageNum, limit: limitNum, totalPages });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /checkin-web/events/:eventId/history
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { limit = '10' } = req.query;

      await this.verifyEventAccess(eventId, userId, userRole);

      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));

      const [historyResult, countResult] = await Promise.all([
        query(
          `SELECT ti.id, ti.id as ticket_instance_id, t.name as ticket_name,
                  u.name as attendee_name, u.email as attendee_email, ti.checked_in_at
           FROM ticket_instances ti
           JOIN tickets t ON ti.ticket_id = t.id
           JOIN order_items oi ON ti.order_item_id = oi.id
           JOIN orders o ON oi.order_id = o.id
           JOIN users u ON o.user_id = u.id
           WHERE t.event_id = $1 AND ti.checked_in = true
           ORDER BY ti.checked_in_at DESC
           LIMIT $2`,
          [eventId, limitNum]
        ),
        query(
          `SELECT COUNT(*) as count FROM ticket_instances ti
           JOIN tickets t ON ti.ticket_id = t.id
           WHERE t.event_id = $1 AND ti.checked_in = true`,
          [eventId]
        ),
      ]);

      const history = historyResult.rows.map(row => ({
        id: row.id,
        ticketInstanceId: row.ticket_instance_id,
        ticketName: row.ticket_name,
        attendeeName: row.attendee_name,
        attendeeEmail: row.attendee_email,
        checkedInAt: row.checked_in_at,
      }));

      return res.json({ history, total: parseInt(countResult.rows[0].count, 10) });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /checkin-web/validate
   */
  async validateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrCode, performCheckin = false } = req.body;

      if (!qrCode) {
        throw new AppError(400, 'QR code is required');
      }

      // Tentar validar o QR code
      const validation = qrCodeService.validateQRCode(qrCode);

      if (!validation.valid || !validation.data) {
        return res.json({
          valid: false,
          ticket: null,
          message: validation.error || 'Invalid QR code',
          alreadyCheckedIn: false,
        });
      }

      const { ticketId } = validation.data;

      // Buscar ticket instance
      const result = await query(
        `SELECT ti.*, t.name as ticket_name,
                u.name as attendee_name, u.email as attendee_email,
                o.created_at as order_date, o.payment_status, o.status as order_status
         FROM ticket_instances ti
         JOIN tickets t ON ti.ticket_id = t.id
         JOIN order_items oi ON ti.order_item_id = oi.id
         JOIN orders o ON oi.order_id = o.id
         JOIN users u ON o.user_id = u.id
         WHERE ti.qr_code_data = $1 AND ti.ticket_id = $2`,
        [qrCode, ticketId]
      );

      if (result.rows.length === 0) {
        return res.json({
          valid: false,
          ticket: null,
          message: 'Ticket not found',
          alreadyCheckedIn: false,
        });
      }

      const row = result.rows[0];

      // Verificar pagamento
      if (row.payment_status !== 'PAID') {
        return res.json({
          valid: false,
          ticket: null,
          message: 'Order not paid',
          alreadyCheckedIn: false,
        });
      }

      if (row.order_status === 'CANCELLED') {
        return res.json({
          valid: false,
          ticket: null,
          message: 'Order cancelled',
          alreadyCheckedIn: false,
        });
      }

      const ticket = {
        id: row.id,
        qrCode: row.qr_code,
        ticketName: row.ticket_name,
        attendeeName: row.attendee_name,
        attendeeEmail: row.attendee_email,
        orderDate: row.order_date,
        checkedIn: row.checked_in,
        checkedInAt: row.checked_in_at,
      };

      // Já fez check-in
      if (row.checked_in) {
        return res.json({
          valid: false,
          ticket,
          message: `Ingresso já validado em ${new Date(row.checked_in_at).toLocaleString('pt-BR')}`,
          alreadyCheckedIn: true,
        });
      }

      // Realizar check-in se solicitado
      if (performCheckin) {
        await query(
          'UPDATE ticket_instances SET checked_in = true, checked_in_at = NOW() WHERE id = $1',
          [row.id]
        );
        ticket.checkedIn = true;
        ticket.checkedInAt = new Date().toISOString();
      }

      return res.json({
        valid: true,
        ticket,
        message: performCheckin ? 'Check-in realizado com sucesso' : 'Ticket válido',
        alreadyCheckedIn: false,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /checkin-web/tickets/:ticketInstanceId/checkin
   */
  async manualCheckin(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketInstanceId } = req.params;

      // Buscar ticket instance
      const result = await query(
        `SELECT ti.*, o.payment_status, o.status as order_status
         FROM ticket_instances ti
         JOIN order_items oi ON ti.order_item_id = oi.id
         JOIN orders o ON oi.order_id = o.id
         WHERE ti.id = $1`,
        [ticketInstanceId]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Ticket not found');
      }

      const row = result.rows[0];

      if (row.payment_status !== 'PAID') {
        throw new AppError(400, 'Order not paid');
      }

      if (row.order_status === 'CANCELLED') {
        throw new AppError(400, 'Order cancelled');
      }

      if (row.checked_in) {
        throw new AppError(400, 'Ticket already checked in');
      }

      await query(
        'UPDATE ticket_instances SET checked_in = true, checked_in_at = NOW() WHERE id = $1',
        [ticketInstanceId]
      );

      return res.json({ message: 'Check-in realizado com sucesso', ticketInstanceId });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /checkin-web/tickets/:ticketInstanceId/undo
   */
  async undoCheckin(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketInstanceId } = req.params;

      const result = await query(
        'SELECT id, checked_in FROM ticket_instances WHERE id = $1',
        [ticketInstanceId]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Ticket not found');
      }

      if (!result.rows[0].checked_in) {
        throw new AppError(400, 'Ticket is not checked in');
      }

      await query(
        'UPDATE ticket_instances SET checked_in = false, checked_in_at = NULL WHERE id = $1',
        [ticketInstanceId]
      );

      return res.json({ message: 'Check-in desfeito com sucesso', ticketInstanceId });
    } catch (error) {
      return next(error);
    }
  }

  private async verifyEventAccess(eventId: string, userId: string, userRole: string) {
    const eventResult = await query(
      'SELECT id, organizer_id FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    if (userRole !== 'ADMIN' && eventResult.rows[0].organizer_id !== userId) {
      throw new AppError(403, 'Unauthorized');
    }
  }
}

export const checkinWebController = new CheckinWebController();
