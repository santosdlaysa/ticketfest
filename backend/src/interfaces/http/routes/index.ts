import { Router } from 'express';
import orderRoutes from './order.routes.js';

// Import old routes temporarily until migration is complete
import authRoutes from '../../../routes/auth.routes.js';
import eventRoutes from '../../../routes/event.routes.js';
import ticketRoutes from '../../../routes/ticket.routes.js';
import cartRoutes from '../../../routes/cart.routes.js';
import checkinRoutes from '../../../routes/checkin.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    architecture: 'Clean Architecture',
  });
});

// New clean architecture routes
router.use('/orders', orderRoutes);

// Old routes (to be migrated)
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);
router.use('/cart', cartRoutes);
router.use('/checkin', checkinRoutes);

export default router;
