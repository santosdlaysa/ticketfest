import { Router } from 'express';
import { splitController } from '../controllers/split.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// Public route - get platform default percentages
router.get('/defaults', (req, res, next) => splitController.getPlatformDefaults(req, res, next));

// All other routes require authentication
router.use(authenticate);

// Get split rule for an event
router.get('/events/:eventId', (req, res, next) => splitController.getSplitRule(req, res, next));

// Create split rule for an event (organizer or admin)
router.post('/events/:eventId', (req, res, next) => splitController.createSplitRule(req, res, next));

// Update split rule (ADMIN only)
router.put('/events/:eventId', authorize('ADMIN'), (req, res, next) => splitController.updateSplitRule(req, res, next));

// Calculate split preview for an amount
router.get('/events/:eventId/calculate', (req, res, next) => splitController.calculateSplit(req, res, next));

// Get split transactions for an event
router.get('/events/:eventId/transactions', (req, res, next) => splitController.getSplitTransactions(req, res, next));

export default router;
