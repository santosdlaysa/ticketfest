import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const eventController = new EventController();

// Public routes
router.get('/', (req, res) => eventController.getAllEvents(req, res));
router.get('/featured', (req, res) => eventController.getFeaturedEvents(req, res));
router.get('/category/:category', (req, res) => eventController.getEventsByCategory(req, res));
router.get('/slug/:slug', (req, res) => eventController.getEventBySlug(req, res));

// Protected route - My events (must be before /:id to avoid conflict)
router.get('/my', authenticate, authorize('ORGANIZER', 'ADMIN'), (req, res) => eventController.getMyEvents(req, res));

router.get('/:id', (req, res) => eventController.getEventById(req, res));

// Protected routes (Organizer/Admin only)
router.post(
  '/',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => eventController.createEvent(req, res)
);

router.put(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => eventController.updateEvent(req, res)
);

router.delete(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => eventController.deleteEvent(req, res)
);

export default router;
