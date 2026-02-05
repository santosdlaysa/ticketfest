import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { eventsApi } from '@/services/api';
import { EventCard } from '@/components/event/EventCard';
import { Pagination } from '@/components/common/Pagination';
import type { Event } from '@/types';

const ITEMS_PER_PAGE = 12;

const HERO_WORDS = ['shows', 'festivais', 'experiencias', 'momentos'];

export default function Events() {
  const router = useRouter();
  const { category, search, page } = router.query;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState((search as string) || '');
  const [totalEvents, setTotalEvents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentWord, setCurrentWord] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Typing animation
  useEffect(() => {
    const word = HERO_WORDS[currentWord];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(word.substring(0, displayText.length + 1));
        if (displayText.length + 1 === word.length) {
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        setDisplayText(word.substring(0, displayText.length - 1));
        if (displayText.length === 0) {
          setIsDeleting(false);
          setCurrentWord((prev) => (prev + 1) % HERO_WORDS.length);
        }
      }
    }, isDeleting ? 50 : 120);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentWord]);

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

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/[0.06] min-h-[420px] md:min-h-[480px] flex items-center">
        {/* Animated background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 via-lumera-obsidian to-lumera-obsidian" aria-hidden="true" />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          aria-hidden="true"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(123,46,255,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-10 left-[10%] w-64 h-64 bg-primary-500/20 rounded-full blur-[100px] animate-float" aria-hidden="true" />
        <div className="absolute bottom-10 right-[10%] w-72 h-72 bg-secondary-500/15 rounded-full blur-[120px] animate-float-slow" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500/10 rounded-full blur-[140px] animate-float" style={{ animationDelay: '3s' }} aria-hidden="true" />

        {/* Horizontal light beam */}
        <div
          className="absolute top-1/2 left-0 right-0 h-px opacity-20"
          aria-hidden="true"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(123,46,255,0.6) 30%, rgba(74,108,255,0.6) 70%, transparent)',
          }}
        />

        {/* Content */}
        <div className="container-custom relative py-16 md:py-20 text-center z-10">
          {/* Brand block */}
          <div className="inline-flex flex-col items-center" style={{ animation: 'scale-in 0.7s cubic-bezier(0.16,1,0.3,1) both' }}>
            {/* Logo icon with glow ring */}
            <div className="relative mb-5">
              <div className="absolute -inset-3 rounded-full opacity-60 blur-xl animate-glow-pulse" style={{ background: 'radial-gradient(circle, rgba(123,46,255,0.4), transparent 70%)' }} aria-hidden="true" />
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-lumera shadow-glow-lg flex items-center justify-center" aria-hidden="true">
                {/* SVG diamond/star icon */}
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" viewBox="0 0 48 48" fill="none">
                  <path d="M24 2L30 18H46L33 28L37 46L24 36L11 46L15 28L2 18H18L24 2Z" fill="currentColor" fillOpacity="0.9" />
                  <path d="M24 8L28.5 19.5H40L30.75 26.5L34 38L24 31L14 38L17.25 26.5L8 19.5H19.5L24 8Z" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Name */}
            <h1 className="animate-text-glow" style={{ animationFillMode: 'both', animationDelay: '0.2s' }}>
              <span className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gradient-lumera">
                Lumera
              </span>
            </h1>

            {/* Decorative line */}
            <div className="mt-3 mb-4 h-[2px] w-24 md:w-32 rounded-full opacity-80" style={{ background: 'linear-gradient(90deg, transparent, #7B2EFF, #4A6CFF, transparent)', animation: 'fade-in 0.8s ease-out 0.5s both' }} aria-hidden="true" />

            {/* Slogan */}
            <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-lumera-muted font-medium" style={{ animation: 'fade-in 0.6s ease-out 0.6s both' }}>
              Uma nova era de brilho
            </p>
          </div>

          {/* Tagline with typing effect */}
          <p className="text-xl md:text-2xl text-lumera-luminoso/90 max-w-2xl mx-auto mt-8 mb-2 font-light" style={{ animation: 'fade-in 0.6s ease-out 0.7s both' }}>
            Descubra{' '}
            <span className="text-primary-400 font-medium">
              {displayText}
              <span className="inline-block w-[2px] h-[1.1em] bg-primary-400 ml-[1px] align-middle animate-pulse" />
            </span>
          </p>

          <p className="text-sm md:text-base text-lumera-muted max-w-lg mx-auto mb-10" style={{ animation: 'fade-in 0.6s ease-out 0.8s both' }}>
            Eventos incriveis, ingressos na palma da mao.
          </p>

          {/* Search bar with animated gradient border */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto" role="search" aria-label="Buscar eventos" style={{ animation: 'slide-up 0.6s ease-out 0.9s both' }}>
            <div className="relative group">
              {/* Animated border glow */}
              <div className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 blur-[1px]" aria-hidden="true" style={{ background: 'linear-gradient(90deg, #7B2EFF, #4A6CFF, #C084FF, #7B2EFF)', backgroundSize: '200% auto', animation: 'border-rotate 3s linear infinite' }} />
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar eventos, shows, festivais..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 text-base bg-white/[0.05] backdrop-blur-md text-lumera-luminoso placeholder:text-lumera-muted border border-white/[0.1] rounded-xl focus:outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500 transition-all"
                  aria-label="Campo de busca de eventos"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-lumera text-white hover:shadow-glow transition-all hover:scale-105 active:scale-95"
                  aria-label="Buscar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </form>

          {/* Quick category pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6" style={{ animation: 'fade-in 0.6s ease-out 1.1s both' }}>
            {['Musica', 'Tecnologia', 'Comedia', 'Esporte'].map((cat) => (
              <button
                key={cat}
                onClick={() => router.push(`/events?category=${cat}`)}
                className="px-4 py-1.5 text-sm text-lumera-luminoso/70 bg-white/[0.04] border border-white/[0.08] rounded-full hover:bg-primary-500/15 hover:text-primary-300 hover:border-primary-500/30 transition-all"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-custom py-8">

        {/* Title */}
        <h2 className="text-2xl font-bold mb-6 text-lumera-luminoso animate-fade-in">
          {category ? `Eventos de ${category}` : 'Todos os Eventos'}
        </h2>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-live="polite" aria-label="Carregando eventos">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" aria-hidden="true">
                <div className="h-48 skeleton rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-6 skeleton rounded" />
                  <div className="h-4 skeleton rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children" aria-label={`${events.length} eventos encontrados`}>
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
            <p className="text-lumera-muted">Nenhum evento encontrado.</p>
          </div>
        )}
      </div>
    </>
  );
}
