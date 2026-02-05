import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

export class TicketBatchController {
  /**
   * GET /tickets/:ticketId/batches
   */
  async getByTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketId } = req.params;
      const { activeOnly } = req.query;

      // Verificar se o ticket existe
      const ticketResult = await query(
        'SELECT id FROM tickets WHERE id = $1',
        [ticketId]
      );

      if (ticketResult.rows.length === 0) {
        throw new AppError(404, 'Ticket not found');
      }

      let whereClause = 'WHERE ticket_id = $1';
      if (activeOnly === 'true') {
        whereClause += ' AND is_active = true';
      }

      const batchesResult = await query(
        `SELECT * FROM ticket_batches ${whereClause} ORDER BY display_order ASC, sales_start ASC`,
        [ticketId]
      );

      const now = new Date();
      const batches = batchesResult.rows.map(b => this.formatBatch(b, now));

      // Encontrar lote atual (ativo, em período de venda, com estoque)
      const currentBatch = batches.find(b => b.isOnSale && !b.isSoldOut) || null;

      const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
      const totalSold = batches.reduce((sum, b) => sum + b.sold, 0);
      const totalAvailable = batches.reduce((sum, b) => sum + b.available, 0);

      return res.json({
        batches,
        currentBatch,
        totalQuantity,
        totalSold,
        totalAvailable,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /tickets/:ticketId/batches
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketId } = req.params;
      const { name, price, quantity, salesStart, salesEnd, order } = req.body;

      if (!name || price === undefined || !quantity || !salesStart || !salesEnd) {
        throw new AppError(400, 'Name, price, quantity, salesStart and salesEnd are required');
      }

      // Verificar se o ticket existe
      const ticketResult = await query(
        'SELECT id, event_id FROM tickets WHERE id = $1',
        [ticketId]
      );

      if (ticketResult.rows.length === 0) {
        throw new AppError(404, 'Ticket not found');
      }

      // Determinar a ordem se não fornecida
      let displayOrder = order;
      if (displayOrder === undefined) {
        const maxOrderResult = await query(
          'SELECT COALESCE(MAX(display_order), -1) as max_order FROM ticket_batches WHERE ticket_id = $1',
          [ticketId]
        );
        displayOrder = parseInt(maxOrderResult.rows[0].max_order, 10) + 1;
      }

      const result = await query(
        `INSERT INTO ticket_batches (ticket_id, name, price, quantity, sales_start, sales_end, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [ticketId, name, price, quantity, new Date(salesStart), new Date(salesEnd), displayOrder]
      );

      return res.status(201).json(this.formatBatch(result.rows[0], new Date()));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /tickets/:ticketId/batches/:batchId
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketId, batchId } = req.params;
      const { name, price, quantity, salesStart, salesEnd, isActive, order } = req.body;

      // Verificar se o batch existe e pertence ao ticket
      const batchResult = await query(
        'SELECT * FROM ticket_batches WHERE id = $1 AND ticket_id = $2',
        [batchId, ticketId]
      );

      if (batchResult.rows.length === 0) {
        throw new AppError(404, 'Batch not found');
      }

      const updates: string[] = [];
      const params: any[] = [batchId];
      let paramIndex = 2;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }
      if (price !== undefined) {
        updates.push(`price = $${paramIndex}`);
        params.push(price);
        paramIndex++;
      }
      if (quantity !== undefined) {
        updates.push(`quantity = $${paramIndex}`);
        params.push(quantity);
        paramIndex++;
      }
      if (salesStart !== undefined) {
        updates.push(`sales_start = $${paramIndex}`);
        params.push(new Date(salesStart));
        paramIndex++;
      }
      if (salesEnd !== undefined) {
        updates.push(`sales_end = $${paramIndex}`);
        params.push(new Date(salesEnd));
        paramIndex++;
      }
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }
      if (order !== undefined) {
        updates.push(`display_order = $${paramIndex}`);
        params.push(order);
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new AppError(400, 'No fields to update');
      }

      updates.push('updated_at = NOW()');

      const result = await query(
        `UPDATE ticket_batches SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
        params
      );

      return res.json(this.formatBatch(result.rows[0], new Date()));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * DELETE /tickets/:ticketId/batches/:batchId
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketId, batchId } = req.params;

      // Verificar se o batch existe e pertence ao ticket
      const batchResult = await query(
        'SELECT id, sold FROM ticket_batches WHERE id = $1 AND ticket_id = $2',
        [batchId, ticketId]
      );

      if (batchResult.rows.length === 0) {
        throw new AppError(404, 'Batch not found');
      }

      if (batchResult.rows[0].sold > 0) {
        throw new AppError(400, 'Cannot delete batch with sold tickets');
      }

      await query('DELETE FROM ticket_batches WHERE id = $1', [batchId]);

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  private formatBatch(row: any, now: Date) {
    const salesStart = new Date(row.sales_start);
    const salesEnd = new Date(row.sales_end);
    const isActive = row.is_active;
    const sold = row.sold || 0;
    const available = row.quantity - sold;
    const isOnSale = isActive && now >= salesStart && now <= salesEnd && available > 0;
    const isSoldOut = available <= 0;
    const salesProgress = row.quantity > 0 ? (sold / row.quantity) * 100 : 0;

    return {
      id: row.id,
      ticketId: row.ticket_id,
      name: row.name,
      price: parseFloat(row.price),
      quantity: row.quantity,
      sold,
      available,
      salesStart: row.sales_start,
      salesEnd: row.sales_end,
      isActive,
      isOnSale,
      isSoldOut,
      salesProgress,
      order: row.display_order || 0,
    };
  }
}

export const ticketBatchController = new TicketBatchController();
