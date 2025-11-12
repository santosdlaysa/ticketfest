import { Event, EventStatus } from '../entities/Event.js';

export interface EventFilters {
  category?: string;
  status?: EventStatus;
  organizerId?: string;
  search?: string;
}

export interface IEventRepository {
  create(event: Event): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findBySlug(slug: string): Promise<Event | null>;
  findAll(filters?: EventFilters): Promise<Event[]>;
  update(event: Event): Promise<Event>;
  delete(id: string): Promise<void>;
}
