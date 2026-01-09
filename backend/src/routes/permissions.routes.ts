import { Router } from 'express';
import { PermissionsController } from '../controllers/permissions.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const permissionsController = new PermissionsController();

// All routes require authentication
router.use(authenticate);

// User routes - get own permissions
router.get('/me', (req, res, next) => permissionsController.getMyPermissions(req, res, next));
router.get('/check/:code', (req, res, next) => permissionsController.checkPermission(req, res, next));
router.post('/check', (req, res, next) => permissionsController.checkPermissions(req, res, next));

// Admin routes - require ADMIN role
router.use(authorize('ADMIN'));

// Get all permissions
router.get('/', (req, res, next) => permissionsController.getAllPermissions(req, res, next));
router.get('/grouped', (req, res, next) => permissionsController.getPermissionsByModule(req, res, next));

// User permissions management
router.get('/users', (req, res, next) => permissionsController.getUsersWithPermissions(req, res, next));
router.get('/users/:userId', (req, res, next) => permissionsController.getUserPermissions(req, res, next));
router.put('/users/:userId', (req, res, next) => permissionsController.setUserPermissions(req, res, next));
router.post('/users/:userId/grant', (req, res, next) => permissionsController.grantPermission(req, res, next));
router.post('/users/:userId/revoke', (req, res, next) => permissionsController.revokePermission(req, res, next));

// Permission CRUD
router.post('/', (req, res, next) => permissionsController.createPermission(req, res, next));
router.put('/permission/:id', (req, res, next) => permissionsController.updatePermission(req, res, next));
router.delete('/permission/:id', (req, res, next) => permissionsController.deletePermission(req, res, next));

// Migration
router.post('/migrate', (req, res, next) => permissionsController.runMigration(req, res, next));

export default router;
