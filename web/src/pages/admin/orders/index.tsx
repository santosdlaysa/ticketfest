import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminApi, eventsApi } from '@/services/api';
import type { AdminOrder, Event } from '@/types';
import { Button } from '@/components/common/Button';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  FAILED: 'Falhou',
  REFUNDED: 'Reembolsado',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [page, status, paymentStatus, eventId, startDate, endDate]);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.getAll({ limit: 100 });
      setEvents(data.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getOrders({
        page,
        limit: 20,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        eventId: eventId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
      });
      setOrders(data.orders);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error: any) {
      toast.error('Erro ao carregar pedidos');
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja reembolsar este pedido?')) return;

    try {
      await adminApi.refundOrder(orderId);
      toast.success('Pedido reembolsado com sucesso');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao reembolsar pedido');
    }
  };

  const handleResendEmail = async (orderId: string) => {
    try {
      await adminApi.resendOrderEmail(orderId);
      toast.success('Email reenviado com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao reenviar email');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportReport({
        type: 'orders',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        eventId: eventId || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Exportado com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar');
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
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Head><title>Gestao de Pedidos - Lumera</title></Head>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestao de Pedidos</h1>
            <p className="text-gray-600 mt-1">
              {total} pedidos encontrados
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={handleExport} variant="outline">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ID, cliente, email..."
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="input w-full"
                >
                  <option value="">Todos</option>
                  <option value="PENDING">Pendente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
                  className="input w-full"
                >
                  <option value="">Todos</option>
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="FAILED">Falhou</option>
                  <option value="REFUNDED">Reembolsado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evento</label>
                <select
                  value={eventId}
                  onChange={(e) => { setEventId(e.target.value); setPage(1); }}
                  className="input w-full"
                >
                  <option value="">Todos</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="input w-full"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">Buscar</Button>
              </div>
            </div>
          </form>
        </div>

        {/* Orders Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Carregando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum pedido encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/admin/orders/${order.id}`} className="text-primary-600 hover:underline font-mono text-sm">
                          {order.id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                          <div className="text-sm text-gray-500">{order.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.event.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</div>
                        {order.discount > 0 && (
                          <div className="text-xs text-green-600">-{formatCurrency(order.discount)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.paymentStatus]}`}>
                          {paymentStatusLabels[order.paymentStatus]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">Ver</Button>
                          </Link>
                          {order.paymentStatus === 'PAID' && order.status !== 'CANCELLED' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleResendEmail(order.id)}>
                                Email
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleRefund(order.id)}>
                                Reembolsar
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Pagina {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Proxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
