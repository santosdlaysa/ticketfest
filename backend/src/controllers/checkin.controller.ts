import { Request, Response } from 'express';
import { CheckinService } from '../services/checkin.service.js';

const checkinService = new CheckinService();

export class CheckinController {
  async validateTicket(req: Request, res: Response) {
    const { qrCodeData, eventId } = req.body;

    if (!qrCodeData) {
      return res.status(400).json({ error: 'QR code data required' });
    }

    const result = await checkinService.validateTicket(qrCodeData, eventId);
    res.status(200).json(result);
  }

  async getEventStats(req: Request, res: Response) {
    const { eventId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const stats = await checkinService.getEventCheckinStats(eventId, userId, userRole);
    res.status(200).json(stats);
  }

  async getCheckinHistory(req: Request, res: Response) {
    const { eventId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const history = await checkinService.getCheckinHistory(eventId, userId, userRole);
    res.status(200).json(history);
  }
}
