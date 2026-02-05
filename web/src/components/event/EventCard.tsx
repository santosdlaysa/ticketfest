import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import type { Event } from '@/types';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const eventDate = new Date(event.date);
  const minPrice = event.tickets && event.tickets.length > 0
    ? Math.min(...event.tickets.map((t) => Number(t.price)))
    : 0;

  return (
    <Link href={`/events/${event.slug}`} aria-label={`Ver detalhes do evento ${event.name}`}>
      <article className="card overflow-hidden cursor-pointer group hover-lift group-hover:shadow-glow">
        {/* Image */}
        <div className="relative h-48 bg-lumera-surface overflow-hidden">
          {event.images && event.images.length > 0 ? (
            <Image
              src={event.images[0]}
              alt={`Imagem do evento ${event.name}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-lumera" aria-label={`Imagem placeholder para ${event.name}`}>
              <span className="text-white text-4xl font-bold" aria-hidden="true">
                {event.name.charAt(0)}
              </span>
            </div>
          )}
          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 bg-lumera-obsidian/70 backdrop-blur-md rounded-full text-xs font-medium text-lumera-luminoso border border-white/[0.1]" aria-label={`Categoria: ${event.category}`}>
              {event.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-lumera-luminoso mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
            {event.name}
          </h3>

          {/* Date and Location */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center text-sm text-lumera-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2 text-secondary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <time dateTime={event.date} aria-label={`Data do evento: ${format(eventDate, "dd/MM/yyyy 'às' HH:mm")}`}>
                {format(eventDate, "dd/MM/yyyy 'às' HH:mm")}
              </time>
            </div>
            <div className="flex items-center text-sm text-lumera-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2 text-accent-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
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
              <span className="line-clamp-1" aria-label={`Local: ${event.location}`}>{event.location}</span>
            </div>
          </div>

          {/* Price */}
          {minPrice > 0 && (
            <div className="flex items-baseline" aria-label={`Preço a partir de R$ ${minPrice.toFixed(2)}`}>
              <span className="text-xs text-lumera-muted mr-1">a partir de</span>
              <span className="text-lg font-bold text-primary-500">
                R$ {minPrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
};
