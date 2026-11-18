import React, { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/common/Button';
import { eventsApi } from '@/services/api';
import { useAuthReady } from '@/hooks/useAuthReady';
import { useAuthStore } from '@/contexts/AuthContext';
import type { Event } from '@/types';

export default function AdminCheckin() {
  const isReady = useAuthReady();
  const user = useAuthStore((state) => state.user);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const result = user?.role === 'ADMIN'
        ? await eventsApi.getAll({ limit: 100 })
        : await eventsApi.getMyEvents({ limit: 100 });
      setEvents(result.events);
    } catch (error: any) {
      console.error('Erro ao carregar eventos para check-in:', error);
      toast.error(error.response?.data?.error || 'Não foi possível carregar os eventos');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (isReady) loadEvents();
  }, [isReady, loadEvents]);

  return (
    <>
      <Head><title>Check-in de ingressos - Lumera</title></Head>
      <div className="p-4 sm:p-6">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wider text-vip-300">Operações</p>
          <h1 className="mt-2 text-3xl font-bold text-lumera-luminoso">Check-in de ingressos</h1>
          <p className="mt-2 text-lumera-muted">
            Escolha um evento para abrir o leitor de QR Code, buscar ingressos e acompanhar as entradas.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center" role="status" aria-live="polite">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" aria-hidden="true" />
              <p className="mt-4 text-lumera-muted">Carregando eventos...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="card p-10 text-center">
            <h2 className="text-xl font-semibold text-lumera-luminoso">Nenhum evento disponível</h2>
            <p className="mx-auto mt-2 max-w-lg text-lumera-muted">
              Eventos publicados e futuros aparecerão aqui para você iniciar o check-in.
            </p>
            <Button className="mt-6" variant="outline" onClick={loadEvents}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <article key={event.id} className="card flex flex-col overflow-hidden">
                {event.images?.[0] ? (
                  <img
                    src={event.images[0]}
                    alt=""
                    className="h-40 w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-lumera-surface-alt text-lumera-muted" aria-hidden="true">
                    Sem imagem
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-lumera-luminoso">{event.name}</h2>
                    <span className="shrink-0 rounded-full border border-vip-300/30 bg-vip-300/10 px-2.5 py-1 text-xs font-medium text-vip-300">
                      {event.category}
                    </span>
                  </div>
                  <p className="text-sm text-lumera-muted">
                    {new Date(event.date).toLocaleString('pt-BR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="mt-1 text-sm text-lumera-muted">{event.location}</p>
                  <Link href={`/admin/events/${event.id}/checkin`} className="mt-auto pt-5">
                    <Button className="w-full">
                      Abrir check-in
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
