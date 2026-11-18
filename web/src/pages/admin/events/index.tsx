import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { eventsApi, adminApi } from '@/services/api';
import { useAuthReady } from '@/hooks/useAuthReady';
import type { Event } from '@/types';
import { Button } from '@/components/common/Button';

export default function AdminEvents() {
  const isReady = useAuthReady();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      loadEvents();
    }
  }, [isReady]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getMyEvents();
      setEvents(data.events);
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      toast.error(error.response?.data?.error || 'Erro ao carregar eventos');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) {
      return;
    }

    try {
      setDeletingId(id);
      await eventsApi.delete(id);
      toast.success('Evento deletado com sucesso');
      loadEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar evento');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportAttendees = async (id: string) => {
    try {
      setExportingId(id);
      await adminApi.exportEventAttendees(id);
      toast.success('Lista de participantes exportada!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao exportar participantes');
    } finally {
      setExportingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Rascunho', className: 'badge badge-gray' },
      PUBLISHED: { label: 'Publicado', className: 'badge badge-success' },
      CANCELLED: { label: 'Cancelado', className: 'badge badge-error' },
      COMPLETED: { label: 'Concluído', className: 'badge badge-primary' },
    };
    const info = statusMap[status] || statusMap.DRAFT;
    return <span className={info.className}>{info.label}</span>;
  };

  if (loading) {
    return (
      <>
        <Head><title>Meus Eventos - Lumera</title></Head>
        <div className="p-4 sm:p-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-lumera-muted">Carregando eventos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Meus Eventos - Lumera</title></Head>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meus Eventos</h1>
            <p className="text-lumera-muted mt-2">
              Gerencie seus eventos e ingressos
            </p>
          </div>
          <Link href="/admin/events/create" className="w-full sm:w-auto">
            <Button>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Criar Evento
            </Button>
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="card p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-lumera-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-lumera-luminoso">
              Nenhum evento criado
            </h3>
            <p className="mt-2 text-lumera-muted">
              Comece criando seu primeiro evento!
            </p>
            <Link href="/admin/events/create">
              <Button className="mt-6">
                Criar Primeiro Evento
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => (
              <div key={event.id} className="card p-4 sm:p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Imagem */}
                  <div className="w-full md:w-48 flex-shrink-0">
                    {event.images && event.images[0] ? (
                      <img
                        src={event.images[0]}
                        alt={event.name}
                        className="w-full h-32 md:h-full object-cover rounded-lg bg-lumera-surface-alt"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="w-full h-32 md:h-full bg-lumera-surface-alt rounded-lg flex items-center justify-center">
                              <svg class="w-12 h-12 text-lumera-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="w-full h-32 md:h-full bg-lumera-surface-alt rounded-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-lumera-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{event.name}</h3>
                          {getStatusBadge(event.status)}
                        </div>
                        <p className="text-sm text-lumera-muted mb-2">
                          {event.category}
                        </p>
                      </div>
                    </div>

                    <p className="text-lumera-muted mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-lumera-muted mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {new Date(event.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          Criado em {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/events/${event.slug}`}>
                        <Button variant="outline" size="sm">
                          Ver Pagina
                        </Button>
                      </Link>
                      <Link href={`/admin/events/${event.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Link href={`/admin/events/${event.id}/tickets`}>
                        <Button variant="outline" size="sm">
                          Ingressos
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportAttendees(event.id)}
                        isLoading={exportingId === event.id}
                        className="text-green-400 border-green-400 hover:bg-green-500/10"
                      >
                        Exportar Participantes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                        isLoading={deletingId === event.id}
                        className="text-red-400 border-red-400 hover:bg-red-500/10"
                      >
                        Deletar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
