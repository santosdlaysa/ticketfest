import { Ticket } from '../entities/Ticket.js';

export interface ITicketRepository {
  create(ticket: Ticket): Promise<Ticket>;
  findById(id: string): Promise<Ticket | null>;
  findByEventId(eventId: string): Promise<Ticket[]>;
  findManyByIds(ids: string[]): Promise<Ticket[]>;
  update(ticket: Ticket): Promise<Ticket>;
  delete(id: string): Promise<void>;
}
