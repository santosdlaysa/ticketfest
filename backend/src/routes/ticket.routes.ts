import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller.js';
import { ticketBatchController } from '../controllers/ticket-batch.controller.js';
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

// ========================================
// TICKET BATCH ROUTES
// ========================================

// Listar lotes de um ticket
router.get('/:ticketId/batches', (req, res, next) => ticketBatchController.getByTicket(req, res, next));

// Criar lote (ORGANIZER/ADMIN)
router.post(
  '/:ticketId/batches',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res, next) => ticketBatchController.create(req, res, next)
);

// Atualizar lote (ORGANIZER/ADMIN)
router.put(
  '/:ticketId/batches/:batchId',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res, next) => ticketBatchController.update(req, res, next)
);

// Excluir lote (ORGANIZER/ADMIN)
router.delete(
  '/:ticketId/batches/:batchId',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res, next) => ticketBatchController.delete(req, res, next)
);

export default router;
