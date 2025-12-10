import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const statsController = new StatsController();

// All stats routes require authentication and ORGANIZER or ADMIN role
router.use(authenticate);
router.use(authorize('ORGANIZER', 'ADMIN'));

// GET /api/stats/organizer - Get organizer dashboard statistics
router.get('/organizer', statsController.getOrganizerStats.bind(statsController));

// GET /api/stats/event/:eventId - Get specific event statistics
router.get('/event/:eventId', statsController.getEventStats.bind(statsController));

export default router;
