import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { eventsApi } from '@/services/api';
import { EventCard } from '@/components/event/EventCard';
import { Input } from '@/components/common/Input';
import { Pagination } from '@/components/common/Pagination';
import type { Event } from '@/types';

const ITEMS_PER_PAGE = 12;

export default function Events() {
  const router = useRouter();
  const { category, search, page } = router.query;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState((search as string) || '');
  const [totalEvents, setTotalEvents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const pageNum = parseInt(page as string) || 1;
    setCurrentPage(pageNum);
    loadEvents(pageNum);
  }, [category, search, page]);

  const loadEvents = async (pageNum: number) => {
    setLoading(true);
    try {
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;
      const result = await eventsApi.getAll({
        category: category as string,
        search: search as string,
        limit: ITEMS_PER_PAGE,
        offset: offset,
      });
      setEvents(result.events);
      setTotalEvents(result.total);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/events?search=${searchQuery}&page=1`);
  };

  const handlePageChange = (page: number) => {
    const queryParams = new URLSearchParams();
    if (category) queryParams.set('category', category as string);
    if (search) queryParams.set('search', search as string);
    queryParams.set('page', page.toString());

    router.push(`/events?${queryParams.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>Eventos - Lumera</title>
      </Head>

      <div className="container-custom py-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8" role="search" aria-label="Buscar eventos">
          <div className="relative max-w-2xl mx-auto">
            <Input
              type="text"
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12"
              aria-label="Campo de busca de eventos"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
              aria-label="Buscar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6 text-lumera-obsidian">
          {category ? `Eventos de ${category}` : 'Todos os Eventos'}
        </h1>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-live="polite" aria-label="Carregando eventos">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse" aria-hidden="true">
                <div className="h-48 bg-lumera-surface" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-lumera-surface rounded" />
                  <div className="h-4 bg-lumera-surface rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label={`${events.length} eventos encontrados`}>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </section>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalEvents / ITEMS_PER_PAGE)}
              totalItems={totalEvents}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              showingFrom={(currentPage - 1) * ITEMS_PER_PAGE + 1}
              showingTo={Math.min(currentPage * ITEMS_PER_PAGE, totalEvents)}
            />
          </>
        ) : (
          <div className="text-center py-12" role="status">
            <p className="text-gray-500">Nenhum evento encontrado.</p>
          </div>
        )}
      </div>
    </>
  );
}
