import { Request, Response, NextFunction } from 'express';
import { PermissionsService } from '../services/permissions.service.js';

const permissionsService = new PermissionsService();

export class PermissionsController {
  // Run migration
  async runMigration(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await permissionsService.runMigration();
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  // Get my permissions
  async getMyPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await permissionsService.getMyPermissions(userId);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  // Check single permission
  async checkPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { code } = req.params;
      const hasPermission = await permissionsService.checkPermission(userId, code);
      return res.status(200).json({ hasPermission });
    } catch (error) {
      return next(error);
    }
  }

  // Check multiple permissions
  async checkPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { codes } = req.body;

      if (!codes || !Array.isArray(codes)) {
        return res.status(400).json({ error: 'codes deve ser um array' });
      }

      const result = await permissionsService.checkPermissions(userId, codes);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  // Get all permissions
  async getAllPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { module } = req.query;
      const permissions = await permissionsService.getAllPermissions(module as string);
      return res.status(200).json(permissions);
    } catch (error) {
      return next(error);
    }
  }

  // Get permissions grouped by module
  async getPermissionsByModule(_req: Request, res: Response, next: NextFunction) {
    try {
      const grouped = await permissionsService.getPermissionsByModule();
      return res.status(200).json(grouped);
    } catch (error) {
      return next(error);
    }
  }

  // Get users with permissions
  async getUsersWithPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20', search, role } = req.query;

      const result = await permissionsService.getUsersWithPermissions({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        role: role as string,
      });

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  // Get specific user with permissions
  async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await permissionsService.getUserWithPermissions(userId);
      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  }

  // Set user permissions (replace all)
  async setUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { permissionIds } = req.body;
      const grantedBy = req.user!.id;

      if (!permissionIds || !Array.isArray(permissionIds)) {
        return res.status(400).json({ error: 'permissionIds deve ser um array' });
      }

      const result = await permissionsService.setUserPermissions(userId, permissionIds, grantedBy);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  // Grant a single permission
  async grantPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { permissionId, permissionCode } = req.body;
      const grantedBy = req.user!.id;

      if (!permissionId && !permissionCode) {
        return res.status(400).json({ error: 'permissionId ou permissionCode e obrigatorio' });
      }

      const result = await permissionsService.grantPermission(
        userId,
        permissionCode || permissionId,
        grantedBy,
        !!permissionCode
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  // Revoke a single permission
  async revokePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { permissionId, permissionCode } = req.body;

      if (!permissionId && !permissionCode) {
        return res.status(400).json({ error: 'permissionId ou permissionCode e obrigatorio' });
      }

      const result = await permissionsService.revokePermission(
        userId,
        permissionCode || permissionId,
        !!permissionCode
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  // Create permission
  async createPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, module } = req.body;

      if (!code || !name || !module) {
        return res.status(400).json({ error: 'code, name e module sao obrigatorios' });
      }

      const permission = await permissionsService.createPermission({
        code,
        name,
        description,
        module,
      });
      return res.status(201).json(permission);
    } catch (error) {
      return next(error);
    }
  }

  // Update permission
  async updatePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, module } = req.body;

      const permission = await permissionsService.updatePermission(id, {
        name,
        description,
        module,
      });
      return res.status(200).json(permission);
    } catch (error) {
      return next(error);
    }
  }

  // Delete permission
  async deletePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await permissionsService.deletePermission(id);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}
