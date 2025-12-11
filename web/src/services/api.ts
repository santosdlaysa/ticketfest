import api from '@/lib/axios';
import type {
  User,
  AuthResponse,
  Event,
  Ticket,
  Cart,
  Order,
  OrganizerStats,
  Venue,
  OrdersResponse,
  SalesReport,
  RevenueReport,
  FinancialSummary,
  TransactionsResponse,
  PayoutsResponse,
  AdminOrder,
} from '@/types';

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    name: string;
    cpf?: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Events API
export const eventsApi = {
  getAll: async (params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: Event[]; total: number }> => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getFeatured: async (): Promise<Event[]> => {
    const response = await api.get('/events/featured');
    return response.data;
  },

  getById: async (id: string): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Event> => {
    const response = await api.get(`/events/slug/${slug}`);
    return response.data;
  },

  getByCategory: async (category: string): Promise<Event[]> => {
    const response = await api.get(`/events/category/${category}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description: string;
    date: string;
    endDate?: string;
    location: string;
    address: string;
    latitude?: number;
    longitude?: number;
    category: string;
    images?: string[];
    status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  }): Promise<Event> => {
    const response = await api.post('/events', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Event>): Promise<Event> => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
};

// Tickets API
export const ticketsApi = {
  getByEvent: async (eventId: string): Promise<Ticket[]> => {
    const response = await api.get(`/tickets/event/${eventId}`);
    return response.data;
  },

  getById: async (id: string): Promise<Ticket> => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (data: {
    eventId: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    salesStart: string;
    salesEnd: string;
    features?: string[];
  }): Promise<Ticket> => {
    const response = await api.post('/tickets', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tickets/${id}`);
  },
};

// Cart API
export const cartApi = {
  get: async (): Promise<Cart> => {
    const response = await api.get('/cart');
    return response.data;
  },

  add: async (ticketId: string, quantity: number): Promise<Cart> => {
    const response = await api.post('/cart/add', { ticketId, quantity });
    return response.data;
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    const response = await api.put(`/cart/item/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const response = await api.delete(`/cart/item/${itemId}`);
    return response.data;
  },

  clear: async (): Promise<void> => {
    await api.delete('/cart/clear');
  },
};

// Orders API
export const ordersApi = {
  create: async (data: {
    items: Array<{ ticketId: string; quantity: number }>;
    couponCode?: string;
    paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BOLETO';
    cardToken?: string;
    installments?: number;
  }): Promise<{ order: Order; payment: any }> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getUserOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data;
  },

  confirmPayment: async (orderId: string, paymentId: string): Promise<Order> => {
    const response = await api.post(`/orders/${orderId}/confirm-payment`, {
      paymentId,
    });
    return response.data;
  },

  cancel: async (orderId: string): Promise<void> => {
    await api.post(`/orders/${orderId}/cancel`);
  },
};

// Stats API
export const statsApi = {
  getOrganizerStats: async (): Promise<OrganizerStats> => {
    const response = await api.get('/stats/organizer');
    return response.data;
  },

  getEventStats: async (eventId: string): Promise<any> => {
    const response = await api.get(`/stats/event/${eventId}`);
    return response.data;
  },
};

// Venues API
export const venuesApi = {
  getAll: async (): Promise<Venue[]> => {
    const response = await api.get('/venues');
    return response.data;
  },

  getById: async (id: string): Promise<Venue> => {
    const response = await api.get(`/venues/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
    description?: string;
    images?: string[];
    phone?: string;
    email?: string;
  }): Promise<Venue> => {
    const response = await api.post('/venues', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Venue>): Promise<Venue> => {
    const response = await api.put(`/venues/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/venues/${id}`);
  },
};

// Dashboard Data Types
export interface DashboardData {
  summary: {
    todayRevenue: number;
    todayOrders: number;
    todayTickets: number;
    pendingOrders: number;
    weekRevenue: number;
    weekOrders: number;
    monthRevenue: number;
    monthOrders: number;
    totalRevenue: number;
    totalOrders: number;
    dailyGrowth: number;
  };
  recentOrders: Array<{
    id: string;
    customer: string;
    email: string;
    event: string;
    total: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    name: string;
    date: string;
    location: string;
    ticketsSold: number;
    totalCapacity: number;
    occupancy: number;
  }>;
  topEvents: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
}

// Admin API
export const adminApi = {
  // Dashboard
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Orders
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    eventId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<OrdersResponse> => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  getOrderDetails: async (id: string): Promise<AdminOrder> => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },

  refundOrder: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(`/admin/orders/${id}/refund`);
    return response.data;
  },

  resendOrderEmail: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(`/admin/orders/${id}/resend-email`);
    return response.data;
  },

  // Reports
  getSalesReport: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    eventId?: string;
  }): Promise<SalesReport> => {
    const response = await api.get('/admin/reports/sales', { params });
    return response.data;
  },

  getRevenueReport: async (params?: {
    startDate?: string;
    endDate?: string;
    eventId?: string;
  }): Promise<RevenueReport> => {
    const response = await api.get('/admin/reports/revenue', { params });
    return response.data;
  },

  exportReport: async (params: {
    type: 'orders' | 'sales' | 'revenue';
    format?: 'csv' | 'xlsx';
    startDate?: string;
    endDate?: string;
    eventId?: string;
  }): Promise<Blob> => {
    const response = await api.get('/admin/reports/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Financial
  getFinancialSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FinancialSummary> => {
    const response = await api.get('/admin/financial/summary', { params });
    return response.data;
  },

  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionsResponse> => {
    const response = await api.get('/admin/financial/transactions', { params });
    return response.data;
  },

  // Payouts
  getPayouts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PayoutsResponse> => {
    const response = await api.get('/admin/payouts', { params });
    return response.data;
  },

  approvePayout: async (id: string): Promise<any> => {
    const response = await api.post(`/admin/payouts/${id}/approve`);
    return response.data;
  },

  rejectPayout: async (id: string, reason: string): Promise<{ message: string }> => {
    const response = await api.post(`/admin/payouts/${id}/reject`, { reason });
    return response.data;
  },

  exportEventAttendees: async (eventId: string): Promise<void> => {
    const response = await api.get(`/admin/events/${eventId}/attendees/export`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'participantes.csv';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) {
        filename = match[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// Pagar.me API
export const pagarmeApi = {
  createCardToken: async (data: {
    number: string;
    holderName: string;
    expMonth: number;
    expYear: number;
    cvv: string;
  }): Promise<{ token: string; brand: string; lastFourDigits: string }> => {
    const response = await api.post('/orders/card-token', data);
    return response.data;
  },

  getPublicKey: async (): Promise<{ publicKey: string | null }> => {
    const response = await api.get('/orders/payment-config');
    return response.data;
  },
};
