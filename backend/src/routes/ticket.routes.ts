import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const ticketController = new TicketController();

// Public routes
router.get('/event/:eventId', (req, res) => ticketController.getTicketsByEvent(req, res));
router.get('/:id', (req, res) => ticketController.getTicketById(req, res));

// Protected routes
router.post(
  '/',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => ticketController.createTicket(req, res)
);

router.put(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => ticketController.updateTicket(req, res)
);

router.delete(
  '/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => ticketController.deleteTicket(req, res)
);

export default router;
