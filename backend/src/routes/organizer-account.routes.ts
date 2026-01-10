import { Router } from 'express';
import { organizerAccountController } from '../controllers/organizer-account.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's organizer account
router.get('/me', (req, res, next) => organizerAccountController.getMyAccount(req, res, next));

// Create organizer account for current user
router.post('/', (req, res, next) => organizerAccountController.createAccount(req, res, next));

// Update company info
router.put('/company', (req, res, next) => organizerAccountController.updateCompanyInfo(req, res, next));

// Update bank details
router.put('/bank', (req, res, next) => organizerAccountController.updateBankDetails(req, res, next));

// Request account verification
router.post('/request-verification', (req, res, next) => organizerAccountController.requestVerification(req, res, next));

// Get balance
router.get('/balance', (req, res, next) => organizerAccountController.getBalance(req, res, next));

// Admin routes
router.get('/', (req, res, next) => organizerAccountController.listAccounts(req, res, next));
router.post('/:accountId/verify', (req, res, next) => organizerAccountController.verifyAccount(req, res, next));

export default router;
