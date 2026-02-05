import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/services/api';
import { saveTokens, clearTokens } from '@/lib/axios';
import type { User, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

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
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      setAuth: (data: AuthResponse) => {
        // Save tokens to localStorage for cross-origin requests
        if (data.accessToken && data.refreshToken) {
          saveTokens(data.accessToken, data.refreshToken);
        }
        set({
          user: data.user,
          isAuthenticated: true,
        });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login({ email, password });
          get().setAuth(data);
          return data.user;
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loginMock: (email: string, password: string) => {
        const mockUser: User = {
          id: 'mock-user-id',
          email: email,
          name: email.split('@')[0],
          role: 'ORGANIZER',
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
          get().setAuth(authData);
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await authApi.logout('');
        } catch (error) {
          console.error('Logout error:', error);
        }

        // Clear tokens from localStorage
        clearTokens();

        set({
          user: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        try {
          const user = await authApi.getProfile();
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
          // Só limpa o estado se não houve um login bem-sucedido enquanto o check rodava.
          // Isso evita que uma resposta atrasada de checkAuth sobreponha um login recente.
          const currentState = get();
          if (!currentState.isAuthenticated) {
            set({
              user: null,
              isAuthenticated: false,
            });
          }
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
