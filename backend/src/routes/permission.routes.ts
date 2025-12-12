import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const permissionController = new PermissionController();

// All permission routes require authentication
router.use(authenticate);

// ==========================================
// USER'S OWN PERMISSIONS (any authenticated user)
// ==========================================

// Get my permissions
router.get('/me', (req, res) => permissionController.getMyPermissions(req, res));

// Check if I have a specific permission
router.get('/check/:permissionCode', (req, res) => permissionController.checkPermission(req, res));

// Check multiple permissions at once
router.post('/check', (req, res) => permissionController.checkPermissions(req, res));

// ==========================================
// ADMIN ONLY ROUTES
// ==========================================

router.use(authorize('ADMIN'));

// ==========================================
// PERMISSIONS CRUD
// ==========================================

// List all permissions
router.get('/', (req, res) => permissionController.getAllPermissions(req, res));

// Get permissions grouped by module
router.get('/grouped', (req, res) => permissionController.getPermissionsByModule(req, res));

// Get permission by ID
router.get('/permission/:id', (req, res) => permissionController.getPermissionById(req, res));

// Create new permission
router.post('/', (req, res) => permissionController.createPermission(req, res));

// Update permission
router.put('/permission/:id', (req, res) => permissionController.updatePermission(req, res));

// Delete permission
router.delete('/permission/:id', (req, res) => permissionController.deletePermission(req, res));

// ==========================================
// USER PERMISSIONS MANAGEMENT
// ==========================================

// List users with their permissions
router.get('/users', (req, res) => permissionController.getUsersWithPermissions(req, res));

// Get specific user's permissions
router.get('/users/:userId', (req, res) => permissionController.getUserPermissions(req, res));

// Set user's permissions (replace all)
router.put('/users/:userId', (req, res) => permissionController.setUserPermissions(req, res));

// Grant a single permission to user
router.post('/users/:userId/grant', (req, res) => permissionController.grantPermission(req, res));

// Revoke a single permission from user
router.post('/users/:userId/revoke', (req, res) => permissionController.revokePermission(req, res));

// ==========================================
// MIGRATION (run once to create tables)
// ==========================================

router.post('/migrate', (req, res) => permissionController.runMigration(req, res));

export default router;
