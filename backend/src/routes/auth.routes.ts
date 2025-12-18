import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
const authController = new AuthController();

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.get('/profile', authenticate, (req, res) => authController.getProfile(req, res));

// Password reset routes
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res, next));
router.get('/verify-reset-token/:token', (req, res, next) => authController.verifyResetToken(req, res, next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));

export default router;
