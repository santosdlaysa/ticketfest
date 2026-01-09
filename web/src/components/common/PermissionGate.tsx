import React from 'react';
import { usePermissions, PermissionCode } from '@/hooks/usePermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  /** Permissão(ões) necessária(s) - mostra se tiver QUALQUER uma */
  permission?: PermissionCode | PermissionCode[];
  /** Permissões que TODAS devem ser satisfeitas */
  allPermissions?: PermissionCode[];
  /** Role(s) permitido(s) - mostra se tiver QUALQUER um */
  role?: string | string[];
  /** Componente alternativo a mostrar se não tiver permissão */
  fallback?: React.ReactNode;
  /** Se true, mostra loading enquanto verifica permissões */
  showLoading?: boolean;
}

/**
 * Componente que controla a visibilidade de elementos baseado em permissões.
 *
 * @example
 * // Mostra apenas se tiver permissão de visualizar finanças
 * <PermissionGate permission={PERMISSION_CODES.FINANCE_VIEW}>
 *   <FinanceWidget />
 * </PermissionGate>
 *
 * @example
 * // Mostra se tiver qualquer uma das permissões
 * <PermissionGate permission={[PERMISSION_CODES.EVENTS_EDIT, PERMISSION_CODES.EVENTS_DELETE]}>
 *   <EditButton />
 * </PermissionGate>
 *
 * @example
 * // Mostra apenas se tiver TODAS as permissões
 * <PermissionGate allPermissions={[PERMISSION_CODES.PAYOUTS_VIEW, PERMISSION_CODES.PAYOUTS_APPROVE]}>
 *   <ApprovePayoutButton />
 * </PermissionGate>
 *
 * @example
 * // Mostra baseado no role
 * <PermissionGate role="ADMIN">
 *   <AdminOnlySection />
 * </PermissionGate>
 *
 * @example
 * // Com fallback
 * <PermissionGate permission={PERMISSION_CODES.FINANCE_VIEW} fallback={<AccessDenied />}>
 *   <FinanceData />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  allPermissions,
  role,
  fallback = null,
  showLoading = false,
}) => {
  const { hasPermission, hasAllPermissions, hasRole, isLoading } = usePermissions();

  // Mostra loading enquanto verifica permissões
  if (showLoading && isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-full" />
    );
  }

  // Verifica permissões
  let hasAccess = false;

  // Se nenhuma restrição, permite acesso
  if (!permission && !allPermissions && !role) {
    hasAccess = true;
  }

  // Verifica role
  if (role && hasRole(role)) {
    hasAccess = true;
  }

  // Verifica permissão única ou qualquer uma das permissões
  if (permission && hasPermission(permission)) {
    hasAccess = true;
  }

  // Verifica se tem TODAS as permissões
  if (allPermissions && hasAllPermissions(allPermissions)) {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * HOC para proteger páginas/componentes por permissão
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    permission?: PermissionCode | PermissionCode[];
    allPermissions?: PermissionCode[];
    role?: string | string[];
    fallback?: React.ReactNode;
  }
): React.FC<P> {
  const WithPermissionComponent: React.FC<P> = (props) => {
    return (
      <PermissionGate {...options}>
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };

  WithPermissionComponent.displayName = `WithPermission(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithPermissionComponent;
}

export default PermissionGate;
