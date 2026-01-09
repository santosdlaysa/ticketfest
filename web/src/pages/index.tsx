import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { eventsApi } from '@/services/api';
import { EventCard } from '@/components/event/EventCard';
import { Input } from '@/components/common/Input';
import type { Event } from '@/types';

export default function Home() {
  const router = useRouter();
  const { category, search } = router.query;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState((search as string) || '');

  useEffect(() => {
    loadEvents();
  }, [category, search]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await eventsApi.getAll({
        category: category as string,
        search: search as string,
        limit: 50,
      });
      setEvents(result.events);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/?search=${searchQuery}`);
  };

  return (
    <>
      <Head>
        <title>Eventos - Lumera</title>
      </Head>

      <div className="container-custom py-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Input
              type="text"
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6">
          {category ? `Eventos de ${category}` : 'Todos os Eventos'}
        </h1>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum evento encontrado.</p>
          </div>
        )}
      </div>
    </>
  );
}
