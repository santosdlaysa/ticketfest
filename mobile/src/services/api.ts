import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User,
  AuthResponse,
  Event,
  Ticket,
  Cart,
  Order,
} from '../types';

// API URL - use localhost for development (change to production URL when deploying)
const API_URL = __DEV__
  ? 'http://localhost:4000/api'  // For Android emulator use: 10.0.2.2:4000
  : 'https://api.ticketfest.com/api'; // Production URL

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

export default api;
