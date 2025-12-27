import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventRoutes from './event.routes.js';
import ticketRoutes from './ticket.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import checkinRoutes from './checkin.routes.js';
import statsRoutes from './stats.routes.js';
import venueRoutes from './venue.routes.js';
import adminRoutes from './admin.routes.js';
import webhookRoutes from './webhook.routes.js';
import uploadRoutes from './upload.routes.js';
import payoutRoutes from './payout.routes.js';
import couponRoutes from './coupon.routes.js';
import permissionsRoutes from './permissions.routes.js';
import { getConnectionStatus, query } from '../config/database.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  const dbStatus = getConnectionStatus();

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      active: dbStatus.active,
      primary: dbStatus.primary.healthy ? 'healthy' : 'unhealthy',
      secondary: dbStatus.secondary.configured
        ? dbStatus.secondary.healthy ? 'healthy' : 'unhealthy'
        : 'not configured',
      failover: dbStatus.failoverEnabled ? 'enabled' : 'disabled',
    },
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/checkin', checkinRoutes);
router.use('/stats', statsRoutes);
router.use('/venues', venueRoutes);
router.use('/admin', adminRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/upload', uploadRoutes);
router.use('/payouts', payoutRoutes);
router.use('/coupons', couponRoutes);
router.use('/permissions', permissionsRoutes);

// Test endpoint - ONLY FOR DEVELOPMENT
if (process.env.NODE_ENV !== 'production') {
  router.post('/test/simulate-payment/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;

      // Update order to paid
      const result = await query(
        `UPDATE orders
         SET payment_status = 'PAID', status = 'CONFIRMED', paid_at = NOW()
         WHERE id = $1
         RETURNING id, payment_status, status`,
        [orderId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`[TEST] Simulated payment for order ${orderId}`);
      return res.json({
        message: 'Payment simulated successfully',
        order: result.rows[0]
      });
    } catch (error: any) {
      console.error('Test simulate payment error:', error);
      return res.status(500).json({ error: error.message });
    }
  });
}

export default router;
