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

// ========================================
// COMPANY API - Company Settings & Team
// ========================================

export interface CompanySettings {
  companyName?: string;
  tradingName?: string;
  cnpj?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZipCode?: string;
  taxRegime?: string;
}

export interface BankDetails {
  bankCode?: string;
  bankName?: string;
  accountType?: string;
  accountNumber?: string;
  accountDigit?: string;
  agencyNumber?: string;
  agencyDigit?: string;
  holderName?: string;
  holderDocument?: string;
  holderType?: string;
}

export interface CompanySettingsResponse {
  id: string;
  userId: string;
  verified: boolean;
  companySettings: CompanySettings;
  bankDetails: BankDetails;
  availableBalance: number;
  pendingBalance: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
  permissions: string[];
  invitedEmail?: string;
  invitedAt: string;
  acceptedAt?: string;
  isAccepted: boolean;
}

export interface TeamMembersResponse {
  members: TeamMember[];
  pendingInvites: TeamMember[];
  totalMembers: number;
}

export const companyApi = {
  getSettings: async (): Promise<CompanySettingsResponse> => {
    const response = await api.get('/company/settings');
    return response.data;
  },

  updateSettings: async (data: CompanySettings): Promise<CompanySettingsResponse> => {
    const response = await api.put('/company/settings', data);
    return response.data;
  },

  getTeam: async (): Promise<TeamMembersResponse> => {
    const response = await api.get('/company/team');
    return response.data;
  },

  inviteMember: async (data: {
    email: string;
    role?: 'ADMIN' | 'MANAGER' | 'MEMBER';
    permissions?: string[];
  }): Promise<TeamMember> => {
    const response = await api.post('/company/team/invite', data);
    return response.data;
  },

  updateMember: async (
    memberId: string,
    data: { role?: string; permissions?: string[] }
  ): Promise<TeamMember> => {
    const response = await api.put(`/company/team/${memberId}`, data);
    return response.data;
  },

  removeMember: async (memberId: string): Promise<void> => {
    await api.delete(`/company/team/${memberId}`);
  },

  acceptInvite: async (inviteId: string): Promise<any> => {
    const response = await api.post('/company/team/accept', { inviteId });
    return response.data;
  },
};

// ========================================
// TICKET BATCH API - Lotes de Ingressos
// ========================================

export interface TicketBatch {
  id: string;
  ticketId: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  available: number;
  salesStart: string;
  salesEnd: string;
  isActive: boolean;
  isOnSale: boolean;
  isSoldOut: boolean;
  salesProgress: number;
  order: number;
}

export interface TicketBatchesResponse {
  batches: TicketBatch[];
  currentBatch: TicketBatch | null;
  totalQuantity: number;
  totalSold: number;
  totalAvailable: number;
}

export const ticketBatchApi = {
  getByTicket: async (ticketId: string, activeOnly?: boolean): Promise<TicketBatchesResponse> => {
    const response = await api.get(`/tickets/${ticketId}/batches`, {
      params: { activeOnly },
    });
    return response.data;
  },

  create: async (
    ticketId: string,
    data: {
      name: string;
      price: number;
      quantity: number;
      salesStart: string;
      salesEnd: string;
      order?: number;
    }
  ): Promise<TicketBatch> => {
    const response = await api.post(`/tickets/${ticketId}/batches`, data);
    return response.data;
  },

  update: async (
    ticketId: string,
    batchId: string,
    data: Partial<{
      name: string;
      price: number;
      quantity: number;
      salesStart: string;
      salesEnd: string;
      isActive: boolean;
      order: number;
    }>
  ): Promise<TicketBatch> => {
    const response = await api.put(`/tickets/${ticketId}/batches/${batchId}`, data);
    return response.data;
  },

  delete: async (ticketId: string, batchId: string): Promise<void> => {
    await api.delete(`/tickets/${ticketId}/batches/${batchId}`);
  },
};

// ========================================
// CHECK-IN WEB API - Dashboard de Check-in
// ========================================

export interface CheckinStats {
  total: number;
  checkedIn: number;
  pending: number;
  percentageCheckedIn: number;
}

