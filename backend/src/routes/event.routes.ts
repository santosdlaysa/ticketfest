import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { splitPaymentController } from '../controllers/split-payment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const eventController = new EventController();

// Public routes
router.get('/', (req, res) => eventController.getAllEvents(req, res));
router.get('/featured', (req, res) => eventController.getFeaturedEvents(req, res));
router.get('/category/:category', (req, res) => eventController.getEventsByCategory(req, res));
router.get('/slug/:slug', (req, res) => eventController.getEventBySlug(req, res));
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

// ============================================
// SPLIT PAYMENT ROUTES FOR EVENTS
// ============================================

// POST /api/events/:id/split-rules - Definir regras de split para um evento
router.post(
  '/:id/split-rules',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => splitPaymentController.createSplitRule(req, res)
);

// GET /api/events/:id/split-rules - Obter regras de split de um evento
router.get(
  '/:id/split-rules',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => splitPaymentController.getSplitRule(req, res)
);

// PUT /api/events/:id/split-rules - Atualizar regras de split de um evento
router.put(
  '/:id/split-rules',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => splitPaymentController.updateSplitRule(req, res)
);

export default router;
