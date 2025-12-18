import { Router } from 'express';
import { payoutController } from '../controllers/payout.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get organizer's financial balance
router.get('/balance', (req, res, next) => payoutController.getBalance(req, res, next));

// Get detailed balance breakdown
router.get('/balance/breakdown', (req, res, next) => payoutController.getBalanceBreakdown(req, res, next));

// Get revenue by event
router.get('/revenue-by-event', (req, res, next) => payoutController.getRevenueByEvent(req, res, next));

// Check if can request payout
router.get('/can-request', (req, res, next) => payoutController.canRequestPayout(req, res, next));

// Calculate payout fee
router.get('/calculate-fee', (req, res, next) => payoutController.calculateFee(req, res, next));

// Get payout history
router.get('/', (req, res, next) => payoutController.getMyPayouts(req, res, next));

// Get payout by ID
router.get('/:id', (req, res, next) => payoutController.getPayoutById(req, res, next));

// Request a new payout
router.post('/request', (req, res, next) => payoutController.requestPayout(req, res, next));

// Cancel a pending payout
router.post('/:id/cancel', (req, res, next) => payoutController.cancelPayout(req, res, next));

export default router;
