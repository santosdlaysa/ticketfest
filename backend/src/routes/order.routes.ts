import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
const orderController = new OrderController();

// Payment config - public route
router.get('/payment-config', (req, res) => orderController.getPaymentConfig(req, res));

router.use(authenticate); // All order routes require authentication

router.post('/', (req, res) => orderController.createOrder(req, res));
router.get('/', (req, res) => orderController.getUserOrders(req, res));
router.get('/:id', (req, res) => orderController.getOrderById(req, res));
router.post('/:id/confirm-payment', (req, res) => orderController.confirmPayment(req, res));
router.post('/:id/cancel', (req, res) => orderController.cancelOrder(req, res));
router.post('/card-token', (req, res) => orderController.createCardToken(req, res));

export default router;
