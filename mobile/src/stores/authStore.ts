import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../services/api';
import { secureStorage, createSecureStorage } from '../services/secureStorage';
import type { User, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;        // Loading for login/register operations
  isHydrating: boolean;      // Initial app hydration loading

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    cpf?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (data: AuthResponse) => Promise<void>;
  checkAuth: () => Promise<void>;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrating: true,

      hydrate: () => {
        set({ isHydrating: false });
      },

      setAuth: async (data: AuthResponse) => {
        // Store tokens securely and user data in AsyncStorage
        await secureStorage.multiSet([
          ['accessToken', data.accessToken],
          ['refreshToken', data.refreshToken],
          ['user', JSON.stringify(data.user)],
        ]);

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
          await get().setAuth(data);
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const authData = await authApi.register(data);
          await get().setAuth(authData);
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

        // Remove tokens from secure storage
        await secureStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

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
          // Retrieve tokens from secure storage
          const [[, storedToken], [, storedUser], [, storedRefreshToken]] =
            await secureStorage.multiGet(['accessToken', 'user', 'refreshToken']);

          if (storedToken && storedUser && storedRefreshToken) {
            set({
              user: JSON.parse(storedUser),
              accessToken: storedToken,
              refreshToken: storedRefreshToken,
              isAuthenticated: true,
            });
          }
          return;
        }

        try {
          const user = await authApi.getProfile();
          set({ user, isAuthenticated: true });
        } catch (error) {
          await get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => createSecureStorage()),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.hydrate();
      },
    }
  )
);
