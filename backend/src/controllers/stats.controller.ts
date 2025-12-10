import { Request, Response, NextFunction } from 'express';
import { StatsService } from '../services/stats.service.js';

const statsService = new StatsService();

export class StatsController {
  async getOrganizerStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const stats = await statsService.getOrganizerStats(userId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getEventStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { eventId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const stats = await statsService.getEventStats(eventId, userId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
