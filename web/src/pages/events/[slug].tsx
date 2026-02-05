import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
    return sum + Number(ticket.price) * qty;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen" role="status" aria-live="polite">
        {/* Skeleton hero */}
        <div className="relative h-[50vh] md:h-[60vh] skeleton" />
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 skeleton rounded w-1/4" />
              <div className="h-12 skeleton rounded w-3/4" />
              <div className="h-5 skeleton rounded w-1/2" />
              <div className="h-5 skeleton rounded w-1/3" />
              <div className="h-32 skeleton rounded mt-6" />
            </div>
            <div className="space-y-4">
              <div className="h-64 skeleton rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="alert">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-lumera-luminoso mb-2">Evento nao encontrado</h2>
          <p className="text-lumera-muted mb-6">O evento que voce procura nao existe ou foi removido.</p>
          <Link href="/events">
            <Button>Ver todos os eventos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const hasImage = event.images && event.images.length > 0;
  const minPrice = tickets.length > 0
    ? Math.min(...tickets.map((t) => Number(t.price)))
    : 0;

  return (
    <>
      <Head>
        <title>{event.name} - Lumera</title>
      </Head>

      {/* Hero Banner */}
      <section className="relative overflow-hidden" style={{ animation: 'fade-in 0.5s ease-out both' }}>
        {/* Image / gradient background */}
        <div className="relative h-[50vh] md:h-[60vh]">
          {hasImage ? (
            <Image
              src={event.images[0]}
              alt={`Imagem do evento ${event.name}`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-800 to-secondary-900" />
          )}

          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-lumera-obsidian via-lumera-obsidian/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-lumera-obsidian/40 to-transparent" />

          {/* Back button */}
          <div className="absolute top-6 left-0 right-0 z-20">
            <div className="container-custom">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/80 bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-full hover:bg-white/[0.15] transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
            </div>
          </div>

          {/* Content over image */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div className="container-custom pb-8 md:pb-12">
              <div className="max-w-3xl" style={{ animation: 'slide-up 0.6s ease-out 0.2s both' }}>
                {/* Category badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider text-primary-300 bg-primary-500/20 backdrop-blur-md border border-primary-500/30 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {event.category}
                </span>

                {/* Event name */}
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {event.name}
                </h1>

                {/* Quick info row */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <time dateTime={event.date} className="text-sm md:text-base">
                      {format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      <span className="text-white/50 mx-1">·</span>
                      {format(eventDate, "HH:mm")}
                    </time>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm md:text-base">{event.location}</span>
                  </div>
                  {minPrice > 0 && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <span className="text-sm md:text-base">
                        A partir de <span className="text-primary-300 font-semibold">R$ {minPrice.toFixed(2)}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="container-custom py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left: Details */}
          <article className="lg:col-span-2 space-y-8" style={{ animation: 'slide-up 0.5s ease-out 0.3s both' }}>
            {/* About */}
            <section>
              <h2 className="text-xl font-bold text-lumera-luminoso mb-4 flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-gradient-lumera" aria-hidden="true" />
                Sobre o evento
              </h2>
              <div className="text-lumera-muted leading-relaxed whitespace-pre-wrap text-[15px]">
                {event.description}
              </div>
            </section>

            {/* Info cards row */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date & time card */}
              <div className="glass-card p-5 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-500/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-lumera-muted uppercase tracking-wider mb-1">Data e horario</p>
                  <p className="text-lumera-luminoso font-medium">
                    {format(eventDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-lumera-muted">
                    {format(eventDate, "HH:mm")}h
                    {event.endDate && ` - ${format(new Date(event.endDate), "HH:mm")}h`}
                  </p>
                </div>
              </div>

              {/* Location card */}
              <div className="glass-card p-5 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-500/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-lumera-muted uppercase tracking-wider mb-1">Local</p>
                  <p className="text-lumera-luminoso font-medium">{event.location}</p>
                  <p className="text-sm text-lumera-muted">{event.address}</p>
                </div>
              </div>
            </section>

            {/* Organizer */}
            {event.organizer && (
              <section className="glass-card p-5" role="region" aria-label="Informacoes do organizador">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-lumera flex items-center justify-center shadow-glow" aria-hidden="true">
                    <span className="text-white font-bold text-xl">
                      {event.organizer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-lumera-muted uppercase tracking-wider mb-0.5">Organizado por</p>
                    <p className="text-lg font-semibold text-lumera-luminoso">{event.organizer.name}</p>
                  </div>
                </div>
              </section>
            )}
          </article>

          {/* Right: Tickets sidebar */}
          <aside className="lg:col-span-1" aria-label="Selecao de ingressos" style={{ animation: 'slide-up 0.5s ease-out 0.5s both' }}>
            <div className="sticky top-24 space-y-4">
              {/* Tickets card */}
              <div className="glass-card overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/[0.06]" style={{ background: 'linear-gradient(135deg, rgba(123,46,255,0.08), rgba(74,108,255,0.05))' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-lumera flex items-center justify-center" aria-hidden="true">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-lumera-luminoso">Ingressos</h2>
                      <p className="text-xs text-lumera-muted">{tickets.length > 0 ? `${tickets.length} ${tickets.length === 1 ? 'tipo disponivel' : 'tipos disponiveis'}` : 'Indisponivel'}</p>
                    </div>
                  </div>
                </div>

                {/* Ticket list */}
                {tickets.length > 0 ? (
                  <div className="p-4 space-y-3">
                    {tickets.map((ticket) => {
                      const qty = selectedTickets[ticket.id] || 0;
                      const isSelected = qty > 0;
                      return (
                        <div
                          key={ticket.id}
                          className={`relative p-4 rounded-xl border transition-all duration-200 ${
                            isSelected
                              ? 'border-primary-500/40 bg-primary-500/[0.06]'
                              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                          }`}
                          role="group"
                          aria-label={`Ingresso ${ticket.name}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0 mr-3">
                              <h3 className="font-semibold text-lumera-luminoso">{ticket.name}</h3>
                              {ticket.description && (
                                <p className="text-xs text-lumera-muted mt-0.5 line-clamp-2">{ticket.description}</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold text-gradient-lumera">
                                R$ {Number(ticket.price).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-lumera-muted" aria-label={`${ticket.available} ingressos disponiveis`}>
                              {ticket.available} disponiveis
                            </span>

                            {/* Quantity control */}
                            <div className="flex items-center gap-1" role="group" aria-label={`Quantidade de ingressos ${ticket.name}`}>
                              <button
                                onClick={() =>
                                  setSelectedTickets({
                                    ...selectedTickets,
                                    [ticket.id]: Math.max(0, qty - 1),
                                  })
                                }
                                disabled={qty === 0}
                                className="w-8 h-8 rounded-lg border border-white/[0.1] bg-white/[0.04] flex items-center justify-center text-lumera-luminoso hover:bg-primary-500/15 hover:border-primary-500/30 transition-all disabled:opacity-30 disabled:hover:bg-white/[0.04] disabled:hover:border-white/[0.1]"
                                aria-label={`Diminuir quantidade de ${ticket.name}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-10 text-center font-bold text-sm tabular-nums" aria-live="polite" aria-atomic="true">
                                {qty}
                              </span>
                              <button
                                onClick={() =>
                                  setSelectedTickets({
                                    ...selectedTickets,
                                    [ticket.id]: Math.min(ticket.available || 0, qty + 1),
                                  })
                                }
                                disabled={qty >= (ticket.available || 0)}
                                className="w-8 h-8 rounded-lg border border-white/[0.1] bg-white/[0.04] flex items-center justify-center text-lumera-luminoso hover:bg-primary-500/15 hover:border-primary-500/30 transition-all disabled:opacity-30 disabled:hover:bg-white/[0.04] disabled:hover:border-white/[0.1]"
                                aria-label={`Aumentar quantidade de ${ticket.name}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Total + CTA */}
                    {totalSelected > 0 && (
                      <div className="pt-3 mt-1 border-t border-white/[0.06] space-y-4" role="region" aria-label="Resumo do pedido" style={{ animation: 'scale-in 0.2s ease-out both' }}>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-lumera-muted">
                            {totalSelected} ingresso{totalSelected > 1 ? 's' : ''}
                          </span>
                          <span className="text-2xl font-bold text-gradient-lumera" aria-label={`Total: R$ ${totalPrice.toFixed(2)}`}>
                            R$ {totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <Button
                          onClick={handleAddToCart}
                          className="w-full !py-3.5 !text-base"
                          size="lg"
                          aria-label={`Adicionar ${totalSelected} ${totalSelected === 1 ? 'ingresso' : 'ingressos'} ao carrinho`}
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Adicionar ao Carrinho
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/[0.04] flex items-center justify-center" aria-hidden="true">
                      <svg className="w-6 h-6 text-lumera-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <p className="text-lumera-muted text-sm" role="status">Nenhum ingresso disponivel no momento</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
