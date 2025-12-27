import { query, transaction } from '../config/database.js';
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

export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  permissions: Permission[];
}

// Default permissions to seed
const DEFAULT_PERMISSIONS = [
  // Dashboard
  { code: 'dashboard.view', name: 'Ver Dashboard', module: 'dashboard', description: 'Acesso ao dashboard' },
  { code: 'dashboard.analytics', name: 'Ver Analytics', module: 'dashboard', description: 'Acesso a analytics avancados' },

  // Events
  { code: 'events.view', name: 'Ver Eventos', module: 'events', description: 'Listar e visualizar eventos' },
  { code: 'events.create', name: 'Criar Eventos', module: 'events', description: 'Criar novos eventos' },
  { code: 'events.edit', name: 'Editar Eventos', module: 'events', description: 'Editar eventos existentes' },
  { code: 'events.delete', name: 'Excluir Eventos', module: 'events', description: 'Excluir eventos' },
  { code: 'events.publish', name: 'Publicar Eventos', module: 'events', description: 'Publicar/despublicar eventos' },

  // Venues
  { code: 'venues.view', name: 'Ver Locais', module: 'venues', description: 'Listar e visualizar locais' },
  { code: 'venues.create', name: 'Criar Locais', module: 'venues', description: 'Criar novos locais' },
  { code: 'venues.edit', name: 'Editar Locais', module: 'venues', description: 'Editar locais existentes' },
  { code: 'venues.delete', name: 'Excluir Locais', module: 'venues', description: 'Excluir locais' },

  // Tickets
  { code: 'tickets.view', name: 'Ver Ingressos', module: 'tickets', description: 'Visualizar ingressos' },
  { code: 'tickets.create', name: 'Criar Ingressos', module: 'tickets', description: 'Criar tipos de ingressos' },
  { code: 'tickets.edit', name: 'Editar Ingressos', module: 'tickets', description: 'Editar ingressos' },
  { code: 'tickets.delete', name: 'Excluir Ingressos', module: 'tickets', description: 'Excluir ingressos' },

  // Orders
  { code: 'orders.view', name: 'Ver Pedidos', module: 'orders', description: 'Listar e visualizar pedidos' },
  { code: 'orders.refund', name: 'Reembolsar Pedidos', module: 'orders', description: 'Processar reembolsos' },
  { code: 'orders.cancel', name: 'Cancelar Pedidos', module: 'orders', description: 'Cancelar pedidos' },
  { code: 'orders.export', name: 'Exportar Pedidos', module: 'orders', description: 'Exportar dados de pedidos' },

  // Check-in
  { code: 'checkin.view', name: 'Ver Check-in', module: 'checkin', description: 'Acessar area de check-in' },
  { code: 'checkin.perform', name: 'Realizar Check-in', module: 'checkin', description: 'Fazer check-in de participantes' },
  { code: 'checkin.undo', name: 'Desfazer Check-in', module: 'checkin', description: 'Reverter check-in' },

  // Finance
  { code: 'finance.view', name: 'Ver Financeiro', module: 'finance', description: 'Acessar dashboard financeiro' },
  { code: 'finance.transactions', name: 'Ver Transacoes', module: 'finance', description: 'Ver historico de transacoes' },
  { code: 'finance.reports', name: 'Ver Relatorios', module: 'finance', description: 'Acessar relatorios financeiros' },
  { code: 'finance.export', name: 'Exportar Financeiro', module: 'finance', description: 'Exportar dados financeiros' },

  // Payouts
  { code: 'payouts.view', name: 'Ver Repasses', module: 'payouts', description: 'Visualizar repasses' },
  { code: 'payouts.request', name: 'Solicitar Repasse', module: 'payouts', description: 'Solicitar novos repasses' },
  { code: 'payouts.approve', name: 'Aprovar Repasses', module: 'payouts', description: 'Aprovar repasses pendentes' },
  { code: 'payouts.reject', name: 'Rejeitar Repasses', module: 'payouts', description: 'Rejeitar repasses' },

  // Users
  { code: 'users.view', name: 'Ver Usuarios', module: 'users', description: 'Listar usuarios' },
  { code: 'users.manage', name: 'Gerenciar Usuarios', module: 'users', description: 'Alterar roles de usuarios' },

  // Permissions
  { code: 'permissions.view', name: 'Ver Permissoes', module: 'permissions', description: 'Visualizar permissoes' },
  { code: 'permissions.manage', name: 'Gerenciar Permissoes', module: 'permissions', description: 'Alterar permissoes de usuarios' },

  // Settings
  { code: 'settings.view', name: 'Ver Configuracoes', module: 'settings', description: 'Acessar configuracoes' },
  { code: 'settings.company', name: 'Configurar Empresa', module: 'settings', description: 'Editar dados da empresa' },
  { code: 'settings.bank', name: 'Configurar Banco', module: 'settings', description: 'Editar dados bancarios' },
  { code: 'settings.team', name: 'Gerenciar Equipe', module: 'settings', description: 'Gerenciar membros da equipe' },
];

