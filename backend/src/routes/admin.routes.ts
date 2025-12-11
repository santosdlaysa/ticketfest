import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN', 'ORGANIZER'));

// Dashboard
router.get('/dashboard', (req, res) => adminController.getDashboard(req, res));

// Orders Management
router.get('/orders', (req, res) => adminController.getAllOrders(req, res));
router.get('/orders/:id', (req, res) => adminController.getOrderDetails(req, res));
router.post('/orders/:id/refund', (req, res) => adminController.refundOrder(req, res));
router.post('/orders/:id/resend-email', (req, res) => adminController.resendOrderEmail(req, res));

// Reports
router.get('/reports/sales', (req, res) => adminController.getSalesReport(req, res));
router.get('/reports/revenue', (req, res) => adminController.getRevenueReport(req, res));
router.get('/reports/export', (req, res) => adminController.exportReport(req, res));

// Financial Dashboard
router.get('/financial/summary', (req, res) => adminController.getFinancialSummary(req, res));
router.get('/financial/transactions', (req, res) => adminController.getTransactions(req, res));

// Payouts Management
router.get('/payouts', (req, res) => adminController.getAllPayouts(req, res));
router.post('/payouts/:id/approve', authorize('ADMIN'), (req, res) => adminController.approvePayout(req, res));
router.post('/payouts/:id/reject', authorize('ADMIN'), (req, res) => adminController.rejectPayout(req, res));

// Export Attendees
router.get('/events/:eventId/attendees/export', (req, res) => adminController.exportEventAttendees(req, res));

// Reminders (manual trigger - ADMIN only)
router.post('/reminders/trigger', authorize('ADMIN'), (req, res) => adminController.triggerReminders(req, res));

export default router;
