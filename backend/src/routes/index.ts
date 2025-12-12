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
import { getConnectionStatus } from '../config/database.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
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

export default router;
