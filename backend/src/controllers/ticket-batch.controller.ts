import { Request, Response } from 'express';
import { TicketBatchUseCaseFactory } from '../infrastructure/factories/TicketBatchUseCaseFactory.js';

export class TicketBatchController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { name, price, quantity, salesStart, salesEnd, order } = req.body;

      if (!name || price === undefined || !quantity || !salesStart || !salesEnd) {
        res.status(400).json({
          error: 'Missing required fields: name, price, quantity, salesStart, salesEnd',
        });
        return;
      }

      const useCase = TicketBatchUseCaseFactory.createTicketBatchUseCase();
      const result = await useCase.execute({
        ticketId,
        name,
        price: Number(price),
        quantity: Number(quantity),
        salesStart: new Date(salesStart),
        salesEnd: new Date(salesEnd),
        order: order !== undefined ? Number(order) : undefined,
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error creating ticket batch:', error);
      res.status(400).json({ error: error.message || 'Failed to create batch' });
    }
  }

  async getByTicket(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { activeOnly } = req.query;

      const useCase = TicketBatchUseCaseFactory.getTicketBatchesUseCase();
      const result = await useCase.execute({
        ticketId,
        activeOnly: activeOnly === 'true',
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error getting ticket batches:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      const { name, price, quantity, salesStart, salesEnd, isActive, order } = req.body;

      const useCase = TicketBatchUseCaseFactory.updateTicketBatchUseCase();
      const result = await useCase.execute({
        batchId,
        name,
        price: price !== undefined ? Number(price) : undefined,
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        salesStart: salesStart ? new Date(salesStart) : undefined,
        salesEnd: salesEnd ? new Date(salesEnd) : undefined,
        isActive,
        order: order !== undefined ? Number(order) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error updating ticket batch:', error);
      res.status(400).json({ error: error.message || 'Failed to update batch' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;

      const useCase = TicketBatchUseCaseFactory.deleteTicketBatchUseCase();
      await useCase.execute({ batchId });

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting ticket batch:', error);
      res.status(400).json({ error: error.message || 'Failed to delete batch' });
    }
  }
}
