import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

export type UserRole = 'USER' | 'ADMIN' | 'ORGANIZER' | 'PROMOTER';

export type TabName = 'Home' | 'MyTickets' | 'Validation' | 'Lists' | 'Profile';

// Configuração de tabs permitidas por role
const TAB_PERMISSIONS: Record<UserRole, TabName[]> = {
  USER: ['Home', 'MyTickets', 'Profile'],
  ORGANIZER: ['Home', 'MyTickets', 'Validation', 'Lists', 'Profile'],
  ADMIN: ['Home', 'MyTickets', 'Validation', 'Lists', 'Profile'],
  PROMOTER: ['Home', 'MyTickets', 'Lists', 'Profile'],
};

// Telas que requerem roles específicos
const SCREEN_PERMISSIONS: Record<string, UserRole[]> = {
  // Telas de validação
  'EventSelection': ['ADMIN', 'ORGANIZER'],
  'TicketScanner': ['ADMIN', 'ORGANIZER'],
  'ValidationResult': ['ADMIN', 'ORGANIZER'],
  'ManualValidation': ['ADMIN', 'ORGANIZER'],
  // Telas de listas/promoter
  'ListsMain': ['ADMIN', 'ORGANIZER', 'PROMOTER'],
  'PromoterList': ['ADMIN', 'ORGANIZER', 'PROMOTER'],
  // Telas de admin (se houver no futuro)
  'AdminDashboard': ['ADMIN'],
  'AdminUsers': ['ADMIN'],
  'AdminPayouts': ['ADMIN'],
};

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const role = (user?.role || 'USER') as UserRole;

  const permissions = useMemo(() => {
    const allowedTabs = TAB_PERMISSIONS[role] || TAB_PERMISSIONS.USER;

    return {
      role,
      allowedTabs,

      // Verifica se uma tab específica é permitida
      canAccessTab: (tabName: TabName): boolean => {
        return allowedTabs.includes(tabName);
      },

      // Verifica se uma tela específica é permitida
      canAccessScreen: (screenName: string): boolean => {
        const allowedRoles = SCREEN_PERMISSIONS[screenName];
        // Se a tela não está na lista, permite acesso
        if (!allowedRoles) return true;
        return allowedRoles.includes(role);
      },

      // Helpers de role
      isAdmin: role === 'ADMIN',
      isOrganizer: role === 'ORGANIZER',
      isPromoter: role === 'PROMOTER',
      isUser: role === 'USER',

      // Verificações combinadas
      canValidateTickets: role === 'ADMIN' || role === 'ORGANIZER',
      canManageLists: role === 'ADMIN' || role === 'ORGANIZER' || role === 'PROMOTER',
      canAccessAdmin: role === 'ADMIN',
    };
  }, [role]);

  return permissions;
}

// Hook para obter apenas as tabs permitidas (para uso no HomeTabs)
export function useAllowedTabs(): TabName[] {
  const { allowedTabs } = usePermissions();
  return allowedTabs;
}
