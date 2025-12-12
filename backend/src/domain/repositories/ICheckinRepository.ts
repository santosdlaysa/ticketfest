export interface CheckinStats {
  total: number;
  checkedIn: number;
  pending: number;
  percentageCheckedIn: number;
}

export interface CheckinHistoryItem {
  id: string;
  ticketInstanceId: string;
  ticketName: string;
  attendeeName: string;
  attendeeEmail: string;
  checkedInAt: Date;
  checkedInBy?: string;
}

export interface TicketForCheckin {
  id: string;
  qrCode: string;
  ticketName: string;
  attendeeName: string;
  attendeeEmail: string;
  orderDate: Date;
  checkedIn: boolean;
  checkedInAt?: Date;
}

export interface CheckinSearchParams {
  eventId: string;
  query?: string;
  status?: 'all' | 'checked_in' | 'pending';
  page?: number;
  limit?: number;
}

export interface CheckinSearchResult {
  tickets: TicketForCheckin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ICheckinRepository {
  getEventStats(eventId: string): Promise<CheckinStats>;
  getCheckinHistory(eventId: string, limit?: number): Promise<CheckinHistoryItem[]>;
  searchTickets(params: CheckinSearchParams): Promise<CheckinSearchResult>;
  findTicketByQRCode(qrCode: string): Promise<TicketForCheckin | null>;
  findTicketById(ticketInstanceId: string): Promise<TicketForCheckin | null>;
  performCheckin(ticketInstanceId: string, checkedInBy?: string): Promise<void>;
  undoCheckin(ticketInstanceId: string): Promise<void>;
  getEventTicketsByStatus(eventId: string, checkedIn: boolean): Promise<TicketForCheckin[]>;
}