export interface TicketForCheckin {
  id: string;
  qrCode: string;
  ticketName: string;
  attendeeName: string;
  attendeeEmail: string;
  orderDate: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

export interface CheckinSearchResult {
  tickets: TicketForCheckin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CheckinHistoryItem {
  id: string;
  ticketInstanceId: string;
  ticketName: string;
  attendeeName: string;
  attendeeEmail: string;
  checkedInAt: string;
}

export interface ValidateTicketResult {
  valid: boolean;
  ticket: TicketForCheckin | null;
  message: string;
  alreadyCheckedIn: boolean;
}

export const checkinWebApi = {
  getStats: async (eventId: string): Promise<CheckinStats> => {
    const response = await api.get(`/checkin-web/events/${eventId}/stats`);
    return response.data;
  },

  searchTickets: async (
    eventId: string,
    params?: {
      query?: string;
      status?: 'all' | 'checked_in' | 'pending';
      page?: number;
      limit?: number;
    }
  ): Promise<CheckinSearchResult> => {
    const response = await api.get(`/checkin-web/events/${eventId}/tickets`, { params });
    return response.data;
  },

  getHistory: async (eventId: string, limit?: number): Promise<{ history: CheckinHistoryItem[]; total: number }> => {
    const response = await api.get(`/checkin-web/events/${eventId}/history`, {
      params: { limit },
    });
    return response.data;
  },

  validateTicket: async (qrCode: string, performCheckin?: boolean): Promise<ValidateTicketResult> => {
    const response = await api.post('/checkin-web/validate', { qrCode, performCheckin });
    return response.data;
  },

  manualCheckin: async (ticketInstanceId: string): Promise<any> => {
    const response = await api.post(`/checkin-web/tickets/${ticketInstanceId}/checkin`);
    return response.data;
  },

  undoCheckin: async (ticketInstanceId: string): Promise<any> => {
    const response = await api.post(`/checkin-web/tickets/${ticketInstanceId}/undo`);
    return response.data;
  },
};

// ========================================
// PERMISSIONS API - User Permissions Management
// ========================================

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
  permissions: Permission[];
}

export interface UsersWithPermissionsResponse {
  users: UserWithPermissions[];
  total: number;
  totalPages: number;
  page: number;
}

export const permissionsApi = {
  // Get my permissions
  getMyPermissions: async (): Promise<{ permissions: Permission[]; codes: string[] }> => {
    const response = await api.get('/permissions/me');
    return response.data;
  },

  // Check if I have a specific permission
  checkPermission: async (code: string): Promise<{ hasPermission: boolean }> => {
    const response = await api.get(`/permissions/check/${code}`);
    return response.data;
  },

  // Check multiple permissions
  checkPermissions: async (codes: string[]): Promise<Record<string, boolean>> => {
    const response = await api.post('/permissions/check', { codes });
    return response.data;
  },

  // Admin: Get all permissions
  getAllPermissions: async (params?: { module?: string }): Promise<Permission[]> => {
    const response = await api.get('/permissions', { params });
    return response.data;
  },

  // Admin: Get permissions grouped by module
  getPermissionsByModule: async (): Promise<Record<string, Permission[]>> => {
    const response = await api.get('/permissions/grouped');
    return response.data;
  },

  // Admin: Get users with permissions
  getUsersWithPermissions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<UsersWithPermissionsResponse> => {
    const response = await api.get('/permissions/users', { params });
    return response.data;
  },

  // Admin: Get specific user's permissions
  getUserPermissions: async (userId: string): Promise<UserWithPermissions> => {
    const response = await api.get(`/permissions/users/${userId}`);
    return response.data;
  },

  // Admin: Set user's permissions (replace all)
  setUserPermissions: async (
    userId: string,
    permissionIds: string[]
  ): Promise<{ message: string; user: UserWithPermissions }> => {
    const response = await api.put(`/permissions/users/${userId}`, { permissionIds });
    return response.data;
  },

  // Admin: Grant a single permission
  grantPermission: async (
    userId: string,
    data: { permissionId?: string; permissionCode?: string }
  ): Promise<{ message: string }> => {
    const response = await api.post(`/permissions/users/${userId}/grant`, data);
    return response.data;
  },

  // Admin: Revoke a single permission
  revokePermission: async (
    userId: string,
    data: { permissionId?: string; permissionCode?: string }
  ): Promise<{ message: string }> => {
    const response = await api.post(`/permissions/users/${userId}/revoke`, data);
    return response.data;
  },

  // Admin: Create new permission
  createPermission: async (data: {
    code: string;
    name: string;
    description?: string;
    module: string;
  }): Promise<Permission> => {
    const response = await api.post('/permissions', data);
    return response.data;
  },

  // Admin: Update permission
  updatePermission: async (
    id: string,
    data: { name?: string; description?: string; module?: string }
  ): Promise<Permission> => {
    const response = await api.put(`/permissions/permission/${id}`, data);
    return response.data;
  },

  // Admin: Delete permission
  deletePermission: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/permissions/permission/${id}`);
    return response.data;
  },

  // Admin: Run migration (create tables and seed data)
  runMigration: async (): Promise<{ message: string }> => {
    const response = await api.post('/permissions/migrate');
    return response.data;
  },
};
