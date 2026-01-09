import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/contexts/AuthContext';
import { usePermissions, PERMISSION_CODES, PermissionCode } from '@/hooks/usePermissions';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  permission?: PermissionCode | PermissionCode[];
}

// Navegação principal com permissões
const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    permission: PERMISSION_CODES.DASHBOARD_VIEW,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Eventos',
    href: '/admin/events',
    permission: PERMISSION_CODES.EVENTS_VIEW,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Locais',
    href: '/admin/venues',
    permission: PERMISSION_CODES.VENUES_VIEW,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// Navegação de vendas com permissões
const salesNavigation: NavItem[] = [
  {
    name: 'Pedidos',
    href: '/admin/orders',
    permission: PERMISSION_CODES.ORDERS_VIEW,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    name: 'Relatorios',
    href: '/admin/reports',
    permission: PERMISSION_CODES.FINANCE_REPORTS,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Financeiro',
    href: '/admin/financials',
    permission: PERMISSION_CODES.FINANCE_VIEW,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Transacoes',
    href: '/admin/transactions',
    permission: PERMISSION_CODES.FINANCE_TRANSACTIONS,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    name: 'Repasses',
    href: '/admin/payouts',
    permission: PERMISSION_CODES.PAYOUTS_VIEW,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

// Navegação de operações com permissões
const otherNavigation: NavItem[] = [
  {
    name: 'Check-in',
    href: '/admin/checkin',
    permission: PERMISSION_CODES.CHECKIN_VIEW,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    name: 'Usuarios',
    href: '/admin/users',
    permission: PERMISSION_CODES.USERS_MANAGE,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    name: 'Permissoes',
    href: '/admin/permissions',
    permission: PERMISSION_CODES.PERMISSIONS_VIEW,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    name: 'Configuracoes',
    href: '/admin/settings',
    permission: PERMISSION_CODES.SETTINGS_VIEW,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user, logout, checkAuth } = useAuthStore();
  const { hasPermission, canAccessAdmin, isLoading: permissionsLoading } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthValid, setIsAuthValid] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth();
      setIsAuthValid(authenticated);
      setIsChecking(false);

      if (!authenticated) {
        router.push('/auth/login?redirect=' + encodeURIComponent(router.asPath));
      }
    };
    verifyAuth();
  }, []);

  // Filtra itens de navegação baseado nas permissões
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  };

  const filteredNavigation = filterNavItems(navigation);
  const filteredSalesNavigation = filterNavItems(salesNavigation);
  const filteredOtherNavigation = filterNavItems(otherNavigation);

  // Show loading while checking authentication
  if (isChecking || permissionsLoading) {
    return (
      <div className="min-h-screen bg-lumera-luminoso flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">Verificando autenticacao...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthValid) {
    return null;
  }

  // Verifica se o usuário pode acessar o admin
  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen bg-lumera-luminoso flex items-center justify-center" role="alert" aria-live="assertive">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Voce nao tem permissao para acessar esta area. Entre em contato com o administrador.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para o site
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return router.pathname === '/admin';
    }
    return router.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive(item.href)
          ? 'bg-primary-100 text-primary-700'
          : 'text-lumera-obsidian hover:bg-primary-50'
      }`}
      onClick={() => setSidebarOpen(false)}
    >
      <span className={isActive(item.href) ? 'text-primary-500' : 'text-gray-500'}>
        {item.icon}
      </span>
      {item.name}
      {item.badge && (
        <span className="ml-auto bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-lumera-luminoso">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-lumera-obsidian bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-lumera-divider ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navegação do painel administrativo"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-lumera-divider">
            <Link href="/admin" className="flex items-center gap-2" aria-label="Lumera Admin - Página inicial">
              <div className="w-8 h-8 bg-gradient-lumera rounded-lg flex items-center justify-center shadow-sm" aria-hidden="true">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-xl font-bold text-gradient-lumera">Lumera</span>
            </Link>
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-primary-500"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu lateral"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6" aria-label="Menu principal do admin">
            {/* Main Navigation */}
            {filteredNavigation.length > 0 && (
              <section>
                <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Principal
                </h2>
                <div className="space-y-1">
                  {filteredNavigation.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Sales Navigation */}
            {filteredSalesNavigation.length > 0 && (
              <section>
                <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Vendas
                </h2>
                <div className="space-y-1">
                  {filteredSalesNavigation.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Other Navigation */}
            {filteredOtherNavigation.length > 0 && (
              <section>
                <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Operacoes
                </h2>
                <div className="space-y-1">
                  {filteredOtherNavigation.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              </section>
            )}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-lumera-divider" role="region" aria-label="Informações do usuário">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center" aria-hidden="true">
                <span className="text-primary-700 font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-lumera-obsidian truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-primary-50 rounded-lg"
                aria-label="Voltar ao site público"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar ao Site
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                aria-label="Sair da conta"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-lumera-divider">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-primary-500"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu lateral"
              aria-expanded={sidebarOpen}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1 lg:hidden text-center">
              <span className="font-semibold text-lumera-obsidian">Admin</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Só mostra botão de criar evento se tiver permissão */}
              {hasPermission(PERMISSION_CODES.EVENTS_CREATE) && (
                <Link
                  href="/admin/events/create"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-lumera text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-sm hover:shadow-glow"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Novo Evento
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]" role="main" aria-label="Conteúdo principal">
          {children}
        </main>
      </div>
    </div>
  );
};
