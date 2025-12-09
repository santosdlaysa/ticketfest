import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Flag para usar dados mock (true = mock, false = API real)
const USE_MOCK_DATA = true;

// API URL - use localhost for development (change to production URL when deploying)
const API_URL = __DEV__
  ? 'http://localhost:4000/api'  // For Android emulator use: 10.0.2.2:4000
  : 'https://api.Lumera.com/api'; // Production URL

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add session ID for guest carts
    const sessionId = await AsyncStorage.getItem('sessionId');
    if (sessionId && !token) {
      config.headers['X-Session-ID'] = sessionId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token failed, logout user
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
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
    if (USE_MOCK_DATA) {
      await simulateDelay();
      return mockCartOperations.addToCart(ticketId, quantity);
    }
    const response = await api.post('/cart/add', { ticketId, quantity });
    return response.data;
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
  }): Promise<{ order: Order; payment: any }> => {
    if (USE_MOCK_DATA) {
      await simulateDelay(800); // Simula processamento de pagamento
      return mockOrderOperations.createOrder(data);
    }
    const response = await api.post('/orders', data);
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
