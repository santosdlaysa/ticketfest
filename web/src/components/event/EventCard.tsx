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
    ? Math.min(...event.tickets.map((t) => t.price))
    : 0;

  return (
    <Link href={`/events/${event.slug}`}>
      <div className="card overflow-hidden cursor-pointer group">
        {/* Image */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          {event.images && event.images.length > 0 ? (
            <Image
              src={event.images[0]}
              alt={event.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
              <span className="text-white text-4xl font-bold">
                {event.name.charAt(0)}
              </span>
            </div>
          )}
          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-900">
              {event.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {event.name}
          </h3>

          {/* Date and Location */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
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
              <span>
                {format(eventDate, "dd/MM/yyyy 'às' HH:mm")}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
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
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          {/* Price */}
          {minPrice > 0 && (
            <div className="flex items-baseline">
              <span className="text-xs text-gray-500 mr-1">a partir de</span>
              <span className="text-lg font-bold text-primary-600">
                R$ {minPrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
