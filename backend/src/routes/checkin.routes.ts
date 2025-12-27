import { Router } from 'express';
import { CheckinController } from '../controllers/checkin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { checkinRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();
const checkinController = new CheckinController();

router.use(authenticate);

// Validate and check-in a ticket (rate limited to prevent scanning abuse)
router.post('/validate', checkinRateLimiter, (req, res) => checkinController.validateTicket(req, res));

// Get event check-in statistics (organizers/admins only)
router.get(
  '/event/:eventId/stats',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => checkinController.getEventStats(req, res)
);

// Get check-in history (organizers/admins only)
router.get(
  '/event/:eventId/history',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => checkinController.getCheckinHistory(req, res)
);

export default router;
