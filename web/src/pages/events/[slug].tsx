import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { eventsApi, ticketsApi } from '@/services/api';
import { useCartStore } from '@/contexts/CartContext';
import { Button } from '@/components/common/Button';
import type { Event, Ticket } from '@/types';

export default function EventDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCartStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadEvent();
    }
  }, [slug]);

  const loadEvent = async () => {
    try {
      const eventData = await eventsApi.getBySlug(slug as string);
      setEvent(eventData);

      if (eventData.id) {
        const ticketsData = await ticketsApi.getByEvent(eventData.id);
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
        if (quantity > 0) {
          await addToCart(ticketId, quantity);
        }
      }
      toast.success('Ingressos adicionados ao carrinho!');
      router.push('/cart');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao adicionar ao carrinho');
    }
  };

  const totalSelected = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = tickets.reduce((sum, ticket) => {
    const qty = selectedTickets[ticket.id] || 0;
    return sum + ticket.price * qty;
  }, 0);

  if (loading) {
    return <div className="container-custom py-8">Carregando...</div>;
  }

  if (!event) {
    return <div className="container-custom py-8">Evento não encontrado</div>;
  }

  const eventDate = new Date(event.date);

  return (
    <>
      <Head>
        <title>{event.name} - Lumera</title>
      </Head>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Images */}
            {event.images && event.images.length > 0 && (
              <div className="relative h-96 rounded-xl overflow-hidden mb-6">
                <Image
                  src={event.images[0]}
                  alt={event.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Info */}
            <div className="mb-6">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {event.category}
              </span>
              <h1 className="text-4xl font-bold mt-4 mb-4">{event.name}</h1>

              <div className="space-y-2 text-gray-600 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(eventDate, "dd/MM/yyyy 'às' HH:mm")}
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {event.location} - {event.address}
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar - Tickets */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-4">Ingressos</h2>

              {tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{ticket.name}</h3>
                          {ticket.description && (
                            <p className="text-sm text-gray-600">{ticket.description}</p>
                          )}
                        </div>
                        <span className="font-bold text-primary-600">
                          R$ {ticket.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-500">
                          {ticket.available} disponíveis
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              setSelectedTickets({
                                ...selectedTickets,
                                [ticket.id]: Math.max(0, (selectedTickets[ticket.id] || 0) - 1),
                              })
                            }
                            className="w-8 h-8 rounded-full border hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">
                            {selectedTickets[ticket.id] || 0}
                          </span>
                          <button
                            onClick={() =>
                              setSelectedTickets({
                                ...selectedTickets,
                                [ticket.id]: Math.min(
                                  ticket.available || 0,
                                  (selectedTickets[ticket.id] || 0) + 1
                                ),
                              })
                            }
                            className="w-8 h-8 rounded-full border hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {totalSelected > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between mb-4">
                        <span className="font-semibold">Total ({totalSelected} ingresso{totalSelected > 1 ? 's' : ''})</span>
                        <span className="font-bold text-xl text-primary-600">
                          R$ {totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        onClick={handleAddToCart}
                        className="w-full"
                        size="lg"
                      >
                        Adicionar ao Carrinho
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum ingresso disponível</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
