// User types
export interface User {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'ORGANIZER';
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Event types
export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  organizerId: string;
  organizer?: {
    id: string;
    name: string;
    email: string;
  };
  tickets?: Ticket[];
  createdAt: string;
  updatedAt: string;
}

// Ticket types
export interface Ticket {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold: number;
  available?: number;
  salesStart: string;
  salesEnd: string;
  features: string[];
  event?: {
    id: string;
    name: string;
    date: string;
    location: string;
  };
}

// Cart types
export interface CartItem {
  id: string;
  quantity: number;
  ticket: Ticket & {
    event: {
      id: string;
      name: string;
      date: string;
      location: string;
      images: string[];
    };
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  eventId: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  couponCode?: string;
  createdAt: string;
  paidAt?: string;
  event: {
    id: string;
    name: string;
    date: string;
    location: string;
    images: string[];
  };
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  ticketId: string;
  quantity: number;
  price: number;
  ticket: {
    id: string;
    name: string;
    price: number;
  };
  ticketInstances?: TicketInstance[];
}

export interface TicketInstance {
  id: string;
  qrCode: string;
  qrCodeData: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

// API Response types
export interface ApiError {
  error: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
