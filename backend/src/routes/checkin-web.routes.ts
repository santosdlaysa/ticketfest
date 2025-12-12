import { Router } from 'express';
import { CheckinWebController } from '../controllers/checkin-web.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const checkinWebController = new CheckinWebController();

// All routes require authentication
router.use(authenticate);

// ========================================
// CHECK-IN WEB DASHBOARD ROUTES
// ========================================

// GET /api/checkin-web/events/:eventId/stats - Get check-in statistics
router.get(
  '/events/:eventId/stats',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => checkinWebController.getStats(req, res)
);

// GET /api/checkin-web/events/:eventId/tickets - Search/list tickets for check-in
router.get(
  '/events/:eventId/tickets',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => checkinWebController.searchTickets(req, res)
);

// POST /api/checkin-web/events/:eventId/search - Search tickets (alias with POST body)
router.post(
  '/events/:eventId/search',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => {
    // Move body params to query for the handler
    req.query = { ...req.query, ...req.body };
    checkinWebController.searchTickets(req, res);
  }
);

// GET /api/checkin-web/events/:eventId/history - Get check-in history
router.get(
  '/events/:eventId/history',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => checkinWebController.getHistory(req, res)
);

// POST /api/checkin-web/validate - Validate a ticket by QR code
router.post(
  '/validate',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => checkinWebController.validateTicket(req, res)
);

// POST /api/checkin-web/tickets/:ticketInstanceId/checkin - Manual check-in
router.post(
  '/tickets/:ticketInstanceId/checkin',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => checkinWebController.manualCheckin(req, res)
);

// POST /api/checkin-web/tickets/:ticketInstanceId/undo - Undo check-in
router.post(
  '/tickets/:ticketInstanceId/undo',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => checkinWebController.undoCheckin(req, res)
);

export default router;
