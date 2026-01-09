import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// Public - validate coupon
router.post('/validate', (req, res, next) => couponController.validate(req, res, next));

// Protected - organizer/admin only
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), (req, res, next) =>
  couponController.create(req, res, next)
);

router.get('/my', authenticate, authorize('ORGANIZER', 'ADMIN'), (req, res, next) =>
  couponController.getByOrganizer(req, res, next)
);

router.get('/event/:eventId', authenticate, (req, res, next) =>
  couponController.getByEvent(req, res, next)
);

router.put('/:couponId', authenticate, authorize('ORGANIZER', 'ADMIN'), (req, res, next) =>
  couponController.update(req, res, next)
);

router.delete('/:couponId', authenticate, authorize('ORGANIZER', 'ADMIN'), (req, res, next) =>
  couponController.delete(req, res, next)
);

export default router;
