import { Router } from 'express';
import { CartController } from '../controllers/cart.controller.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();
const cartController = new CartController();

// Apply optionalAuth to all cart routes so req.user is populated if logged in
router.use(optionalAuth);

router.get('/', (req, res) => cartController.getCart(req, res));
router.post('/add', (req, res) => cartController.addToCart(req, res));
router.put('/item/:itemId', (req, res) => cartController.updateCartItem(req, res));
router.delete('/item/:itemId', (req, res) => cartController.removeFromCart(req, res));
router.delete('/clear', (req, res) => cartController.clearCart(req, res));

export default router;
