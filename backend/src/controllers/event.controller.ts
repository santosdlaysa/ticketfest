import { Request, Response } from 'express';
import { EventService } from '../services/event.service.js';
import { validate, createEventSchema, updateEventSchema } from '../utils/validation.js';

const eventService = new EventService();

export class EventController {
  async createEvent(req: Request, res: Response) {
    const data = validate(createEventSchema)(req.body);
    const organizerId = req.user!.id;

    const event = await eventService.createEvent(data, organizerId);
    res.status(201).json(event);
  }

  async getAllEvents(req: Request, res: Response) {
    const { category, search, status, limit, offset } = req.query;

    const filters = {
      category: category as string,
      search: search as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const result = await eventService.getAllEvents(filters);
    res.status(200).json(result);
  }

  async getEventById(req: Request, res: Response) {
    const { id } = req.params;
    const event = await eventService.getEventById(id);
    res.status(200).json(event);
  }

  async getEventBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const event = await eventService.getEventBySlug(slug);
    res.status(200).json(event);
  }

  async updateEvent(req: Request, res: Response) {
    const { id } = req.params;
    const data = validate(updateEventSchema)(req.body);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const event = await eventService.updateEvent(id, data, userId, userRole);
    res.status(200).json(event);
  }

  async deleteEvent(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const result = await eventService.deleteEvent(id, userId, userRole);
    res.status(200).json(result);
  }

  async getFeaturedEvents(_req: Request, res: Response) {
    const events = await eventService.getFeaturedEvents();
    res.status(200).json(events);
  }

  async getEventsByCategory(req: Request, res: Response) {
    const { category } = req.params;
    const events = await eventService.getEventsByCategory(category);
    res.status(200).json(events);
  }
}
