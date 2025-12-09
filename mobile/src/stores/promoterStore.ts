import { create } from 'zustand';
import { promoterApi } from '../services/api';
import type { PromoterList, ListItem, PromoterStats } from '../types';

interface PromoterState {
  lists: PromoterList[];
  currentList: PromoterList | null;
  currentListItems: ListItem[];
  stats: PromoterStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchMyLists: () => Promise<void>;
  fetchListById: (listId: string) => Promise<void>;
  fetchListItems: (listId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  addItemToList: (listId: string, data: { name: string; phone: string; cpf?: string }) => Promise<void>;
  removeItemFromList: (itemId: string) => Promise<void>;
  checkInItem: (itemId: string) => Promise<void>;
  uncheckInItem: (itemId: string) => Promise<void>;
  clearError: () => void;
}

export const usePromoterStore = create<PromoterState>((set, get) => ({
  lists: [],
  currentList: null,
  currentListItems: [],
  stats: null,
  loading: false,
  error: null,

  fetchMyLists: async () => {
    try {
      set({ loading: true, error: null });
      const lists = await promoterApi.getMyLists();
      set({ lists, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Erro ao carregar listas',
        loading: false,
      });
    }
  },

  fetchListById: async (listId: string) => {
    try {
      set({ loading: true, error: null });
      const list = await promoterApi.getListById(listId);
      set({ currentList: list, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Erro ao carregar lista',
        loading: false,
      });
    }
  },

  fetchListItems: async (listId: string) => {
    try {
      set({ loading: true, error: null });
      const items = await promoterApi.getListItems(listId);
      set({ currentListItems: items, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Erro ao carregar nomes da lista',
        loading: false,
      });
    }
  },

  fetchStats: async () => {
    try {
      set({ loading: true, error: null });
      const stats = await promoterApi.getStats();
      set({ stats, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Erro ao carregar estatísticas',
        loading: false,
      });
    }
  },

  addItemToList: async (listId: string, data: { name: string; phone: string; cpf?: string }) => {
    try {
      set({ loading: true, error: null });
      const newItem = await promoterApi.addItem(listId, data);

      // Update current list items
      const currentItems = get().currentListItems;
      set({
        currentListItems: [...currentItems, newItem],
        loading: false,
      });

      // Update list count
      const lists = get().lists.map(list =>
        list.id === listId
          ? { ...list, currentItems: list.currentItems + 1 }
          : list
      );
      set({ lists });

      // Update current list if it's the one being modified
      const currentList = get().currentList;
      if (currentList?.id === listId) {
        set({ currentList: { ...currentList, currentItems: currentList.currentItems + 1 } });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Erro ao adicionar nome',
        loading: false,
      });
      throw error;
    }
  },

  removeItemFromList: async (itemId: string) => {
    try {
      set({ loading: true, error: null });
      await promoterApi.removeItem(itemId);

      // Find the item to get the listId
      const currentItems = get().currentListItems;
      const removedItem = currentItems.find(item => item.id === itemId);

      // Update current list items
      set({
        currentListItems: currentItems.filter(item => item.id !== itemId),
        loading: false,
      });

      // Update list count
      if (removedItem) {
        const lists = get().lists.map(list =>
          list.id === removedItem.listId
            ? { ...list, currentItems: Math.max(0, list.currentItems - 1) }
            : list
        );
        set({ lists });

        // Update current list if it's the one being modified
        const currentList = get().currentList;
        if (currentList?.id === removedItem.listId) {
          set({ currentList: { ...currentList, currentItems: Math.max(0, currentList.currentItems - 1) } });
        }
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Erro ao remover nome',
        loading: false,
      });
      throw error;
    }
  },

  checkInItem: async (itemId: string) => {
    try {
      set({ error: null });
      const updatedItem = await promoterApi.checkInItem(itemId);

      // Update current list items
      const currentItems = get().currentListItems.map(item =>
        item.id === itemId ? updatedItem : item
      );
      set({ currentListItems: currentItems });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Erro ao fazer check-in',
      });
      throw error;
    }
  },

  uncheckInItem: async (itemId: string) => {
    try {
      set({ error: null });
      const updatedItem = await promoterApi.uncheckInItem(itemId);

      // Update current list items
      const currentItems = get().currentListItems.map(item =>
        item.id === itemId ? updatedItem : item
      );
      set({ currentListItems: currentItems });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Erro ao desfazer check-in',
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
