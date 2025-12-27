import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cartApi } from '../services/api';
import type { Cart, CartItem } from '../types';

interface CartState {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (ticketId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  itemCount: 0,
  loading: false,
  error: null,

  fetchCart: async () => {
    try {
      set({ loading: true, error: null });
      const cart = await cartApi.get();
      set({
        cart,
        itemCount: cart.itemCount || cart.items?.length || 0,
        loading: false,
      });
    } catch (error: any) {
      // Cart might not exist for new users, that's ok
      if (error.response?.status === 404) {
        set({ cart: null, itemCount: 0, loading: false });
      } else {
        set({
          error: error.response?.data?.error || 'Erro ao carregar carrinho',
          loading: false,
        });
      }
    }
  },

  addToCart: async (ticketId: string, quantity: number) => {
    console.log('[CartStore] addToCart iniciado', { ticketId, quantity });
    try {
      set({ loading: true, error: null });
      console.log('[CartStore] Chamando API...');
      const cart = await cartApi.add(ticketId, quantity);
      console.log('[CartStore] API retornou:', cart);
      set({
        cart,
        itemCount: cart.itemCount || cart.items?.length || 0,
        loading: false,
      });
      console.log('[CartStore] Estado atualizado, itemCount:', cart.itemCount || cart.items?.length || 0);
    } catch (error: any) {
      console.log('[CartStore] Erro na API:', error.response?.data || error.message);
      set({
        error: error.response?.data?.error || 'Erro ao adicionar ao carrinho',
        loading: false,
      });
      throw error;
    }
  },

  updateItemQuantity: async (itemId: string, quantity: number) => {
    try {
      set({ loading: true, error: null });
      const cart = await cartApi.updateItem(itemId, quantity);
      set({
        cart,
        itemCount: cart.itemCount || cart.items?.length || 0,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Erro ao atualizar quantidade',
        loading: false,
      });
      throw error;
    }
  },

  removeItem: async (itemId: string) => {
    try {
      set({ loading: true, error: null });
      const cart = await cartApi.removeItem(itemId);
      set({
        cart,
        itemCount: cart.itemCount || cart.items?.length || 0,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Erro ao remover item',
        loading: false,
      });
      throw error;
    }
  },

  clearCart: async () => {
    try {
      set({ loading: true, error: null });
      await cartApi.clear();
      set({
        cart: null,
        itemCount: 0,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Erro ao limpar carrinho',
        loading: false,
      });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),
}));
