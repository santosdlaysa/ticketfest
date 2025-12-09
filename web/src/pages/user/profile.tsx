import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/contexts/AuthContext';
import { ordersApi } from '@/services/api';
import type { Order } from '@/types';
import { Button } from '@/components/common/Button';

export default function Profile() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getUserOrders();
      setOrders(data);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Tem certeza que deseja sair?')) {
      return;
    }

    try {
      setLoggingOut(true);
      await logout();
      toast.success('Logout realizado com sucesso');
      router.push('/');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    } finally {
      setLoggingOut(false);
    }
  };

  // Calcular estatísticas
  const stats = {
    totalOrders: orders.length,
    confirmedOrders: orders.filter(o => o.status === 'CONFIRMED').length,
    pendingOrders: orders.filter(o => o.status === 'PENDING').length,
    totalSpent: orders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.total, 0),
    totalTickets: orders
      .filter(o => o.status === 'CONFIRMED')
      .reduce((sum, o) => {
        return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0),
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; className: string }> = {
      USER: { label: 'Usuário', className: 'badge badge-gray' },
      ORGANIZER: { label: 'Organizador', className: 'badge badge-primary' },
      ADMIN: { label: 'Administrador', className: 'badge badge-error' },
    };
    const roleInfo = roles[role] || roles.USER;
    return <span className={roleInfo.className}>{roleInfo.label}</span>;
  };

  if (authLoading || loading) {
    return (
      <>
        <Head><title>Meu Perfil - Lumera</title></Head>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head><title>Meu Perfil - Lumera</title></Head>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="card p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <p className="text-gray-600 mb-2">{user.email}</p>
                <div className="flex items-center gap-2">
                  {getRoleBadge(user.role)}
                  <span className="text-sm text-gray-500">
                    Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="font-semibold mb-4">Informações Pessoais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {user.cpf && (
                  <div>
                    <span className="text-gray-600">CPF:</span>
                    <p className="font-medium">{user.cpf}</p>
                  </div>
                )}
                {user.phone && (
                  <div>
                    <span className="text-gray-600">Telefone:</span>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                )}
                {!user.cpf && !user.phone && (
                  <p className="text-gray-500 col-span-2">
                    Nenhuma informação adicional cadastrada.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {stats.totalOrders}
              </div>
              <div className="text-sm text-gray-600">Pedidos</div>
            </div>

            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.confirmedOrders}
              </div>
              <div className="text-sm text-gray-600">Confirmados</div>
            </div>

            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {stats.totalTickets}
              </div>
              <div className="text-sm text-gray-600">Ingressos</div>
            </div>

            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                R$ {stats.totalSpent.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Gasto Total</div>
            </div>
          </div>

          {/* Links rápidos */}
          <div className="card p-6 mb-6">
            <h2 className="font-semibold mb-4">Acesso Rápido</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                href="/user/tickets"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
                <div>
                  <div className="font-medium">Meus Ingressos</div>
                  <div className="text-sm text-gray-600">
                    {stats.totalTickets} ingressos disponíveis
                  </div>
                </div>
              </Link>

              <Link
                href="/user/orders"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <div>
                  <div className="font-medium">Meus Pedidos</div>
                  <div className="text-sm text-gray-600">
                    {stats.totalOrders} pedidos realizados
                  </div>
                </div>
              </Link>

              <Link
                href="/events"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <div>
                  <div className="font-medium">Explorar Eventos</div>
                  <div className="text-sm text-gray-600">
                    Descubra novos eventos
                  </div>
                </div>
              </Link>

              <Link
                href="/cart"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <div>
                  <div className="font-medium">Meu Carrinho</div>
                  <div className="text-sm text-gray-600">
                    Ver itens no carrinho
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Ações */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Configurações</h2>
            <div className="space-y-3">
              <Button
                onClick={handleLogout}
                variant="outline"
                isLoading={loggingOut}
                className="w-full"
              >
                Sair da Conta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
