import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const companyController = new CompanyController();

// All routes require authentication
router.use(authenticate);

// ========================================
// COMPANY SETTINGS ROUTES
// ========================================

// GET /api/company/settings - Get company settings
router.get(
  '/settings',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => companyController.getSettings(req, res)
);

// PUT /api/company/settings - Update company settings
router.put(
  '/settings',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => companyController.updateSettings(req, res)
);

// POST /api/company/settings - Create/update company settings (alias)
router.post(
  '/settings',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => companyController.updateSettings(req, res)
);

// ========================================
// TEAM MANAGEMENT ROUTES
// ========================================

// GET /api/company/team - Get team members
router.get(
  '/team',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => companyController.getTeamMembers(req, res)
);

// POST /api/company/team/invite - Invite team member
router.post(
  '/team/invite',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => companyController.inviteTeamMember(req, res)
);

// PUT /api/company/team/:memberId - Update team member
router.put(
  '/team/:memberId',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => companyController.updateTeamMember(req, res)
);

// DELETE /api/company/team/:memberId - Remove team member
router.delete(
  '/team/:memberId',
  authorize('ORGANIZER', 'ADMIN'),
  (req, res) => companyController.removeTeamMember(req, res)
);

// POST /api/company/team/accept - Accept team invite (any authenticated user)
router.post(
  '/team/accept',
  (req, res) => companyController.acceptInvite(req, res)
);

export default router;
