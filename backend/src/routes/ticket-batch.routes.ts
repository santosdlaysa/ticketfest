import { Router } from 'express';
import { TicketBatchController } from '../controllers/ticket-batch.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const ticketBatchController = new TicketBatchController();

// ========================================
// PUBLIC ROUTES
// ========================================

// GET /api/tickets/:ticketId/batches - Get batches for a ticket (public)
router.get(
  '/:ticketId/batches',
  (req, res) => ticketBatchController.getByTicket(req, res)
);

// ========================================
// PROTECTED ROUTES (Organizers/Admins)
// ========================================

// POST /api/tickets/:ticketId/batches - Create a new batch
router.post(
  '/:ticketId/batches',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => ticketBatchController.create(req, res)
);

// PUT /api/tickets/:ticketId/batches/:batchId - Update a batch
router.put(
  '/:ticketId/batches/:batchId',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => ticketBatchController.update(req, res)
);

// DELETE /api/tickets/:ticketId/batches/:batchId - Delete a batch
router.delete(
  '/:ticketId/batches/:batchId',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => ticketBatchController.delete(req, res)
);

export default router;
