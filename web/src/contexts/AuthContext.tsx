import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/services/api';
import type { User, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginMock: (email: string, password: string) => void;
  register: (data: {
    email: string;
    password: string;
    name: string;
    cpf?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (data: AuthResponse) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (data: AuthResponse) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login({ email, password });
          get().setAuth(data);
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
          updatedAt: new Date().toISOString(),
        };

        const mockAuthResponse: AuthResponse = {
          user: mockUser,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        };

        get().setAuth(mockAuthResponse);
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const authData = await authApi.register(data);
          get().setAuth(authData);
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const refreshToken = get().refreshToken;

        if (refreshToken) {
          try {
            await authApi.logout(refreshToken);
          } catch (error) {
            console.error('Logout error:', error);
          }
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = get().accessToken;

        if (!token) {
          if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('accessToken');
            const storedUser = localStorage.getItem('user');
            const storedRefreshToken = localStorage.getItem('refreshToken');

            if (storedToken && storedUser && storedRefreshToken) {
              set({
                user: JSON.parse(storedUser),
                accessToken: storedToken,
                refreshToken: storedRefreshToken,
                isAuthenticated: true,
              });
            }
          }
          return;
        }

        try {
          const user = await authApi.getProfile();
          set({ user, isAuthenticated: true });
        } catch (error) {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
