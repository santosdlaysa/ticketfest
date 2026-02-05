import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// ========================================
// COMPANY SETTINGS
// ========================================

// Buscar configurações da empresa
router.get('/settings', (req, res, next) => companyController.getSettings(req, res, next));

// Atualizar configurações da empresa
router.put('/settings', (req, res, next) => companyController.updateSettings(req, res, next));

// ========================================
// TEAM MANAGEMENT
// ========================================

// Listar membros da equipe
router.get('/team', (req, res, next) => companyController.getTeam(req, res, next));

// Convidar membro
router.post('/team/invite', (req, res, next) => companyController.inviteMember(req, res, next));

// Aceitar convite
router.post('/team/accept', (req, res, next) => companyController.acceptInvite(req, res, next));

// Atualizar membro
router.put('/team/:memberId', (req, res, next) => companyController.updateMember(req, res, next));

// Remover membro
router.delete('/team/:memberId', (req, res, next) => companyController.removeMember(req, res, next));

export default router;
