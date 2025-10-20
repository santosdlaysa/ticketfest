import { Request, Response } from 'express';
import { TicketService } from '../services/ticket.service.js';
import { validate, createTicketSchema } from '../utils/validation.js';

const ticketService = new TicketService();

export class TicketController {
  async createTicket(req: Request, res: Response) {
    const data = validate(createTicketSchema)(req.body);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const ticket = await ticketService.createTicket(data, userId, userRole);
    res.status(201).json(ticket);
  }

  async getTicketsByEvent(req: Request, res: Response) {
    const { eventId } = req.params;
    const tickets = await ticketService.getTicketsByEvent(eventId);
    res.status(200).json(tickets);
  }

  async getTicketById(req: Request, res: Response) {
    const { id } = req.params;
    const ticket = await ticketService.getTicketById(id);
    res.status(200).json(ticket);
  }

  async updateTicket(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const ticket = await ticketService.updateTicket(id, req.body, userId, userRole);
    res.status(200).json(ticket);
  }

  async deleteTicket(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const result = await ticketService.deleteTicket(id, userId, userRole);
    res.status(200).json(result);
  }
}
