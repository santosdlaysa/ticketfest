import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/contexts/AuthContext';
import { ordersApi } from '@/services/api';
import type { Order, TicketInstance } from '@/types';
import { Button } from '@/components/common/Button';

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
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated]);

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

  if (authLoading || loading) {
    return (
      <>
        <Head><title>Meus Ingressos - TicketFest</title></Head>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando ingressos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Meus Ingressos - TicketFest</title></Head>
      <div className="container mx-auto px-4 py-12">
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
              <div key={ticket.id} className="card p-6">
                <div className="mb-4">
                  <img
                    src={ticket.order.event.images[0] || '/placeholder-event.jpg'}
                    alt={ticket.order.event.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>

                <h3 className="font-bold text-lg mb-2">
                  {ticket.order.event.name}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <strong>Tipo:</strong> {ticket.ticketName}
                  </p>
                  <p>
                    <strong>Data:</strong>{' '}
                    {new Date(ticket.order.event.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p>
                    <strong>Local:</strong> {ticket.order.event.location}
                  </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                  <img
                    src={ticket.qrCode}
                    alt="QR Code"
                    className="w-full h-auto"
                  />
                </div>

                {ticket.checkedIn && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ Check-in realizado
                    </p>
                    {ticket.checkedInAt && (
                      <p className="text-green-600 text-xs mt-1">
                        {new Date(ticket.checkedInAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadTicket(ticket)}
                    variant="outline"
                    className="flex-1 text-sm"
                  >
                    Download
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
            ))}
          </div>
        )}
      </div>
    </>
  );
}
