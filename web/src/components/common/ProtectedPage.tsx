import React from 'react';
import { useRouter } from 'next/router';
import { usePermissions, PermissionCode } from '@/hooks/usePermissions';
import Link from 'next/link';

interface ProtectedPageProps {
  children: React.ReactNode;
  /** Permissão(ões) necessária(s) para acessar a página */
  permission?: PermissionCode | PermissionCode[];
  /** Permissões que TODAS devem ser satisfeitas */
  allPermissions?: PermissionCode[];
  /** Role(s) permitido(s) */
  role?: string | string[];
  /** Título da página (para mensagem de acesso negado) */
  pageTitle?: string;
  /** Se true, redireciona para /admin ao invés de mostrar mensagem */
  redirectOnDeny?: boolean;
}

/**
 * Componente para proteger páginas inteiras baseado em permissões.
 * Mostra uma mensagem de acesso negado se o usuário não tiver permissão.
 *
 * @example
 * // Em uma página de finanças
 * export default function FinancialsPage() {
 *   return (
 *     <ProtectedPage permission={PERMISSION_CODES.FINANCE_VIEW} pageTitle="Financeiro">
 *       <FinancialsContent />
 *     </ProtectedPage>
 *   );
 * }
 */
export const ProtectedPage: React.FC<ProtectedPageProps> = ({
  children,
  permission,
  allPermissions,
  role,
  pageTitle = 'esta pagina',
  redirectOnDeny = false,
}) => {
  const router = useRouter();
  const { hasPermission, hasAllPermissions, hasRole, isLoading } = usePermissions();

  // Mostra loading enquanto verifica permissões
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissoes...</p>
        </div>
      </div>
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

  // Redireciona ou mostra mensagem de acesso negado
  if (!hasAccess) {
    if (redirectOnDeny) {
      router.push('/admin');
      return null;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Voce nao tem permissao para acessar {pageTitle}.
            Entre em contato com o administrador para solicitar acesso.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedPage;
