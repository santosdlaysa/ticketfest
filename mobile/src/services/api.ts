import axios, { InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './secureStorage';
import type {
  User,
  AuthResponse,
  Event,
  Ticket,
  Cart,
  Order,
  PromoterList,
  ListItem,
  PromoterStats,
} from '../types';
import {
  mockEvents,
  mockTickets,
  getMockFeaturedEvents,
  filterMockEvents,
  mockCartOperations,
  mockOrderOperations,
  mockPromoterOperations,
} from './mockData';
import { useLogStore } from '../stores/logStore';

// Flag para usar dados mock (true = mock, false = API real)
const USE_MOCK_DATA = false;

// API URL - use localhost for development (change to production URL when deploying)
const API_URL = __DEV__
  ? 'http://192.168.100.136:3000/api'  // IP local da máquina (localhost não funciona em dispositivos reais)
  : 'https://api.Lumera.com/api'; // Production URL

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Extend config to include our custom properties
interface CustomAxiosConfig extends InternalAxiosRequestConfig {
  _logId?: string;
  _startTime?: number;
}

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  async (config: CustomAxiosConfig) => {
    // Retrieve access token from secure storage
    const token = await secureStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Always add session ID for cart consistency (non-sensitive, use AsyncStorage)
    const sessionId = await AsyncStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }

    // Log the request
    const logStore = useLogStore.getState();
    if (logStore.isEnabled) {
      const logId = logStore.addLog({
        method: (config.method?.toUpperCase() || 'GET') as any,
        url: `${config.baseURL}${config.url}`,
        requestHeaders: config.headers as Record<string, string>,
        requestBody: config.data,
      });
      config._logId = logId;
      config._startTime = Date.now();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh, session ID, and logging
api.interceptors.response.use(
  async (response) => {
    const config = response.config as CustomAxiosConfig;

    // Log the response
    const logStore = useLogStore.getState();
    if (logStore.isEnabled && config._logId) {
      const duration = config._startTime ? Date.now() - config._startTime : undefined;
      logStore.updateLog(config._logId, {
        responseStatus: response.status,
        responseHeaders: response.headers as Record<string, string>,
        responseBody: response.data,
        duration,
        status: 'success',
      });
    }

    // Capture session ID from response headers for guest carts
    const sessionId = response.headers['x-session-id']
      || response.headers['X-Session-Id']
      || response.headers['X-Session-ID'];
    if (sessionId) {
      await AsyncStorage.setItem('sessionId', sessionId);
    }
    return response;
  },
  async (error) => {
    const config = error.config as CustomAxiosConfig;

    // Log the error
    const logStore = useLogStore.getState();
    if (logStore.isEnabled && config?._logId) {
      const duration = config._startTime ? Date.now() - config._startTime : undefined;
      logStore.updateLog(config._logId, {
        responseStatus: error.response?.status,
        responseHeaders: error.response?.headers as Record<string, string>,
        responseBody: error.response?.data,
        duration,
        error: error.message,
        status: 'error',
      });
    }

    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Retrieve refresh token from secure storage
      const refreshToken = await secureStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          // Store new access token securely
          await secureStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token failed, logout user - clear secure storage
          await secureStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          // Navigation to login will be handled by auth store
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Simula delay de rede
const simulateDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract error message from API error response
 * Handles Axios errors and extracts the actual message from the backend
 */
export const getApiErrorMessage = (error: any, defaultMessage: string = 'Ocorreu um erro inesperado.'): string => {
  // Main error field (used by AppError and Zod errors)
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  // Alternative message field
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  // Zod validation details array
  if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
    const firstError = error.response.data.details[0];
    if (firstError?.message) {
      return firstError.message;
    }
  }
  // Generic errors array
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.map((e: any) => e.message || e).join(', ');
  }
  // Axios error message (skip generic status code messages)
  if (error.message && !error.message.includes('status code')) {
    return error.message;
  }
  return defaultMessage;
};

/**
 * Get field-specific errors from API validation response
 * Returns a map of field names to error messages
 */
export const getFieldErrors = (error: any): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};

  if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
    for (const detail of error.response.data.details) {
      if (detail.field && detail.message) {
        fieldErrors[detail.field] = detail.message;
      }
    }
  }

  return fieldErrors;
};

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    name: string;
    cpf?: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return {
        user: {
          id: `user-${Date.now()}`,
          email: data.email,
          name: data.name,
          cpf: data.cpf,
          phone: data.phone,
          role: 'USER',
          createdAt: new Date().toISOString(),
        },
        accessToken: `token-${Date.now()}`,
        refreshToken: `refresh-${Date.now()}`,
      };
    }
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return {
        user: {
          id: 'user-1',
          email: data.email,
          name: 'Usuário Teste',
          role: 'USER',
          createdAt: new Date().toISOString(),
        },
        accessToken: `token-${Date.now()}`,
        refreshToken: `refresh-${Date.now()}`,
      };
    }
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await simulateDelay(100);
      return;
    }
    await api.post('/auth/logout', { refreshToken });
  },

  getProfile: async (): Promise<User> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return {
        id: 'user-1',
        email: 'demo@Lumera.com',
        name: 'Usuário Demo',
        role: 'USER',
        createdAt: new Date().toISOString(),
      };
    }
    const response = await api.get('/auth/profile');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return { message: 'Email enviado com sucesso' };
    }
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetToken: async (token: string): Promise<{ valid: boolean }> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return { valid: true };
    }
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return { message: 'Senha redefinida com sucesso' };
    }
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    cpf?: string;
  }): Promise<User> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return {
        id: 'user-1',
        email: 'demo@lumera.com',
        name: data.name || 'Usuario Demo',
        phone: data.phone,
        cpf: data.cpf,
        role: 'USER',
        createdAt: new Date().toISOString(),
      };
    }
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return { message: 'Senha alterada com sucesso' };
    }
    const response = await api.post('/auth/change-password', data);
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
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return filterMockEvents(params);
    }
    const response = await api.get('/events', { params });
    return response.data;
  },

  getFeatured: async (): Promise<Event[]> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return getMockFeaturedEvents();
    }
    const response = await api.get('/events/featured');
    return response.data;
  },

  getById: async (id: string): Promise<Event> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const event = mockEvents.find(e => e.id === id);
      if (!event) throw new Error('Evento não encontrado');
      return event;
    }
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Event> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const event = mockEvents.find(e => e.slug === slug);
      if (!event) throw new Error('Evento não encontrado');
      return event;
    }
    const response = await api.get(`/events/slug/${slug}`);
    return response.data;
  },

  getByCategory: async (category: string): Promise<Event[]> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockEvents.filter(e => e.category === category);
    }
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
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockTickets[eventId] || [];
    }
    const response = await api.get(`/tickets/event/${eventId}`);
    return response.data;
  },

  getById: async (id: string): Promise<Ticket> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      for (const tickets of Object.values(mockTickets)) {
        const ticket = tickets.find(t => t.id === id);
        if (ticket) return ticket;
      }
      throw new Error('Ingresso não encontrado');
    }
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
    if (USE_MOCK_DATA) {
      await simulateDelay(100);
      return mockCartOperations.getCart();
    }
    const response = await api.get('/cart');
    return response.data;
  },

  add: async (ticketId: string, quantity: number): Promise<Cart> => {
    console.log('[cartApi.add] Iniciando requisição', { ticketId, quantity });
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockCartOperations.addToCart(ticketId, quantity);
    }
    try {
      console.log('[cartApi.add] Fazendo POST para /cart/add');
      const response = await api.post('/cart/add', { ticketId, quantity });
      console.log('[cartApi.add] Resposta:', response.data);
      return response.data;
    } catch (error: any) {
      console.log('[cartApi.add] Erro:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockCartOperations.updateItemQuantity(itemId, quantity);
    }
    const response = await api.put(`/cart/item/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockCartOperations.removeItem(itemId);
    }
    const response = await api.delete(`/cart/item/${itemId}`);
    return response.data;
  },

  clear: async (): Promise<void> => {
    if (USE_MOCK_DATA) {
      await simulateDelay(100);
      mockCartOperations.clearCart();
      return;
    }
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
    if (USE_MOCK_DATA) {
      await simulateDelay(800); // Simula processamento de pagamento
      return mockOrderOperations.createOrder(data);
    }
    const response = await api.post('/orders', data);
    return response.data;
  },

  createCardToken: async (cardData: {
    number: string;
    holderName: string;
    expMonth: number;
    expYear: number;
    cvv: string;
  }): Promise<{ token: string; brand: string; lastFourDigits: string }> => {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      return {
        token: `mock_token_${Date.now()}`,
        brand: 'visa',
        lastFourDigits: cardData.number.slice(-4),
      };
    }
    const response = await api.post('/orders/card-token', cardData);
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const order = mockOrderOperations.getOrderById(id);
      if (!order) throw new Error('Pedido não encontrado');
      return order;
    }
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getUserOrders: async (): Promise<Order[]> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockOrderOperations.getOrders();
    }
    const response = await api.get('/orders');
    return response.data;
  },

  confirmPayment: async (orderId: string, paymentId: string): Promise<Order> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const order = mockOrderOperations.getOrderById(orderId);
      if (!order) throw new Error('Pedido não encontrado');
      return order;
    }
    const response = await api.post(`/orders/${orderId}/confirm-payment`, {
      paymentId,
    });
    return response.data;
  },

  cancel: async (orderId: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      mockOrderOperations.cancelOrder(orderId);
      return;
    }
    await api.post(`/orders/${orderId}/cancel`);
  },
};

// Promoter API
// Validation API (para validar ingressos)
// Endpoints do backend: POST /api/checkin/validate, GET /api/checkin/event/:eventId/stats, GET /api/checkin/event/:eventId/history
export const validationApi = {
  validateTicket: async (
    qrCodeData: string,
    eventId?: string
  ): Promise<{
    status: 'valid' | 'already_used' | 'invalid';
    message: string;
    ticket?: {
      id: string;
      code: string;
      ticketName: string;
      eventId: string;
      eventName: string;
      eventDate?: string;
      eventLocation?: string;
      holderName?: string;
      holderEmail?: string;
      checkedIn: boolean;
      checkedInAt?: string;
    };
    validatedAt: string;
  }> => {
    if (USE_MOCK_DATA) {
      await simulateDelay(800);

      // Primeiro, tenta encontrar o ingresso nos pedidos reais do usuário
      const checkInResult = mockOrderOperations.checkInTicketInstance(qrCodeData);

      if (checkInResult.ticketInstance) {
        // Encontrou o ingresso nos pedidos
        const order = checkInResult.order;
        const item = checkInResult.orderItem;
        const instance = checkInResult.ticketInstance;

        if (checkInResult.alreadyCheckedIn) {
          // Ingresso já foi utilizado
          return {
            status: 'already_used',
            message: 'Este ingresso já foi utilizado',
            ticket: {
              id: instance.id,
              code: instance.qrCode,
              ticketName: item?.ticket?.name || 'Ingresso',
              eventId: order?.eventId || '',
              eventName: order?.event?.name || 'Evento',
              eventDate: order?.event?.date,
              eventLocation: order?.event?.location,
              checkedIn: true,
              checkedInAt: instance.checkedInAt,
            },
            validatedAt: new Date().toISOString(),
          };
        }

        // Check-in realizado com sucesso
        return {
          status: 'valid',
          message: 'Check-in realizado com sucesso',
          ticket: {
            id: instance.id,
            code: instance.qrCode,
            ticketName: item?.ticket?.name || 'Ingresso',
            eventId: order?.eventId || '',
            eventName: order?.event?.name || 'Evento',
            eventDate: order?.event?.date,
            eventLocation: order?.event?.location,
            checkedIn: true,
            checkedInAt: instance.checkedInAt,
          },
          validatedAt: new Date().toISOString(),
        };
      }

      // Fallback: Simula diferentes cenarios baseado no codigo (para testes sem pedidos reais)
      const code = qrCodeData.toUpperCase();

      // Codigo invalido
      if (code.length < 5 || code.includes('INVALID')) {
        return {
          status: 'invalid',
          message: 'QR Code nao reconhecido ou ingresso invalido',
          validatedAt: new Date().toISOString(),
        };
      }

      // Codigo ja usado
      if (code.includes('USED') || code.startsWith('OLD')) {
        return {
          status: 'already_used',
          message: 'Este ingresso ja foi utilizado',
          ticket: {
            id: `ticket-${code}`,
            code: code,
            ticketName: 'Pista Premium',
            eventId: 'event-1',
            eventName: 'Lumera Festival 2024',
            eventDate: new Date(Date.now() + 86400000).toISOString(),
            eventLocation: 'Espaco das Americas, Sao Paulo',
            holderName: 'Maria Silva',
            holderEmail: 'maria@email.com',
            checkedIn: true,
            checkedInAt: new Date(Date.now() - 3600000).toISOString(), // 1h atras
          },
          validatedAt: new Date().toISOString(),
        };
      }

      // Codigo valido - faz check-in (para QR codes de teste)
      return {
        status: 'valid',
        message: 'Check-in realizado com sucesso',
        ticket: {
          id: `ticket-${code}`,
          code: code,
          ticketName: 'VIP Experience',
          eventId: 'event-1',
          eventName: 'Lumera Festival 2024',
          eventDate: new Date(Date.now() + 86400000).toISOString(),
          eventLocation: 'Espaco das Americas, Sao Paulo',
          holderName: 'Joao Santos',
          holderEmail: 'joao@email.com',
          checkedIn: true,
          checkedInAt: new Date().toISOString(),
        },
        validatedAt: new Date().toISOString(),
      };
    }

    // POST /api/checkin/validate
    // Body: { qrCodeData: string, eventId?: string }
    // Response do backend:
    // - valid: boolean
    // - alreadyCheckedIn: boolean
    // - checkedInAt: string
    // - message: string
    // - ticket: { eventName, ticketName, holderName, holderEmail }
    try {
      const response = await api.post('/checkin/validate', {
        qrCodeData,
        eventId,
      });

      const data = response.data;

      // Mapeia a resposta do backend para o formato esperado pelo mobile
      if (data.valid && !data.alreadyCheckedIn) {
        return {
          status: 'valid',
          message: data.message || 'Check-in realizado com sucesso',
          ticket: {
            id: data.ticket?.id || '',
            code: qrCodeData.substring(0, 12), // Primeiros 12 chars como codigo visual
            ticketName: data.ticket?.ticketName || '',
            eventId: eventId || '',
            eventName: data.ticket?.eventName || '',
            holderName: data.ticket?.holderName,
            holderEmail: data.ticket?.holderEmail,
            checkedIn: true,
            checkedInAt: data.checkedInAt,
          },
          validatedAt: new Date().toISOString(),
        };
      } else if (data.alreadyCheckedIn) {
        return {
          status: 'already_used',
          message: data.message || 'Este ingresso ja foi utilizado',
          ticket: {
            id: data.ticket?.id || '',
            code: qrCodeData.substring(0, 12),
            ticketName: data.ticket?.ticketName || '',
            eventId: eventId || '',
            eventName: data.ticket?.eventName || '',
            holderName: data.ticket?.holderName,
            holderEmail: data.ticket?.holderEmail,
            checkedIn: true,
            checkedInAt: data.checkedInAt,
          },
          validatedAt: new Date().toISOString(),
        };
      } else {
        return {
          status: 'invalid',
          message: data.message || 'Ingresso invalido',
          validatedAt: new Date().toISOString(),
        };
      }
    } catch (error: any) {
      // Trata erros da API (400, 404, etc)
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao validar ingresso';
      return {
        status: 'invalid',
        message: errorMessage,
        validatedAt: new Date().toISOString(),
      };
    }
  },

  // Buscar estatisticas de validacao do evento
  // GET /api/checkin/event/:eventId/stats
  getEventValidationStats: async (eventId: string): Promise<{
    totalTickets: number;
    checkedIn: number;
    pending: number;
    percentage: number;
    ticketBreakdown?: Array<{
      name: string;
      sold: number;
      checkedIn: number;
      pending: number;
    }>;
  }> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return {
        totalTickets: 500,
        checkedIn: 127,
        pending: 373,
        percentage: 25.4,
        ticketBreakdown: [
          { name: 'VIP', sold: 100, checkedIn: 45, pending: 55 },
          { name: 'Pista', sold: 400, checkedIn: 82, pending: 318 },
        ],
      };
    }
    const response = await api.get(`/checkin/event/${eventId}/stats`);
    return {
      totalTickets: response.data.totalTickets,
      checkedIn: response.data.checkedIn,
      pending: response.data.pending,
      percentage: response.data.checkInRate,
      ticketBreakdown: response.data.ticketBreakdown,
    };
  },

  // Buscar historico de check-ins do evento
  // GET /api/checkin/event/:eventId/history
  getEventCheckIns: async (eventId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    checkIns: Array<{
      ticketType: string;
      holderName: string;
      holderEmail: string;
      checkedInAt: string;
    }>;
    total: number;
  }> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return {
        checkIns: [
          {
            ticketType: 'VIP',
            holderName: 'Ana Costa',
            holderEmail: 'ana@email.com',
            checkedInAt: new Date(Date.now() - 300000).toISOString(),
          },
          {
            ticketType: 'Pista',
            holderName: 'Carlos Lima',
            holderEmail: 'carlos@email.com',
            checkedInAt: new Date(Date.now() - 600000).toISOString(),
          },
        ],
        total: 127,
      };
    }
    const response = await api.get(`/checkin/event/${eventId}/history`);
    return {
      checkIns: response.data,
      total: response.data.length,
    };
  },
};

export const promoterApi = {
  getMyLists: async (): Promise<PromoterList[]> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockPromoterOperations.getMyLists();
    }
    const response = await api.get('/lists/my');
    return response.data;
  },

  getListsByEvent: async (eventId: string): Promise<PromoterList[]> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockPromoterOperations.getListsByEvent(eventId);
    }
    const response = await api.get(`/lists/event/${eventId}`);
    return response.data;
  },

  getListById: async (listId: string): Promise<PromoterList> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      const list = mockPromoterOperations.getListById(listId);
      if (!list) throw new Error('Lista não encontrada');
      return list;
    }
    const response = await api.get(`/lists/${listId}`);
    return response.data;
  },

  getListItems: async (listId: string): Promise<ListItem[]> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockPromoterOperations.getListItems(listId);
    }
    const response = await api.get(`/lists/${listId}/items`);
    return response.data;
  },

  addItem: async (
    listId: string,
    data: { name: string; phone: string; cpf?: string }
  ): Promise<ListItem> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockPromoterOperations.addItem(listId, data);
    }
    const response = await api.post(`/lists/${listId}/add`, data);
    return response.data;
  },

  removeItem: async (itemId: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      mockPromoterOperations.removeItem(itemId);
      return;
    }
    await api.delete(`/lists/item/${itemId}`);
  },

  getStats: async (): Promise<PromoterStats> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockPromoterOperations.getStats();
    }
    const response = await api.get('/promoter/stats');
    return response.data;
  },

  exportList: async (listId: string): Promise<string> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockPromoterOperations.exportList(listId);
    }
    const response = await api.get(`/lists/${listId}/export`);
    return response.data;
  },

  checkInItem: async (itemId: string): Promise<ListItem> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockPromoterOperations.checkInItem(itemId);
    }
    const response = await api.post(`/lists/item/${itemId}/checkin`);
    return response.data;
  },

  uncheckInItem: async (itemId: string): Promise<ListItem> => {
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockPromoterOperations.uncheckInItem(itemId);
    }
    const response = await api.post(`/lists/item/${itemId}/uncheckin`);
    return response.data;
  },
};

export default api;
