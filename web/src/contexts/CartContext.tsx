import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '@/services/api';
import type { Cart, CartItem } from '@/types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (ticketId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getSessionId: () => string;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,

      getSessionId: () => {
        if (typeof window === 'undefined') return '';

        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
      },

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          // Ensure session ID exists for guest users
          get().getSessionId();
          const cart = await cartApi.get();
          set({ cart });
        } catch (error) {
          console.error('Error fetching cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addToCart: async (ticketId: string, quantity: number) => {
        set({ isLoading: true });
        try {
          get().getSessionId();
          const cart = await cartApi.add(ticketId, quantity);
          set({ cart });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        set({ isLoading: true });
        try {
          const cart = await cartApi.updateItem(itemId, quantity);
          set({ cart });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (itemId: string) => {
        set({ isLoading: true });
        try {
          const cart = await cartApi.removeItem(itemId);
          set({ cart });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: async () => {
        set({ isLoading: true });
        try {
          await cartApi.clear();
          set({ cart: null });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);
