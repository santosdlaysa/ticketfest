import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/contexts/AuthContext';
import { ordersApi } from '@/services/api';
import type { Order } from '@/types';
import { Button } from '@/components/common/Button';

export default function MyOrders() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

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
      toast.error('Erro ao carregar pedidos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) {
      return;
    }

    try {
      setCancellingOrderId(orderId);
      await ordersApi.cancel(orderId);
      toast.success('Pedido cancelado com sucesso');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao cancelar pedido');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusBadge = (order: Order) => {
    if (order.status === 'CANCELLED') {
      return <span className="badge badge-gray">Cancelado</span>;
    }

    if (order.paymentStatus === 'PAID') {
      return <span className="badge badge-success">Pago</span>;
    }

    if (order.paymentStatus === 'PENDING') {
      return <span className="badge badge-warning">Pendente</span>;
    }

    if (order.paymentStatus === 'FAILED') {
      return <span className="badge badge-error">Falhou</span>;
    }

    if (order.paymentStatus === 'REFUNDED') {
      return <span className="badge badge-gray">Reembolsado</span>;
    }

    return <span className="badge badge-gray">{order.status}</span>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CREDIT_CARD: 'Cartão de Crédito',
      DEBIT_CARD: 'Cartão de Débito',
      PIX: 'PIX',
      BOLETO: 'Boleto',
    };
    return methods[method] || method;
  };

  if (authLoading || loading) {
    return (
      <>
        <Head><title>Meus Pedidos - Lumera</title></Head>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Meus Pedidos - Lumera</title></Head>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Meus Pedidos</h1>
          <p className="text-gray-600 mt-2">
            Histórico completo dos seus pedidos
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Nenhum pedido encontrado
            </h3>
            <p className="mt-2 text-gray-600">
              Você ainda não fez nenhum pedido. Comece a explorar eventos!
            </p>
            <Button onClick={() => router.push('/events')} className="mt-6">
              Ver Eventos
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">
                        {order.event.name}
                      </h3>
                      {getStatusBadge(order)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Pedido #{order.id.substring(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {order.event.images[0] && (
                    <img
                      src={order.event.images[0]}
                      alt={order.event.name}
                      className="w-full md:w-32 h-24 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">
                        <strong>Evento:</strong> {order.event.name}
                      </p>
                      <p className="text-gray-600 mb-1">
                        <strong>Data:</strong>{' '}
                        {new Date(order.event.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-gray-600">
                        <strong>Local:</strong> {order.event.location}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 mb-1">
                        <strong>Pagamento:</strong>{' '}
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </p>
                      {order.paidAt && (
                        <p className="text-gray-600 mb-1">
                          <strong>Pago em:</strong>{' '}
                          {new Date(order.paidAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                      {order.couponCode && (
                        <p className="text-gray-600">
                          <strong>Cupom:</strong> {order.couponCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-semibold mb-2">Ingressos:</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm bg-gray-50 p-3 rounded"
                      >
                        <span>
                          {item.quantity}x {item.ticket.name}
                        </span>
                        <span className="font-medium">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>R$ {order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 mb-1">
                      <span>Desconto:</span>
                      <span>- R$ {order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'CONFIRMED' && order.paymentStatus === 'PAID' && (
                    <Button
                      onClick={() => router.push('/user/tickets')}
                      className="flex-1"
                    >
                      Ver Ingressos
                    </Button>
                  )}

                  {order.status === 'PENDING' && order.paymentStatus === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => router.push(`/checkout/success?orderId=${order.id}`)}
                        className="flex-1"
                      >
                        Continuar Pagamento
                      </Button>
                      <Button
                        onClick={() => handleCancelOrder(order.id)}
                        variant="outline"
                        isLoading={cancellingOrderId === order.id}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
