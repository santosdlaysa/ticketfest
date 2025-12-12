import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.service.js';
import { AppError } from '../middlewares/errorHandler.js';

const permissionService = new PermissionService();

export class PermissionController {
  // ==========================================
  // PERMISSIONS CRUD
  // ==========================================

  async getAllPermissions(req: Request, res: Response) {
    const { module } = req.query;

    const permissions = await permissionService.getAllPermissions({
      module: module as string,
    });

    res.status(200).json(permissions);
  }

  async getPermissionsByModule(req: Request, res: Response) {
    const grouped = await permissionService.getPermissionsByModule();
    res.status(200).json(grouped);
  }

  async getPermissionById(req: Request, res: Response) {
    const { id } = req.params;

    const permission = await permissionService.getPermissionById(id);
    if (!permission) {
      throw new AppError(404, 'Permission not found');
    }

    res.status(200).json(permission);
  }

  async createPermission(req: Request, res: Response) {
    const { code, name, description, module } = req.body;

    if (!code || !name || !module) {
      throw new AppError(400, 'Code, name, and module are required');
    }

    const permission = await permissionService.createPermission({
      code,
      name,
      description,
      module,
    });

    res.status(201).json(permission);
  }

  async updatePermission(req: Request, res: Response) {
    const { id } = req.params;
    const { name, description, module } = req.body;

    const permission = await permissionService.updatePermission(id, {
      name,
      description,
      module,
    });

    res.status(200).json(permission);
  }

  async deletePermission(req: Request, res: Response) {
    const { id } = req.params;

    await permissionService.deletePermission(id);

    res.status(200).json({ message: 'Permission deleted successfully' });
  }

  // ==========================================
  // USER PERMISSIONS
  // ==========================================

  async getUsersWithPermissions(req: Request, res: Response) {
    const { page = '1', limit = '20', search, role } = req.query;

    const result = await permissionService.getUsersWithPermissions({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      role: role as string,
    });

    res.status(200).json(result);
  }

  async getUserPermissions(req: Request, res: Response) {
    const { userId } = req.params;

    const user = await permissionService.getUserWithPermissions(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.status(200).json(user);
  }

  async getMyPermissions(req: Request, res: Response) {
    const userId = req.user!.id;

    const permissions = await permissionService.getUserPermissions(userId);

    res.status(200).json({
      permissions,
      codes: permissions.map((p) => p.code),
    });
  }

  async setUserPermissions(req: Request, res: Response) {
    const { userId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      throw new AppError(400, 'permissionIds must be an array');
    }

    await permissionService.setUserPermissions(userId, permissionIds, req.user!.id);

    const updatedUser = await permissionService.getUserWithPermissions(userId);

    res.status(200).json({
      message: 'Permissions updated successfully',
      user: updatedUser,
    });
  }

  async grantPermission(req: Request, res: Response) {
    const { userId } = req.params;
    const { permissionId, permissionCode } = req.body;

    if (!permissionId && !permissionCode) {
      throw new AppError(400, 'permissionId or permissionCode is required');
    }

    if (permissionId) {
      await permissionService.grantPermission(userId, permissionId, req.user!.id);
    } else {
      await permissionService.grantPermissionByCode(userId, permissionCode, req.user!.id);
    }

    res.status(200).json({ message: 'Permission granted successfully' });
  }

  async revokePermission(req: Request, res: Response) {
    const { userId } = req.params;
    const { permissionId, permissionCode } = req.body;

    if (!permissionId && !permissionCode) {
      throw new AppError(400, 'permissionId or permissionCode is required');
    }

    if (permissionId) {
      await permissionService.revokePermission(userId, permissionId);
    } else {
      await permissionService.revokePermissionByCode(userId, permissionCode);
    }

    res.status(200).json({ message: 'Permission revoked successfully' });
  }

  // ==========================================
  // CHECK PERMISSION
  // ==========================================

  async checkPermission(req: Request, res: Response) {
    const { permissionCode } = req.params;
    const userId = req.user!.id;

    const hasPermission = await permissionService.hasPermission(userId, permissionCode);

    res.status(200).json({ hasPermission });
  }

  async checkPermissions(req: Request, res: Response) {
    const { codes } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(codes)) {
      throw new AppError(400, 'codes must be an array');
    }

    const results: Record<string, boolean> = {};
    for (const code of codes) {
      results[code] = await permissionService.hasPermission(userId, code);
    }

    res.status(200).json(results);
  }

  // ==========================================
  // MIGRATION
  // ==========================================

  async runMigration(req: Request, res: Response) {
    await permissionService.runMigration();
    res.status(200).json({ message: 'Migration completed successfully' });
  }
}
