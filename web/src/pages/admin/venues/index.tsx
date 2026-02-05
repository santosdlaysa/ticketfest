import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { venuesApi } from '@/services/api';
import type { Venue } from '@/types';
import { Button } from '@/components/common/Button';

interface VenueWithCount extends Venue {
  _count?: {
    events: number;
  };
}

// Mock venues for development
const mockVenues: VenueWithCount[] = [
  {
    id: '1',
    name: 'Allianz Parque',
    address: 'Av. Francisco Matarazzo, 1705',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05001-200',
    capacity: 55000,
    description: 'Arena multiuso',
    images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800'],
    phone: '(11) 3674-6000',
    email: 'contato@allianzparque.com.br',
    organizerId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { events: 3 },
  },
  {
    id: '2',
    name: 'Teatro Municipal',
    address: 'Praça Ramos de Azevedo, s/n',
    city: 'São Paulo',
    state: 'SP',
    capacity: 1500,
    description: 'Teatro histórico',
    images: [],
    organizerId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { events: 1 },
  },
];

export default function AdminVenues() {
  const [venues, setVenues] = useState<VenueWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const data = await venuesApi.getAll();
      setVenues(data as VenueWithCount[]);
    } catch (error: any) {
      console.warn('Using mock venues:', error);
      setVenues(mockVenues);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este local?')) {
      return;
    }

    try {
      setDeletingId(id);
      await venuesApi.delete(id);
      toast.success('Local deletado com sucesso');
      loadVenues();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar local');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Head><title>Locais - Lumera</title></Head>
        <div className="p-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-lumera-muted">Carregando locais...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Locais - Lumera</title></Head>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meus Locais</h1>
            <p className="text-lumera-muted mt-2">
              Gerencie os locais dos seus eventos
            </p>
          </div>
          <Link href="/admin/venues/create">
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
              Novo Local
            </Button>
          </Link>
        </div>

        {venues.length === 0 ? (
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-lumera-luminoso">
              Nenhum local cadastrado
            </h3>
            <p className="mt-2 text-lumera-muted">
              Cadastre locais para reutilizar em seus eventos!
            </p>
            <Link href="/admin/venues/create">
              <Button className="mt-6">
                Cadastrar Primeiro Local
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <div key={venue.id} className="card p-6">
                {/* Imagem do local */}
                {venue.images && venue.images[0] ? (
                  <img
                    src={venue.images[0]}
                    alt={venue.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-40 bg-lumera-surface-alt rounded-lg mb-4 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-lumera-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                )}

                <h3 className="text-lg font-bold text-lumera-luminoso mb-2">
                  {venue.name}
                </h3>

                <div className="space-y-2 text-sm text-lumera-muted mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{venue.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{venue.city}, {venue.state}</span>
                  </div>
                  {venue.capacity && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Capacidade: {venue.capacity.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>

                {venue._count && (
                  <div className="mb-4">
                    <span className="badge badge-primary">
                      {venue._count.events} evento{venue._count.events !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/admin/venues/${venue.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(venue.id)}
                    isLoading={deletingId === venue.id}
                    className="text-red-400 border-red-400 hover:bg-red-500/10"
                  >
                    Deletar
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
