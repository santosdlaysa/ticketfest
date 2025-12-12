import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  grantedBy: string | null;
  grantedAt: Date;
  permission?: Permission;
}

export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Permission[];
}

interface PermissionsFilters {
  module?: string;
}

interface UsersFilters {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

export class PermissionService {
  // ==========================================
  // PERMISSION CRUD
  // ==========================================

  async getAllPermissions(filters?: PermissionsFilters): Promise<Permission[]> {
    const permissions = await prisma.$queryRaw<Permission[]>`
      SELECT id, code, name, description, module, created_at as "createdAt", updated_at as "updatedAt"
      FROM permissions
      ${filters?.module ? prisma.$queryRaw`WHERE module = ${filters.module}` : prisma.$queryRaw``}
      ORDER BY module, code
    `;

    return permissions;
  }

  async getPermissionById(id: string): Promise<Permission | null> {
    const permissions = await prisma.$queryRaw<Permission[]>`
      SELECT id, code, name, description, module, created_at as "createdAt", updated_at as "updatedAt"
      FROM permissions
      WHERE id = ${id}::uuid
    `;

    return permissions[0] || null;
  }

  async getPermissionByCode(code: string): Promise<Permission | null> {
    const permissions = await prisma.$queryRaw<Permission[]>`
      SELECT id, code, name, description, module, created_at as "createdAt", updated_at as "updatedAt"
      FROM permissions
      WHERE code = ${code}
    `;

    return permissions[0] || null;
  }

  async createPermission(data: {
    code: string;
    name: string;
    description?: string;
    module: string;
  }): Promise<Permission> {
    const existing = await this.getPermissionByCode(data.code);
    if (existing) {
      throw new AppError(409, 'Permission code already exists');
    }

    const result = await prisma.$queryRaw<Permission[]>`
      INSERT INTO permissions (code, name, description, module)
      VALUES (${data.code}, ${data.name}, ${data.description || null}, ${data.module})
      RETURNING id, code, name, description, module, created_at as "createdAt", updated_at as "updatedAt"
    `;

    return result[0];
  }

  async updatePermission(
    id: string,
    data: { name?: string; description?: string; module?: string }
  ): Promise<Permission> {
    const permission = await this.getPermissionById(id);
    if (!permission) {
      throw new AppError(404, 'Permission not found');
    }

    const result = await prisma.$queryRaw<Permission[]>`
      UPDATE permissions
      SET
        name = COALESCE(${data.name || null}, name),
        description = COALESCE(${data.description || null}, description),
        module = COALESCE(${data.module || null}, module),
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id, code, name, description, module, created_at as "createdAt", updated_at as "updatedAt"
    `;

    return result[0];
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await this.getPermissionById(id);
    if (!permission) {
      throw new AppError(404, 'Permission not found');
    }

    await prisma.$executeRaw`DELETE FROM permissions WHERE id = ${id}::uuid`;
  }

  // ==========================================
  // USER PERMISSIONS
  // ==========================================

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const permissions = await prisma.$queryRaw<Permission[]>`
      SELECT p.id, p.code, p.name, p.description, p.module, p.created_at as "createdAt", p.updated_at as "updatedAt"
      FROM permissions p
      INNER JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = ${userId}::uuid
      ORDER BY p.module, p.code
    `;

    return permissions;
  }

  async getUserPermissionCodes(userId: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.map((p) => p.code);
  }

  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM user_permissions up
      INNER JOIN permissions p ON p.id = up.permission_id
      WHERE up.user_id = ${userId}::uuid AND p.code = ${permissionCode}
    `;

    return Number(result[0]?.count || 0) > 0;
  }

  async hasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
    if (permissionCodes.length === 0) return false;

    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM user_permissions up
      INNER JOIN permissions p ON p.id = up.permission_id
      WHERE up.user_id = ${userId}::uuid AND p.code = ANY(${permissionCodes})
    `;

