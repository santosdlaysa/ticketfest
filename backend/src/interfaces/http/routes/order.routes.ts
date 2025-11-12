import { Router } from 'express';
import { OrderController } from '../controllers/OrderController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
const orderController = new OrderController();

router.use(authenticate); // All order routes require authentication

router.post('/', (req, res) => orderController.createOrder(req, res));
router.get('/', (req, res) => orderController.getUserOrders(req, res));
router.get('/:id', (req, res) => orderController.getOrderById(req, res));
router.post('/:id/confirm-payment', (req, res) => orderController.confirmPayment(req, res));
router.post('/:id/cancel', (req, res) => orderController.cancelOrder(req, res));

export default router;
