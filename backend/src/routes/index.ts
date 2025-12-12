import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventRoutes from './event.routes.js';
import ticketRoutes from './ticket.routes.js';
import ticketBatchRoutes from './ticket-batch.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import checkinRoutes from './checkin.routes.js';
import checkinWebRoutes from './checkin-web.routes.js';
import splitPaymentRoutes from './split-payment.routes.js';
import statsRoutes from './stats.routes.js';
import venueRoutes from './venue.routes.js';
import adminRoutes from './admin.routes.js';
import webhookRoutes from './webhook.routes.js';
import companyRoutes from './company.routes.js';
import permissionRoutes from './permission.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);
router.use('/tickets', ticketBatchRoutes); // Batch routes mounted on /tickets/:ticketId/batches
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/checkin', checkinRoutes);
router.use('/checkin-web', checkinWebRoutes); // Web check-in dashboard
router.use('/split', splitPaymentRoutes);
router.use('/stats', statsRoutes);
router.use('/venues', venueRoutes);
router.use('/admin', adminRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/company', companyRoutes); // Company settings & team management
router.use('/permissions', permissionRoutes); // Permissions management

export default router;