    return Number(result[0]?.count || 0) > 0;
  }

  async grantPermission(userId: string, permissionId: string, grantedBy?: string): Promise<void> {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check if permission exists
    const permission = await this.getPermissionById(permissionId);
    if (!permission) {
      throw new AppError(404, 'Permission not found');
    }

    // Grant permission (ignore if already exists)
    await prisma.$executeRaw`
      INSERT INTO user_permissions (user_id, permission_id, granted_by)
      VALUES (${userId}::uuid, ${permissionId}::uuid, ${grantedBy || null}::uuid)
      ON CONFLICT (user_id, permission_id) DO NOTHING
    `;
  }

  async grantPermissionByCode(
    userId: string,
    permissionCode: string,
    grantedBy?: string
  ): Promise<void> {
    const permission = await this.getPermissionByCode(permissionCode);
    if (!permission) {
      throw new AppError(404, `Permission '${permissionCode}' not found`);
    }

    await this.grantPermission(userId, permission.id, grantedBy);
  }

  async revokePermission(userId: string, permissionId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM user_permissions
      WHERE user_id = ${userId}::uuid AND permission_id = ${permissionId}::uuid
    `;
  }

  async revokePermissionByCode(userId: string, permissionCode: string): Promise<void> {
    const permission = await this.getPermissionByCode(permissionCode);
    if (!permission) {
      throw new AppError(404, `Permission '${permissionCode}' not found`);
    }

    await this.revokePermission(userId, permission.id);
  }

  async setUserPermissions(
    userId: string,
    permissionIds: string[],
    grantedBy?: string
  ): Promise<void> {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Remove all existing permissions
    await prisma.$executeRaw`DELETE FROM user_permissions WHERE user_id = ${userId}::uuid`;

    // Grant new permissions
    for (const permissionId of permissionIds) {
      await this.grantPermission(userId, permissionId, grantedBy);
    }
  }

  // ==========================================
  // USER LISTING WITH PERMISSIONS
  // ==========================================

  async getUsersWithPermissions(filters: UsersFilters) {
    const { page, limit, search, role } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = 'WHERE 1=1';
    if (role) {
      whereClause += ` AND u.role = '${role}'`;
    }
    if (search) {
      whereClause += ` AND (u.name ILIKE '%${search}%' OR u.email ILIKE '%${search}%')`;
    }

    // Get users
    const users = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        email: string;
        name: string;
        role: string;
        createdAt: Date;
      }>
    >(
      `
      SELECT u.id, u.email, u.name, u.role, u.created_at as "createdAt"
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    );

    // Get total count
    const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM users u ${whereClause}`
    );
    const total = Number(countResult[0]?.count || 0);

    // Get permissions for each user
    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const permissions = await this.getUserPermissions(user.id);
        return {
          ...user,
          permissions,
        };
      })
    );

    return {
      users: usersWithPermissions,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  }

  async getUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    const permissions = await this.getUserPermissions(userId);

    return {
      ...user,
      permissions,
    };
  }

  // ==========================================
  // PERMISSION GROUPS (by module)
  // ==========================================

  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getAllPermissions();

    const grouped: Record<string, Permission[]> = {};
    for (const permission of permissions) {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    }

    return grouped;
  }

  // ==========================================
  // MIGRATION HELPER
  // ==========================================

  async runMigration(): Promise<void> {
    // Create permissions table if not exists
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        module VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module)
    `;

    // Create user_permissions table if not exists
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        granted_by UUID REFERENCES users(id),
        granted_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, permission_id)
      )
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id)
    `;

    // Insert default permissions
    const defaultPermissions = [
      // Dashboard
      { code: 'dashboard:view', name: 'Ver Dashboard', description: 'Acesso ao painel principal', module: 'dashboard' },

      // Events
      { code: 'events:view', name: 'Ver Eventos', description: 'Visualizar lista de eventos', module: 'events' },
      { code: 'events:create', name: 'Criar Eventos', description: 'Criar novos eventos', module: 'events' },
      { code: 'events:edit', name: 'Editar Eventos', description: 'Editar eventos existentes', module: 'events' },
      { code: 'events:delete', name: 'Excluir Eventos', description: 'Excluir eventos', module: 'events' },
      { code: 'events:publish', name: 'Publicar Eventos', description: 'Publicar e despublicar eventos', module: 'events' },

      // Venues
      { code: 'venues:view', name: 'Ver Locais', description: 'Visualizar lista de locais', module: 'venues' },
      { code: 'venues:create', name: 'Criar Locais', description: 'Criar novos locais', module: 'venues' },
      { code: 'venues:edit', name: 'Editar Locais', description: 'Editar locais existentes', module: 'venues' },
      { code: 'venues:delete', name: 'Excluir Locais', description: 'Excluir locais', module: 'venues' },

      // Tickets
      { code: 'tickets:view', name: 'Ver Ingressos', description: 'Visualizar ingressos', module: 'tickets' },
      { code: 'tickets:create', name: 'Criar Ingressos', description: 'Criar tipos de ingressos', module: 'tickets' },
      { code: 'tickets:edit', name: 'Editar Ingressos', description: 'Editar ingressos existentes', module: 'tickets' },
      { code: 'tickets:delete', name: 'Excluir Ingressos', description: 'Excluir ingressos', module: 'tickets' },

      // Orders
      { code: 'orders:view', name: 'Ver Pedidos', description: 'Visualizar lista de pedidos', module: 'orders' },
      { code: 'orders:manage', name: 'Gerenciar Pedidos', description: 'Confirmar, cancelar pedidos', module: 'orders' },
      { code: 'orders:refund', name: 'Reembolsar Pedidos', description: 'Processar reembolsos', module: 'orders' },
      { code: 'orders:export', name: 'Exportar Pedidos', description: 'Exportar relatórios de pedidos', module: 'orders' },

      // Check-in
      { code: 'checkin:view', name: 'Ver Check-in', description: 'Visualizar status de check-in', module: 'checkin' },
      { code: 'checkin:perform', name: 'Realizar Check-in', description: 'Fazer check-in de participantes', module: 'checkin' },
      { code: 'checkin:export', name: 'Exportar Participantes', description: 'Exportar lista de participantes', module: 'checkin' },

      // Finance
      { code: 'finance:view', name: 'Ver Financeiro', description: 'Visualizar dados financeiros', module: 'finance' },
      { code: 'finance:payouts', name: 'Gerenciar Saques', description: 'Solicitar e gerenciar saques', module: 'finance' },
      { code: 'finance:reports', name: 'Relatórios Financeiros', description: 'Acessar relatórios detalhados', module: 'finance' },

      // Users
      { code: 'users:view', name: 'Ver Usuários', description: 'Visualizar lista de usuários', module: 'users' },
      { code: 'users:create', name: 'Criar Usuários', description: 'Criar novos usuários', module: 'users' },
      { code: 'users:edit', name: 'Editar Usuários', description: 'Editar usuários existentes', module: 'users' },
      { code: 'users:delete', name: 'Excluir Usuários', description: 'Excluir usuários', module: 'users' },

      // Permissions
      { code: 'permissions:view', name: 'Ver Permissões', description: 'Visualizar permissões', module: 'permissions' },
      { code: 'permissions:manage', name: 'Gerenciar Permissões', description: 'Atribuir e revogar permissões', module: 'permissions' },

      // Settings
      { code: 'settings:view', name: 'Ver Configurações', description: 'Visualizar configurações', module: 'settings' },
      { code: 'settings:edit', name: 'Editar Configurações', description: 'Editar configurações do sistema', module: 'settings' },
    ];

    for (const perm of defaultPermissions) {
      await prisma.$executeRaw`
        INSERT INTO permissions (code, name, description, module)
        VALUES (${perm.code}, ${perm.name}, ${perm.description}, ${perm.module})
        ON CONFLICT (code) DO NOTHING
      `;
    }
  }
}
