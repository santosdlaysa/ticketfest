import { create } from 'zustand';
import { authApi } from '@/services/api';
import type { User, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<User>;
  loginMock: (email: string, password: string) => User;
  register: (data: {
    email: string;
    password: string;
    name: string;
    cpf?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (data: AuthResponse) => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: (data: AuthResponse) => {
    // Tokens are now stored in httpOnly cookies by the backend
    // We only need to store the user info in the store
    set({
      user: data.user,
      isAuthenticated: true,
    });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login({ email, password });
      // Backend sets httpOnly cookies automatically
      get().setAuth(data);
      return data.user;
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loginMock: (email: string, password: string) => {
    // Mock login - não chama API
    const mockUser: User = {
      id: 'mock-user-id',
      email: email,
      name: email.split('@')[0],
      role: 'ORGANIZER', // ORGANIZER para permitir criar eventos
      createdAt: new Date().toISOString(),
    };

    const mockAuthResponse: AuthResponse = {
      user: mockUser,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    get().setAuth(mockAuthResponse);
    return mockUser;
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const authData = await authApi.register(data);
      // Backend sets httpOnly cookies automatically
      get().setAuth(authData);
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      // Call logout API to clear httpOnly cookies on the backend
      // Note: We don't need to pass refreshToken anymore as it's in the cookie
      await authApi.logout('');
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear user state
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    try {
      // Try to get the user profile using the httpOnly cookie
      // If the cookie exists and is valid, this will succeed
      const user = await authApi.getProfile();
      set({ user, isAuthenticated: true });
      return true;
    } catch (error) {
      // If the request fails, clear the auth state
      set({
        user: null,
        isAuthenticated: false,
      });
      return false;
    }
  },
}));
