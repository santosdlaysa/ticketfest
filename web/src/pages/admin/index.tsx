import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { adminApi, type DashboardData } from '@/services/api';
import { Button } from '@/components/common/Button';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadDashboard = async () => {
    try {
      const data = await adminApi.getDashboard();
      setDashboard(data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanha';
    if (diffDays < 7) return `Em ${diffDays} dias`;
    if (diffDays < 30) return `Em ${Math.ceil(diffDays / 7)} semanas`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PAID: { label: 'Pago', className: 'bg-green-100 text-green-800' },
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      FAILED: { label: 'Falhou', className: 'bg-red-100 text-red-800' },
      REFUNDED: { label: 'Reembolsado', className: 'bg-gray-100 text-gray-800' },
    };
    const info = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.className}`}>{info.label}</span>;
  };

  if (loading) {
    return (
      <>
        <Head><title>Dashboard - Lumera</title></Head>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Dashboard - Lumera</title></Head>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Acompanhe suas vendas em tempo real
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded text-primary-600"
              />
              Atualizar automaticamente
            </label>
            <Button variant="outline" onClick={loadDashboard}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </Button>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Receita Hoje</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboard?.summary.todayRevenue || 0)}
                </p>
                {dashboard?.summary.dailyGrowth !== 0 && (
                  <p className={`text-sm ${dashboard?.summary.dailyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboard?.summary.dailyGrowth > 0 ? '+' : ''}
                    {dashboard?.summary.dailyGrowth.toFixed(1)}% vs ontem
                  </p>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pedidos Hoje</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboard?.summary.todayOrders || 0}
                </p>
                <p className="text-sm text-gray-500">
                  {dashboard?.summary.todayTickets || 0} ingressos
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Receita do Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboard?.summary.monthRevenue || 0)}
                </p>
                <p className="text-sm text-gray-500">
                  {dashboard?.summary.monthOrders || 0} pedidos
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboard?.summary.pendingOrders || 0}
                </p>
                <p className="text-sm text-gray-500">aguardando pagamento</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <p className="text-sm opacity-80">Receita Total (Todos os Tempos)</p>
            <p className="text-3xl font-bold mt-1">
              {formatCurrency(dashboard?.summary.totalRevenue || 0)}
            </p>
            <p className="text-sm opacity-80 mt-2">
              {dashboard?.summary.totalOrders || 0} pedidos realizados
            </p>
          </div>

          <div className="card p-6 bg-gradient-to-br from-green-500 to-green-700 text-white">
            <p className="text-sm opacity-80">Esta Semana</p>
            <p className="text-3xl font-bold mt-1">
              {formatCurrency(dashboard?.summary.weekRevenue || 0)}
            </p>
            <p className="text-sm opacity-80 mt-2">
              {dashboard?.summary.weekOrders || 0} pedidos
            </p>
          </div>

          <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <p className="text-sm opacity-80">Este Mes</p>
            <p className="text-3xl font-bold mt-1">
              {formatCurrency(dashboard?.summary.monthRevenue || 0)}
            </p>
            <p className="text-sm opacity-80 mt-2">
              {dashboard?.summary.monthOrders || 0} pedidos
            </p>
          </div>
        </div>

        {/* Recent Orders and Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pedidos Recentes
              </h3>
              <Link href="/admin/orders" className="text-primary-600 text-sm hover:underline">
                Ver todos
              </Link>
            </div>
            {dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentOrders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {order.customer}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {order.event}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="mt-2">Nenhum pedido recente</p>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Proximos Eventos
              </h3>
              <Link href="/admin/events" className="text-primary-600 text-sm hover:underline">
                Ver todos
              </Link>
            </div>
            {dashboard?.upcomingEvents && dashboard.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {dashboard.upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}/tickets`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900 truncate">
                        {event.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {getRelativeDate(event.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(event.occupancy, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {event.ticketsSold}/{event.totalCapacity}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2">Nenhum evento proximo</p>
                <Link href="/admin/events/create">
                  <Button className="mt-4" size="sm">
                    Criar Evento
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Top Events This Month */}
        {dashboard?.topEvents && dashboard.topEvents.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Eventos Este Mes
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Evento</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Pedidos</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.topEvents.map((event, index) => (
                    <tr key={event.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                            {index + 1}
                          </span>
                          <Link
                            href={`/admin/events/${event.id}/tickets`}
                            className="font-medium text-gray-900 hover:text-primary-600"
                          >
                            {event.name}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {event.orders}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(event.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
