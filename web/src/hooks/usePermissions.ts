import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/contexts/AuthContext';
import { permissionsApi, Permission } from '@/services/api';

// Códigos de permissão por módulo
export const PERMISSION_CODES = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ANALYTICS: 'dashboard.analytics',

  // Eventos
  EVENTS_VIEW: 'events.view',
  EVENTS_CREATE: 'events.create',
  EVENTS_EDIT: 'events.edit',
  EVENTS_DELETE: 'events.delete',
  EVENTS_PUBLISH: 'events.publish',

  // Locais/Venues
  VENUES_VIEW: 'venues.view',
  VENUES_CREATE: 'venues.create',
  VENUES_EDIT: 'venues.edit',
  VENUES_DELETE: 'venues.delete',

  // Tickets
  TICKETS_VIEW: 'tickets.view',
  TICKETS_CREATE: 'tickets.create',
  TICKETS_EDIT: 'tickets.edit',
  TICKETS_DELETE: 'tickets.delete',

  // Pedidos/Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_REFUND: 'orders.refund',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_EXPORT: 'orders.export',

  // Check-in
  CHECKIN_VIEW: 'checkin.view',
  CHECKIN_PERFORM: 'checkin.perform',
  CHECKIN_UNDO: 'checkin.undo',

  // Financeiro
  FINANCE_VIEW: 'finance.view',
  FINANCE_TRANSACTIONS: 'finance.transactions',
  FINANCE_REPORTS: 'finance.reports',
  FINANCE_EXPORT: 'finance.export',

  // Payouts/Repasses
  PAYOUTS_VIEW: 'payouts.view',
  PAYOUTS_REQUEST: 'payouts.request',
  PAYOUTS_APPROVE: 'payouts.approve',
  PAYOUTS_REJECT: 'payouts.reject',

  // Usuários/Permissões
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  PERMISSIONS_VIEW: 'permissions.view',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // Configurações
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_COMPANY: 'settings.company',
  SETTINGS_BANK: 'settings.bank',
  SETTINGS_TEAM: 'settings.team',
} as const;

export type PermissionCode = typeof PERMISSION_CODES[keyof typeof PERMISSION_CODES];

// Permissões por role (fallback se não houver permissões específicas)
const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  ADMIN: Object.values(PERMISSION_CODES), // Admin tem todas as permissões
  ORGANIZER: [
    PERMISSION_CODES.DASHBOARD_VIEW,
    PERMISSION_CODES.DASHBOARD_ANALYTICS,
    PERMISSION_CODES.EVENTS_VIEW,
    PERMISSION_CODES.EVENTS_CREATE,
    PERMISSION_CODES.EVENTS_EDIT,
    PERMISSION_CODES.EVENTS_DELETE,
    PERMISSION_CODES.EVENTS_PUBLISH,
    PERMISSION_CODES.VENUES_VIEW,
    PERMISSION_CODES.VENUES_CREATE,
    PERMISSION_CODES.VENUES_EDIT,
    PERMISSION_CODES.TICKETS_VIEW,
    PERMISSION_CODES.TICKETS_CREATE,
    PERMISSION_CODES.TICKETS_EDIT,
    PERMISSION_CODES.TICKETS_DELETE,
    PERMISSION_CODES.ORDERS_VIEW,
    PERMISSION_CODES.ORDERS_EXPORT,
    PERMISSION_CODES.CHECKIN_VIEW,
    PERMISSION_CODES.CHECKIN_PERFORM,
    PERMISSION_CODES.FINANCE_VIEW,
    PERMISSION_CODES.FINANCE_REPORTS,
    PERMISSION_CODES.PAYOUTS_VIEW,
    PERMISSION_CODES.PAYOUTS_REQUEST,
    PERMISSION_CODES.SETTINGS_VIEW,
    PERMISSION_CODES.SETTINGS_COMPANY,
    PERMISSION_CODES.SETTINGS_BANK,
    PERMISSION_CODES.SETTINGS_TEAM,
  ],
  USER: [], // Usuário comum não tem acesso ao admin
};

interface UsePermissionsReturn {
  permissions: Permission[];
  permissionCodes: string[];
  isLoading: boolean;
  error: string | null;
  hasPermission: (code: PermissionCode | PermissionCode[]) => boolean;
  hasAnyPermission: (codes: PermissionCode[]) => boolean;
  hasAllPermissions: (codes: PermissionCode[]) => boolean;
  hasRole: (role: string | string[]) => boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
  canAccessAdmin: boolean;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega permissões da API
  const loadPermissions = useCallback(async () => {
    // Espera hidratação do estado
    if (!_hasHydrated) {
      return;
    }

    if (!isAuthenticated || !user) {
      setPermissions([]);
      setPermissionCodes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Tenta carregar permissões da API
      const response = await permissionsApi.getMyPermissions();
      setPermissions(response.permissions);
      setPermissionCodes(response.codes);
    } catch (err) {
      console.warn('Falha ao carregar permissões da API, usando permissões baseadas em role');
      // Fallback: usa permissões baseadas no role
      const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
      setPermissionCodes(rolePermissions);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [_hasHydrated, isAuthenticated, user]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Verifica se tem uma permissão específica
  const hasPermission = useCallback(
    (code: PermissionCode | PermissionCode[]): boolean => {
      if (!user) return false;

      // Admin sempre tem todas as permissões
      if (user.role === 'ADMIN') return true;

      const codes = Array.isArray(code) ? code : [code];

      // Se tiver permissionCodes da API, usa eles
      if (permissionCodes.length > 0) {
        return codes.some((c) => permissionCodes.includes(c));
      }

      // Fallback: verifica pelas permissões do role
      const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
      return codes.some((c) => rolePermissions.includes(c));
    },
    [user, permissionCodes]
  );

  // Verifica se tem qualquer uma das permissões
  const hasAnyPermission = useCallback(
    (codes: PermissionCode[]): boolean => {
      return codes.some((code) => hasPermission(code));
    },
    [hasPermission]
  );

  // Verifica se tem todas as permissões
  const hasAllPermissions = useCallback(
    (codes: PermissionCode[]): boolean => {
      return codes.every((code) => hasPermission(code));
    },
    [hasPermission]
  );

  // Verifica se tem um role específico
  const hasRole = useCallback(
    (role: string | string[]): boolean => {
      if (!user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(user.role);
    },
    [user]
  );

  const isAdmin = user?.role === 'ADMIN';
  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';
  const canAccessAdmin = isOrganizer || isAdmin;

  return {
    permissions,
    permissionCodes,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isOrganizer,
    canAccessAdmin,
    refreshPermissions: loadPermissions,
  };
}

export default usePermissions;
