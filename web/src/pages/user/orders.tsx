import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { UserLayout } from '@/components/layout/UserLayout';
import { useAuthStore } from '@/contexts/AuthContext';
import { ordersApi } from '@/services/api';
import type { Order } from '@/types';

export default function UserOrdersPage() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Só carrega pedidos se estiver autenticado e hidratado
    if (_hasHydrated && isAuthenticated) {
      fetchOrders();
    }
  }, [_hasHydrated, isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.getUserOrders();
      setOrders(data);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
      CONFIRMED: { label: 'Confirmado', className: 'bg-green-100 text-green-700' },
      CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
    };
    const statusInfo = statuses[status] || statuses.PENDING;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CREDIT_CARD: 'Cartao de Credito',
      PIX: 'PIX',
      BOLETO: 'Boleto',
    };
    return methods[method] || method;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <UserLayout>
      <Head>
        <title>Meus Pedidos - Lumera</title>
      </Head>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meus Pedidos</h1>
          <p className="text-gray-600">Acompanhe o historico de todas as suas compras</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600 mb-4">Voce ainda nao fez nenhuma compra</p>
            <Link href="/events" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
              Explorar Eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Pedido #{order.id.slice(0, 8)}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{getPaymentMethodLabel(order.paymentMethod)}</span>
                    <span className="text-lg font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                <div className="divide-y">
                  {order.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{order.event.name}</p>
                        <p className="text-sm text-gray-500">{item.ticket.name} x {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {order.status === 'CONFIRMED' && (
                  <div className="p-4 bg-gray-50 border-t">
                    <Link
                      href="/user/tickets"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Ver meus ingressos →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
