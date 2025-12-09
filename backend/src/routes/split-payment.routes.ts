import { Router } from 'express';
import { splitPaymentController } from '../controllers/split-payment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// ============================================
// ORGANIZER ACCOUNT ROUTES
// ============================================

// POST /api/split/account - Criar conta de organizador
router.post('/account', (req, res) => splitPaymentController.createOrganizerAccount(req, res));

// GET /api/split/account - Obter conta de organizador do usuário atual
router.get('/account', (req, res) => splitPaymentController.getOrganizerAccount(req, res));

// PUT /api/split/account/bank-details - Atualizar dados bancários
router.put('/account/bank-details', (req, res) =>
  splitPaymentController.updateBankDetails(req, res)
);

// POST /api/split/account/:id/verify - Verificar conta (ADMIN only)
router.post('/account/:id/verify', authorize('ADMIN'), (req, res) =>
  splitPaymentController.verifyOrganizerAccount(req, res)
);

// ============================================
// PAYOUT ROUTES
// ============================================

// GET /api/payouts/:organizerId - Listar repasses de um organizador
router.get('/payouts/:organizerId', (req, res) => splitPaymentController.getPayouts(req, res));

// POST /api/payouts/:organizerId/withdraw - Solicitar saque
router.post('/payouts/:organizerId/withdraw', (req, res) =>
  splitPaymentController.createPayout(req, res)
);

// POST /api/payouts/:payoutId/process - Processar saque (ADMIN only)
router.post('/payouts/:payoutId/process', authorize('ADMIN'), (req, res) =>
  splitPaymentController.processPayout(req, res)
);

export default router;
