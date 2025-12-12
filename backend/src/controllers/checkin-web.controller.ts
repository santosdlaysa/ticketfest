import { Request, Response } from 'express';
import { CheckinUseCaseFactory } from '../infrastructure/factories/CheckinUseCaseFactory.js';

export class CheckinWebController {
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;

      const useCase = CheckinUseCaseFactory.getCheckinStatsUseCase();
      const result = await useCase.execute({ eventId });

      res.json(result);
    } catch (error: any) {
      console.error('Error getting checkin stats:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async searchTickets(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const { query, status, page, limit } = req.query;

      const useCase = CheckinUseCaseFactory.searchTicketsUseCase();
      const result = await useCase.execute({
        eventId,
        query: query as string | undefined,
        status: status as 'all' | 'checked_in' | 'pending' | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error searching tickets:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async validateTicket(req: Request, res: Response): Promise<void> {
    try {
      const { qrCode, performCheckin } = req.body;

      if (!qrCode) {
        res.status(400).json({ error: 'QR code is required' });
        return;
      }

      const useCase = CheckinUseCaseFactory.validateTicketUseCase();
      const result = await useCase.execute({
        qrCode,
        performCheckin: performCheckin === true,
        checkedInBy: req.user?.id,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error validating ticket:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async manualCheckin(req: Request, res: Response): Promise<void> {
    try {
      const { ticketInstanceId } = req.params;

      const useCase = CheckinUseCaseFactory.manualCheckinUseCase();
      const result = await useCase.execute({
        ticketInstanceId,
        checkedInBy: req.user?.id,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error performing manual checkin:', error);
      res.status(400).json({ error: error.message || 'Failed to check in' });
    }
  }

  async undoCheckin(req: Request, res: Response): Promise<void> {
    try {
      const { ticketInstanceId } = req.params;

      const useCase = CheckinUseCaseFactory.undoCheckinUseCase();
      const result = await useCase.execute({ ticketInstanceId });

      res.json(result);
    } catch (error: any) {
      console.error('Error undoing checkin:', error);
      res.status(400).json({ error: error.message || 'Failed to undo check in' });
    }
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const { limit } = req.query;

      const useCase = CheckinUseCaseFactory.getCheckinHistoryUseCase();
      const result = await useCase.execute({
        eventId,
        limit: limit ? Number(limit) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error getting checkin history:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
