import { Router } from 'express';
import { checkinWebController } from '../controllers/checkin-web.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// Todas as rotas requerem autenticação e role ORGANIZER ou ADMIN
router.use(authenticate);

// ========================================
// ESTATÍSTICAS E BUSCA
// ========================================

// Estatísticas de check-in do evento
router.get(
  '/events/:eventId/stats',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res, next) => checkinWebController.getStats(req, res, next)
);

// Buscar ingressos do evento (com filtros e paginação)
router.get(
  '/events/:eventId/tickets',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res, next) => checkinWebController.searchTickets(req, res, next)
);

// Histórico de check-ins do evento
router.get(
  '/events/:eventId/history',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res, next) => checkinWebController.getHistory(req, res, next)
);

// ========================================
// AÇÕES DE CHECK-IN
// ========================================

// Validar ingresso por QR code
router.post(
  '/validate',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res, next) => checkinWebController.validateTicket(req, res, next)
);

// Check-in manual de um ingresso
router.post(
  '/tickets/:ticketInstanceId/checkin',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res, next) => checkinWebController.manualCheckin(req, res, next)
);

// Desfazer check-in
router.post(
  '/tickets/:ticketInstanceId/undo',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res, next) => checkinWebController.undoCheckin(req, res, next)
);

export default router;
