import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/contexts/AuthContext';
import { useCartStore } from '@/contexts/CartContext';
import { Button } from '@/components/common/Button';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = cart?.itemCount || 0;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-lumera-border">
      <nav className="container-custom" aria-label="Navegação principal">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" aria-label="Lumera - Página inicial">
            <div className="w-8 h-8 bg-gradient-lumera rounded-lg flex items-center justify-center shadow-sm" aria-hidden="true">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-xl font-bold text-gradient-lumera">Lumera</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/events"
              className="text-lumera-luminoso/80 hover:text-primary-400 transition-colors"
            >
              Eventos
            </Link>
            <Link
              href="/events?category=Música"
              className="text-lumera-luminoso/80 hover:text-primary-400 transition-colors"
            >
              Música
            </Link>
            <Link
              href="/events?category=Tecnologia"
              className="text-lumera-luminoso/80 hover:text-primary-400 transition-colors"
            >
              Tecnologia
            </Link>
            <Link
              href="/events?category=Comédia"
              className="text-lumera-luminoso/80 hover:text-primary-400 transition-colors"
            >
              Comédia
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-lumera-luminoso/80 hover:text-primary-400 transition-colors"
              aria-label={`Carrinho de compras${cartItemCount > 0 ? ` - ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'itens'}` : ' - vazio'}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" aria-hidden="true">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative group">
                <button
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-primary-500/10 transition-colors"
                  aria-label={`Menu do usuário - ${user.name}`}
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center" aria-hidden="true">
                    <span className="text-primary-300 font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-lumera-luminoso/80"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown */}
                <nav className="absolute right-0 mt-2 w-48 bg-white backdrop-blur-lg rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border border-lumera-border animate-scale-in" aria-label="Menu do usuário">
                  <div className="px-4 py-2 border-b border-lumera-divider">
                    <p className="text-sm font-medium text-lumera-luminoso">{user.name}</p>
                    <p className="text-xs text-lumera-muted">{user.email}</p>
                  </div>
                  {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
                    <Link
                      href="/admin/events"
                      className="block px-4 py-2 text-sm text-primary-400 font-medium hover:bg-primary-500/10"
                    >
                      Meus Eventos
                    </Link>
                  )}
                  <Link
                    href="/user/profile"
                    className="block px-4 py-2 text-sm text-lumera-luminoso hover:bg-primary-500/10"
                  >
                    Meu Perfil
                  </Link>
                  <Link
                    href="/user/tickets"
                    className="block px-4 py-2 text-sm text-lumera-luminoso hover:bg-primary-500/10"
                  >
                    Meus Ingressos
                  </Link>
                  <Link
                    href="/user/orders"
                    className="block px-4 py-2 text-sm text-lumera-luminoso hover:bg-primary-500/10"
                  >
                    Meus Pedidos
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    aria-label="Sair da conta"
                  >
                    Sair
                  </button>
                </nav>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Criar Conta
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-lumera-luminoso"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    mobileMenuOpen
                      ? 'M6 18L18 6M6 6l12 12'
                      : 'M4 6h16M4 12h16M4 18h16'
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav id="mobile-menu" className="md:hidden border-t border-lumera-border py-4 space-y-2" aria-label="Menu mobile">
            <Link
              href="/events"
              className="block px-4 py-2 text-lumera-luminoso hover:bg-primary-500/10 rounded-lg"
            >
              Eventos
            </Link>
            <Link
              href="/events?category=Música"
              className="block px-4 py-2 text-lumera-luminoso hover:bg-primary-500/10 rounded-lg"
            >
              Música
            </Link>
            <Link
              href="/events?category=Tecnologia"
              className="block px-4 py-2 text-lumera-luminoso hover:bg-primary-500/10 rounded-lg"
            >
              Tecnologia
            </Link>
            <Link
              href="/events?category=Comédia"
              className="block px-4 py-2 text-lumera-luminoso hover:bg-primary-500/10 rounded-lg"
            >
              Comédia
            </Link>
          </nav>
        )}
      </nav>
    </header>
  );
};
