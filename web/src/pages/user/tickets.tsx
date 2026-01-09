import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/contexts/AuthContext';
import { ordersApi } from '@/services/api';
import type { Order, TicketInstance } from '@/types';
import { Button } from '@/components/common/Button';
import { UserLayout } from '@/components/layout/UserLayout';

interface TicketWithOrder extends TicketInstance {
  order: Order;
  ticketName: string;
  ticketPrice: number;
}

export default function MyTickets() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [tickets, setTickets] = useState<TicketWithOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const orders = await ordersApi.getUserOrders();

      // Extrair todos os tickets instances de pedidos confirmados
      const allTickets: TicketWithOrder[] = [];
      orders.forEach((order) => {
        if (order.status === 'CONFIRMED' && order.paymentStatus === 'PAID') {
          order.items.forEach((item) => {
            if (item.ticketInstances) {
              item.ticketInstances.forEach((ticketInstance) => {
                allTickets.push({
                  ...ticketInstance,
                  order,
                  ticketName: item.ticket.name,
                  ticketPrice: item.price,
                });
              });
            }
          });
        }
      });

      setTickets(allTickets);
    } catch (error: any) {
      toast.error('Erro ao carregar ingressos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = (ticket: TicketWithOrder) => {
    // Criar link para download do QR code como imagem
    const link = document.createElement('a');
    link.href = ticket.qrCode;
    link.download = `ticket-${ticket.id}.png`;
    link.click();
  };

  if (loading) {
    return (
      <UserLayout>
        <Head><title>Meus Ingressos - Lumera</title></Head>
        <div className="py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando ingressos...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <Head><title>Meus Ingressos - Lumera</title></Head>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Meus Ingressos</h1>
          <p className="text-gray-600 mt-2">
            Aqui estão todos os seus ingressos confirmados
          </p>
        </div>

        {tickets.length === 0 ? (
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
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Nenhum ingresso encontrado
            </h3>
            <p className="mt-2 text-gray-600">
              Você ainda não tem ingressos confirmados. Comece a explorar eventos!
            </p>
            <Button onClick={() => router.push('/events')} className="mt-6">
              Ver Eventos
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="card overflow-hidden">
                {/* Header com imagem */}
                <div className="relative h-32">
                  <img
                    src={ticket.order.event.images?.[0] || '/placeholder-event.jpg'}
                    alt={ticket.order.event.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-bold text-lg text-white line-clamp-1">
                      {ticket.order.event.name}
                    </h3>
                  </div>

                  {/* Badge de check-in */}
                  {ticket.checkedIn && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                      CHECK-IN OK
                    </div>
                  )}
                </div>

                {/* Corpo do ticket */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-1 rounded">
                      {ticket.ticketName}
                    </span>
                    <span className="text-xs text-gray-500">
                      #{ticket.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(ticket.order.event.date).toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="line-clamp-1">{ticket.order.event.location}</span>
                    </div>
                  </div>

                  {/* Linha tracejada */}
                  <div className="border-t-2 border-dashed border-gray-200 my-4 relative">
                    <div className="absolute -left-6 -top-3 w-6 h-6 bg-gray-100 rounded-full" />
                    <div className="absolute -right-6 -top-3 w-6 h-6 bg-gray-100 rounded-full" />
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                      <img
                        src={ticket.qrCode}
                        alt="QR Code"
                        className="w-40 h-40"
                      />
                    </div>
                  </div>

                  <p className="text-center text-xs text-gray-500 mb-4">
                    Apresente este QR Code na entrada
                  </p>

                  {ticket.checkedIn && ticket.checkedInAt && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                      <p className="text-green-800 text-sm font-medium">
                        Check-in realizado
                      </p>
                      <p className="text-green-600 text-xs mt-1">
                        {new Date(ticket.checkedInAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => downloadTicket(ticket)}
                      variant="outline"
                      className="flex-1 text-sm"
                    >
                      Salvar QR
                    </Button>
                    <Button
                      onClick={() => router.push(`/user/orders`)}
                      variant="outline"
                      className="flex-1 text-sm"
                    >
                      Ver Pedido
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
