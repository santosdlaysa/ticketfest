import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { adminApi } from '@/services/api';
import type { AdminOrder } from '@/types';
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

const paymentMethodLabels: Record<string, string> = {
  CREDIT_CARD: 'Cartao de Credito',
  DEBIT_CARD: 'Cartao de Debito',
  PIX: 'PIX',
  BOLETO: 'Boleto',
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getOrderDetails(id as string);
      setOrder(data);
    } catch (error: any) {
      toast.error('Erro ao carregar pedido');
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm('Tem certeza que deseja reembolsar este pedido?')) return;

    try {
      await adminApi.refundOrder(id as string);
      toast.success('Pedido reembolsado com sucesso');
      loadOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao reembolsar pedido');
    }
  };

  const handleResendEmail = async () => {
    try {
      await adminApi.resendOrderEmail(id as string);
      toast.success('Email reenviado com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao reenviar email');
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

  if (loading) {
    return (
      <>
        <Head><title>Carregando... - Lumera</title></Head>
        <div className="p-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando pedido...</p>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Head><title>Pedido nao encontrado - Lumera</title></Head>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Pedido nao encontrado</h1>
            <Link href="/admin/orders">
              <Button className="mt-4">Voltar para Pedidos</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Pedido {order.id.slice(0, 8)} - Lumera</title></Head>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/admin/orders" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Pedido #{order.id.slice(0, 8)}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.paymentStatus]}`}>
                {paymentStatusLabels[order.paymentStatus]}
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            {order.paymentStatus === 'PAID' && order.status !== 'CANCELLED' && (
              <>
                <Button variant="outline" onClick={handleResendEmail}>
                  Reenviar Email
                </Button>
                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={handleRefund}>
                  Reembolsar
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.ticket.name}</h3>
                      <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)} cada</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto {order.couponCode && `(${order.couponCode})`}</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Tickets */}
            {order.items.some((item) => item.ticketInstances && item.ticketInstances.length > 0) && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingressos</h2>
                <div className="space-y-4">
                  {order.items.map((item) =>
                    item.ticketInstances?.map((instance) => (
                      <div key={instance.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.ticket.name}</p>
                          <p className="text-sm font-mono text-gray-500">{instance.qrCode}</p>
                        </div>
                        <div className="text-right">
                          {instance.checkedIn ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Check-in realizado
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Aguardando check-in
                            </span>
                          )}
                          {instance.checkedInAt && (
                            <p className="text-xs text-gray-500 mt-1">{formatDate(instance.checkedInAt)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliente</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium text-gray-900">{order.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{order.user.email}</p>
                </div>
                {order.user.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="font-medium text-gray-900">{order.user.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Event */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Evento</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium text-gray-900">{order.event.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data</p>
                  <p className="font-medium text-gray-900">{formatDate(order.event.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Local</p>
                  <p className="font-medium text-gray-900">{order.event.location}</p>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pagamento</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Metodo</p>
                  <p className="font-medium text-gray-900">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.paymentStatus]}`}>
                    {paymentStatusLabels[order.paymentStatus]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data do Pedido</p>
                  <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                {order.paidAt && (
                  <div>
                    <p className="text-sm text-gray-500">Data do Pagamento</p>
                    <p className="font-medium text-gray-900">{formatDate(order.paidAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order ID */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Identificacao</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">ID do Pedido</p>
                  <p className="font-mono text-sm text-gray-900 break-all">{order.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
