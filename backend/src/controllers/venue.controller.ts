import { Request, Response, NextFunction } from 'express';
import { VenueService } from '../services/venue.service.js';
import { createVenueSchema, updateVenueSchema } from '../utils/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

const venueService = new VenueService();

export class VenueController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const validatedData = createVenueSchema.parse(req.body);
      const venue = await venueService.createVenue(validatedData, userId);

      res.status(201).json(venue);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const venues = await venueService.getAllVenues(userId);

      res.json(venues);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const venue = await venueService.getVenueById(id, userId);

      res.json(venue);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { id } = req.params;

      if (!userId || !userRole) {
        throw new AppError(401, 'Unauthorized');
      }

      const validatedData = updateVenueSchema.parse(req.body);
      const venue = await venueService.updateVenue(id, validatedData, userId, userRole);

      res.json(venue);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { id } = req.params;

      if (!userId || !userRole) {
        throw new AppError(401, 'Unauthorized');
      }

      const result = await venueService.deleteVenue(id, userId, userRole);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { q } = req.query;

      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const venues = await venueService.searchVenues(userId, q as string);

      res.json(venues);
    } catch (error) {
      next(error);
    }
  }
}