export class PermissionsService {
  // Run migration to create tables and seed data
  async runMigration(): Promise<{ message: string }> {
    await transaction(async (client) => {
      // Create permissions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          module VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create user_permissions junction table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          granted_by UUID REFERENCES users(id),
          granted_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, permission_id)
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
        CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
        CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
      `);

      // Seed default permissions (upsert)
      for (const perm of DEFAULT_PERMISSIONS) {
        await client.query(`
          INSERT INTO permissions (code, name, description, module)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            module = EXCLUDED.module,
            updated_at = NOW()
        `, [perm.code, perm.name, perm.description, perm.module]);
      }
    });

    return { message: 'Migracao executada com sucesso!' };
  }

  // Get all permissions
  async getAllPermissions(module?: string): Promise<Permission[]> {
    let sql = 'SELECT * FROM permissions';
    const params: any[] = [];

    if (module) {
      sql += ' WHERE module = $1';
      params.push(module);
    }

    sql += ' ORDER BY module, code';

    const result = await query(sql, params);
    return result.rows.map(this.mapPermission);
  }

  // Get permissions grouped by module
  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getAllPermissions();
    const grouped: Record<string, Permission[]> = {};

    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return grouped;
  }

  // Get user's permissions
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const result = await query(`
      SELECT p.* FROM permissions p
      JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = $1
      ORDER BY p.module, p.code
    `, [userId]);

    return result.rows.map(this.mapPermission);
  }

  // Get my permissions (returns permissions and codes)
  async getMyPermissions(userId: string): Promise<{ permissions: Permission[]; codes: string[] }> {
    const permissions = await this.getUserPermissions(userId);
    const codes = permissions.map(p => p.code);
    return { permissions, codes };
  }

  // Check if user has a specific permission
  async checkPermission(userId: string, code: string): Promise<boolean> {
    const result = await query(`
      SELECT 1 FROM permissions p
      JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = $1 AND p.code = $2
      LIMIT 1
    `, [userId, code]);

    return result.rows.length > 0;
  }

  // Check multiple permissions
  async checkPermissions(userId: string, codes: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};

    for (const code of codes) {
      result[code] = await this.checkPermission(userId, code);
    }

    return result;
  }

  // Get users with their permissions (paginated)
  async getUsersWithPermissions(filters: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
  }): Promise<{
    users: UserWithPermissions[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page, limit, search, role } = filters;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereClauses.push(`u.role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get users
    const usersResult = await query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    // Get permissions for each user
    const users: UserWithPermissions[] = [];
    for (const user of usersResult.rows) {
      const permissions = await this.getUserPermissions(user.id);
      users.push({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        permissions,
      });
    }

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get specific user with permissions
  async getUserWithPermissions(userId: string): Promise<UserWithPermissions> {
    const userResult = await query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError(404, 'Usuario nao encontrado');
    }

    const user = userResult.rows[0];
    const permissions = await this.getUserPermissions(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      permissions,
    };
  }

  // Set user's permissions (replace all)
  async setUserPermissions(
    userId: string,
    permissionIds: string[],
    grantedBy: string
  ): Promise<{ message: string; user: UserWithPermissions }> {
    await transaction(async (client) => {
      // Remove all existing permissions
      await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);

      // Add new permissions
      for (const permissionId of permissionIds) {
        await client.query(`
          INSERT INTO user_permissions (user_id, permission_id, granted_by)
          VALUES ($1, $2, $3)
        `, [userId, permissionId, grantedBy]);
      }
    });

    const user = await this.getUserWithPermissions(userId);
    return { message: 'Permissoes atualizadas com sucesso!', user };
  }

  // Grant a single permission
  async grantPermission(
    userId: string,
    permissionIdOrCode: string,
    grantedBy: string,
    isCode: boolean = false
  ): Promise<{ message: string }> {
    let permissionId = permissionIdOrCode;

    if (isCode) {
      const permResult = await query(
        'SELECT id FROM permissions WHERE code = $1',
        [permissionIdOrCode]
      );
      if (permResult.rows.length === 0) {
        throw new AppError(404, 'Permissao nao encontrada');
      }
      permissionId = permResult.rows[0].id;
    }

    await query(`
      INSERT INTO user_permissions (user_id, permission_id, granted_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, permission_id) DO NOTHING
    `, [userId, permissionId, grantedBy]);

    return { message: 'Permissao concedida com sucesso!' };
  }

  // Revoke a single permission
  async revokePermission(
    userId: string,
    permissionIdOrCode: string,
    isCode: boolean = false
  ): Promise<{ message: string }> {
    let permissionId = permissionIdOrCode;

    if (isCode) {
      const permResult = await query(
        'SELECT id FROM permissions WHERE code = $1',
        [permissionIdOrCode]
      );
      if (permResult.rows.length === 0) {
        throw new AppError(404, 'Permissao nao encontrada');
      }
      permissionId = permResult.rows[0].id;
    }

    await query(
      'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
      [userId, permissionId]
    );

    return { message: 'Permissao revogada com sucesso!' };
  }

  // Create a new permission
  async createPermission(data: {
    code: string;
    name: string;
    description?: string;
    module: string;
  }): Promise<Permission> {
    const result = await query(`
      INSERT INTO permissions (code, name, description, module)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.code, data.name, data.description || null, data.module]);

    return this.mapPermission(result.rows[0]);
  }

  // Update a permission
  async updatePermission(
    id: string,
    data: { name?: string; description?: string; module?: string }
  ): Promise<Permission> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.module) {
      updates.push(`module = $${paramIndex++}`);
      params.push(data.module);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'Nenhum campo para atualizar');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await query(`
      UPDATE permissions SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      throw new AppError(404, 'Permissao nao encontrada');
    }

    return this.mapPermission(result.rows[0]);
  }

  // Delete a permission
  async deletePermission(id: string): Promise<{ message: string }> {
    const result = await query('DELETE FROM permissions WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new AppError(404, 'Permissao nao encontrada');
    }

    return { message: 'Permissao excluida com sucesso!' };
  }

  // Map database row to Permission object
  private mapPermission(row: any): Permission {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      module: row.module,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
